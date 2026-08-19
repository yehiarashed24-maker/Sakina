"""
Ingest PDFs from data/raw, extract page-by-page text, produce processed/documents.jsonl and a metadata.json
"""
import os
import sys
import json
import hashlib
from pathlib import Path
from datetime import datetime
import logging
import unicodedata
from typing import List, Dict

from PyPDF2 import PdfReader

# config
ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / 'config' / 'rag_config.yaml'
import yaml
config = yaml.safe_load(CONFIG_PATH.read_text())

RAW = ROOT / 'raw'
PROCESSED = ROOT / 'processed'
REPORTS = ROOT / 'reports'
FAILED = ROOT / 'failed'

PROCESSED.mkdir(parents=True, exist_ok=True)
REPORTS.mkdir(parents=True, exist_ok=True)
FAILED.mkdir(parents=True, exist_ok=True)

logger = logging.getLogger('ingest')
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


def normalize_text(text: str) -> str:
    # Unicode normalize (NFC), remove repeated whitespace but preserve paragraphs
    if text is None:
        return ''
    t = unicodedata.normalize('NFC', text)
    # replace Windows newlines
    t = t.replace('\r\n', '\n').replace('\r', '\n')
    # collapse multiple spaces but preserve paragraph breaks
    paragraphs = [p.strip() for p in t.split('\n\n')]
    paragraphs = [" ".join(p.split()) for p in paragraphs if p.strip()]
    return '\n\n'.join(paragraphs)


def document_id_for_file(path: Path) -> str:
    # deterministic: sha256 of file bytes
    return sha256(path)


def ingest_all():
    logger.info('[DISCOVERY] Discovering PDFs in %s', RAW)
    pdfs = sorted([p for p in RAW.glob('*.pdf')])
    logger.info('[DISCOVERY] Found %d PDFs', len(pdfs))

    documents = []
    failed = []

    for p in pdfs:
        logger.info('[EXTRACTION] Processing %s', p.name)
        doc = {
            'document_id': document_id_for_file(p),
            'filename': p.name,
            'source': str(p.resolve()),
            'page_count': 0,
            'language': 'unknown',
            'pages': []
        }
        try:
            reader = PdfReader(str(p))
            num = len(reader.pages)
            doc['page_count'] = num
            arabic_chars = 0
            latin_chars = 0
            for i in range(num):
                try:
                    page = reader.pages[i]
                    text = page.extract_text()
                except Exception:
                    text = None
                t = text or ''
                t_norm = normalize_text(t)
                needs_ocr = False
                if len(t_norm.strip()) == 0:
                    needs_ocr = True
                doc['pages'].append({
                    'page_number': i+1,
                    'text': t_norm,
                    'needs_ocr': needs_ocr
                })
                # simple language heuristic
                if any('\u0600' <= ch <= '\u06FF' for ch in t_norm):
                    arabic_chars += 1
                if any(('a' <= ch.lower() <= 'z') for ch in t_norm):
                    latin_chars += 1
            if arabic_chars and latin_chars:
                doc['language'] = 'mixed'
            elif arabic_chars:
                doc['language'] = 'arabic'
            else:
                doc['language'] = 'english'

            documents.append(doc)
        except Exception as e:
            logger.error('[EXTRACTION] Failed %s: %s', p.name, e)
            failed.append({'filename': p.name, 'error': str(e)})

    # write documents.jsonl
    docs_out = PROCESSED / 'documents.jsonl'
    with docs_out.open('w', encoding='utf-8') as f:
        for d in documents:
            f.write(json.dumps(d, ensure_ascii=False) + '\n')
    # write metadata.json (hashes, counts)
    metadata = {
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'document_count': len(documents),
        'failed': failed
    }
    meta_path = PROCESSED / 'metadata.json'
    meta_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding='utf-8')

    # write failed documents
    failed_path = FAILED / 'failed_documents.json'
    failed_path.write_text(json.dumps(failed, indent=2, ensure_ascii=False), encoding='utf-8')

    # write ingestion report
    report = {
        'discovered': len(pdfs),
        'processed': len(documents),
        'failed': len(failed)
    }
    report_path = REPORTS / 'ingestion_report.json'
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')

    logger.info('[COMPLETE] Ingested %d documents, %d failed', len(documents), len(failed))


if __name__ == '__main__':
    ingest_all()
