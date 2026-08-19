import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / 'processed'


def test_chunks_exist():
    chunks = PROCESSED / 'chunks.jsonl'
    assert chunks.exists(), 'chunks.jsonl not found'
    count = sum(1 for _ in chunks.open('r', encoding='utf-8'))
    assert count > 0, 'No chunks generated'
