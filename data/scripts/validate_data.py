"""
Validate the processed data and vector store according to requirements.
"""
import json
from pathlib import Path
import yaml
import logging
import sys
# ensure project root on path
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from rag.vectorstore import VectorStore

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / 'config' / 'rag_config.yaml'
config = yaml.safe_load(CONFIG_PATH.read_text())

RAW = ROOT / 'raw'
PROCESSED = ROOT / 'processed'
REPORTS = ROOT / 'reports'
VECTOR_DIR = ROOT / 'vector_store'
FAILED = ROOT / 'failed'

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')
logger = logging.getLogger('validate')


def validate_all():
    issues = []
    expected = config['processing']['expected_pdf_count']

    pdfs = list(RAW.glob('*.pdf'))
    if len(pdfs) != expected:
        issues.append({'level': 'critical', 'message': f'Expected {expected} PDFs but found {len(pdfs)} in {RAW}'})

    docs_file = PROCESSED / 'documents.jsonl'
    if not docs_file.exists():
        issues.append({'level': 'critical', 'message': 'documents.jsonl missing. Run ingestion.'})
    else:
        docs = [json.loads(l) for l in docs_file.open(encoding='utf-8')]
        if not docs:
            issues.append({'level': 'critical', 'message': 'No documents in documents.jsonl'})
        # check empty pages and ocr-needed
        empty_docs = [d['filename'] for d in docs if all(p['needs_ocr'] for p in d['pages'])]
        if empty_docs:
            issues.append({'level': 'warning', 'message': f'Documents with all pages empty (OCR needed): {empty_docs}'})

    chunks_file = PROCESSED / 'chunks.jsonl'
    if not chunks_file.exists():
        issues.append({'level': 'critical', 'message': 'chunks.jsonl missing. Run chunking.'})
    else:
        chunks = [json.loads(l) for l in chunks_file.open(encoding='utf-8')]
        # extremely short or large chunks
        short = [c['chunk_id'] for c in chunks if len(c.get('text','')) < config['chunking']['min_chunk_chars']]
        large = [c['chunk_id'] for c in chunks if len(c.get('text','')) > config['chunking']['max_chunk_chars']]
        dup_ids = [cid for cid, cnt in __import__('collections').Counter([c['chunk_id'] for c in chunks]).items() if cnt > 1]
        if short:
            issues.append({'level': 'warning', 'message': f'Extremely short chunks: {len(short)}'})
        if large:
            issues.append({'level': 'warning', 'message': f'Extremely large chunks: {len(large)}'})
        if dup_ids:
            issues.append({'level': 'critical', 'message': f'Duplicate chunk IDs found: {len(dup_ids)}'})

    # vector store validation
    vs = VectorStore(str(VECTOR_DIR))
    count = vs.count()
    if chunks_file.exists():
        chunks_count = sum(1 for _ in chunks_file.open('r', encoding='utf-8'))
        if count != chunks_count:
            issues.append({'level': 'warning', 'message': f'Vector count ({count}) != chunk count ({chunks_count})'})

    report = {
        'issues': issues
    }
    (REPORTS / 'quality_report.json').write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    if any(i['level']=='critical' for i in issues):
        logger.error('[VALIDATION] Critical issues found. See %s', REPORTS / 'quality_report.json')
        raise SystemExit(3)
    else:
        logger.info('[VALIDATION] Validation passed with %d issues', len(issues))


if __name__ == '__main__':
    validate_all()
