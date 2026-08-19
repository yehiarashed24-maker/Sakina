import pytest
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'raw'
CONFIG = ROOT / 'config' / 'rag_config.yaml'


def test_expected_pdfs_present():
    pdfs = list(RAW.glob('*.pdf'))
    cfg = yaml.safe_load(CONFIG.read_text())
    expected = cfg['processing']['expected_pdf_count']
    assert len(pdfs) == expected, f'Expected {expected} PDFs in data/raw, found {len(pdfs)}'
