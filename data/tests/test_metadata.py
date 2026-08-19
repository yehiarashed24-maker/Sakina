import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / 'processed'


def test_metadata_exists():
    meta = PROCESSED / 'metadata.json'
    assert meta.exists(), 'metadata.json missing'
    m = json.loads(meta.read_text(encoding='utf-8'))
    assert 'generated_at' in m
