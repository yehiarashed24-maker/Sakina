import hashlib
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / 'processed'


def test_document_id_stable():
    docs = [json.loads(l) for l in (PROCESSED / 'documents.jsonl').open(encoding='utf-8')]
    for d in docs:
        # recompute sha256 of the source file path
        path = Path(d['source'])
        with path.open('rb') as f:
            data = f.read()
        h = hashlib.sha256(data).hexdigest()
        assert h == d['document_id']


def test_chunk_ids_unique():
    chunks = [json.loads(l) for l in (PROCESSED / 'chunks.jsonl').open(encoding='utf-8')]
    ids = [c['chunk_id'] for c in chunks]
    assert len(ids) == len(set(ids))
