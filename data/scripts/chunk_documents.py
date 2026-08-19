"""
Chunk documents from processed/documents.jsonl into processed/chunks.jsonl
Deterministic chunk IDs using sha256(document_id + page_start + page_end + text)
"""
import json
from pathlib import Path
import hashlib
import logging
from typing import List
import yaml

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / 'config' / 'rag_config.yaml'
config = yaml.safe_load(CONFIG_PATH.read_text())

PROCESSED = ROOT / 'processed'
REPORTS = ROOT / 'reports'
PROCESSED.mkdir(parents=True, exist_ok=True)
REPORTS.mkdir(parents=True, exist_ok=True)

logger = logging.getLogger('chunk')
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')

CHUNK_SIZE = config['chunking']['chunk_size_chars']
CHUNK_OVERLAP = config['chunking']['chunk_overlap_chars']
MIN_CHARS = config['chunking']['min_chunk_chars']
MAX_CHARS = config['chunking']['max_chunk_chars']


def sha256_str(s: str) -> str:
    return hashlib.sha256(s.encode('utf-8')).hexdigest()


def chunk_paragraphs(paragraphs: List[str]) -> List[str]:
    # Greedy aggregation of paragraphs up to CHUNK_SIZE, preserving paragraphs and headings
    chunks = []
    current = ''
    for p in paragraphs:
        if not p:
            continue
        if len(current) == 0:
            candidate = p
        else:
            candidate = current + '\n\n' + p
        if len(candidate) <= CHUNK_SIZE:
            current = candidate
        else:
            # finalize current if large enough
            if len(current) >= MIN_CHARS:
                chunks.append(current)
                current = p
            else:
                # current small but candidate exceeded; accept candidate as one chunk
                chunks.append(candidate)
                current = ''
    if current:
        chunks.append(current)
    # post-process to split very large chunks
    out = []
    for c in chunks:
        if len(c) > MAX_CHARS:
            # split by sentences roughly: fall back to chunk by characters preserving overlap
            start = 0
            while start < len(c):
                end = min(len(c), start + CHUNK_SIZE)
                out.append(c[start:end])
                start = end - CHUNK_OVERLAP if end - CHUNK_OVERLAP > start else end
        else:
            out.append(c)
    return out


def make_chunks():
    docs_file = PROCESSED / 'documents.jsonl'
    if not docs_file.exists():
        logger.error('Processed documents.jsonl not found. Run ingest first.')
        return

    chunks_out = PROCESSED / 'chunks.jsonl'
    chunks = []
    chunk_count = 0
    with docs_file.open('r', encoding='utf-8') as f_in, chunks_out.open('w', encoding='utf-8') as f_out:
        for line in f_in:
            d = json.loads(line)
            doc_id = d['document_id']
            filename = d['filename']
            pages = d['pages']
            # For each page, split into paragraphs by double newlines or single newline if no double
            for p in pages:
                page_num = p['page_number']
                text = p.get('text','')
                if not text:
                    paragraphs = []
                else:
                    if '\n\n' in text:
                        paragraphs = [seg.strip() for seg in text.split('\n\n') if seg.strip()]
                    else:
                        paragraphs = [seg.strip() for seg in text.split('\n') if seg.strip()]
                # chunk paragraphs but preserve page boundaries (chunks won't cross pages)
                page_chunks = chunk_paragraphs(paragraphs)
                for idx, ctext in enumerate(page_chunks):
                    # build deterministic chunk id
                    key = doc_id + '::' + str(page_num) + '::' + str(idx) + '::' + ctext
                    chunk_id = sha256_str(key)
                    chunk = {
                        'chunk_id': chunk_id,
                        'document_id': doc_id,
                        'filename': filename,
                        'page_start': page_num,
                        'page_end': page_num,
                        'text': ctext,
                        'language': d.get('language','english'),
                        'metadata': {}
                    }
                    f_out.write(json.dumps(chunk, ensure_ascii=False) + '\n')
                    chunk_count += 1
    logger.info('[CHUNKING] Wrote %d chunks to %s', chunk_count, chunks_out)


if __name__ == '__main__':
    make_chunks()
