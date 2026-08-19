import sys
import os
from pathlib import Path
import hashlib
import json
from collections import Counter

try:
    from PyPDF2 import PdfReader
except Exception as e:
    print("MISSING_DEPENDENCY: PyPDF2 not installed. Run: pip install PyPDF2")
    sys.exit(2)

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT

REPORT_MD = ROOT / 'PROJECT_INSPECTION.md'

pdf_files = sorted([p for p in DATA_DIR.glob('*.pdf') if p.is_file()])

inspection = {
    'total_pdfs_found': len(pdf_files),
    'files': []
}

arabic_ranges = [
    (0x0600, 0x06FF),
    (0x0750, 0x077F),
    (0x08A0, 0x08FF),
    (0xFB50, 0xFDFF),
    (0xFE70, 0xFEFF)
]

def has_arabic(text):
    for ch in text:
        o = ord(ch)
        for a,b in arabic_ranges:
            if a <= o <= b:
                return True
    return False


def sha256(path: Path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()

for p in pdf_files:
    info = {
        'filename': p.name,
        'path': str(p),
        'sha256': None,
        'page_count': None,
        'pages': [],
        'language': None,
        'duplicate_of': None,
        'corrupted': False,
    }
    try:
        info['sha256'] = sha256(p)
        reader = PdfReader(str(p))
        num = len(reader.pages)
        info['page_count'] = num
        arabic_count = 0
        latin_count = 0
        empty_pages = 0
        needs_ocr_pages = []
        for i in range(num):
            page = reader.pages[i]
            try:
                text = page.extract_text()
            except Exception:
                text = None
            if text is None:
                t = ''
            else:
                t = text
            t_stripped = t.strip()
            page_rec = {
                'page_number': i+1,
                'text_length': len(t_stripped),
                'has_text': bool(t_stripped),
                'needs_ocr': False,
            }
            if not t_stripped:
                page_rec['needs_ocr'] = True
                needs_ocr_pages.append(i+1)
                empty_pages += 1
            else:
                if has_arabic(t_stripped):
                    arabic_count += 1
                # crude Latin detection
                latin_chars = sum(1 for ch in t_stripped if 'a' <= ch.lower() <= 'z')
                if latin_chars > 0:
                    latin_count += 1
            info['pages'].append(page_rec)
        if arabic_count > 0 and latin_count > 0:
            info['language'] = 'mixed'
        elif arabic_count > 0:
            info['language'] = 'arabic'
        else:
            info['language'] = 'english'
        info['needs_ocr_pages'] = needs_ocr_pages
    except Exception as e:
        info['corrupted'] = True
        info['error'] = str(e)
    inspection['files'].append(info)

# detect duplicates by sha256
hash_to_files = {}
for f in inspection['files']:
    h = f.get('sha256')
    if not h:
        continue
    hash_to_files.setdefault(h, []).append(f['filename'])

for h, files in hash_to_files.items():
    if len(files) > 1:
        for fname in files[1:]:
            for f in inspection['files']:
                if f['filename'] == fname:
                    f['duplicate_of'] = files[0]

# write markdown report
lines = []
lines.append('# PROJECT INSPECTION')
lines.append('')
lines.append(f'Total PDF files discovered in data/: {inspection["total_pdfs_found"]}')
lines.append('')
for f in inspection['files']:
    lines.append(f'## {f["filename"]}')
    lines.append('- Path: ' + f.get('path',''))
    lines.append('- SHA256: ' + (f.get('sha256') or ''))
    lines.append('- Corrupted: ' + str(f.get('corrupted', False)))
    if f.get('corrupted'):
        lines.append('- Error: ' + f.get('error',''))
    lines.append('- Page count: ' + str(f.get('page_count')))
    lines.append('- Language (heuristic): ' + str(f.get('language')))
    needs = f.get('needs_ocr_pages', [])
    lines.append('- OCR-needed pages: ' + (', '.join(map(str, needs)) if needs else 'None'))
    dup = f.get('duplicate_of')
    lines.append('- Duplicate of: ' + (dup if dup else 'None'))
    empty_pages = [p['page_number'] for p in f.get('pages',[]) if p.get('text_length',0)==0]
    lines.append('- Empty pages: ' + (', '.join(map(str, empty_pages)) if empty_pages else 'None'))
    lines.append('')

REPORT_MD.write_text('\n'.join(lines), encoding='utf-8')
print('WROTE', REPORT_MD)
print('Inspection summary:')
print(json.dumps(inspection, indent=2, ensure_ascii=False))

# copy originals to project data/raw safely
PROJECT_ROOT = ROOT.parent
PROJECT_DATA = PROJECT_ROOT / 'data'
PROJECT_DATA.mkdir(exist_ok=True)
RAW_TARGET = PROJECT_DATA / 'raw'
RAW_TARGET.mkdir(parents=True, exist_ok=True)

copied = []
from shutil import copy2
for p in pdf_files:
    dest = RAW_TARGET / p.name
    if not dest.exists():
        try:
            copy2(p, dest)
            copied.append(p.name)
        except Exception as e:
            print('COPY_FAILED', p, e)

print('Copied to data/raw:', copied)

# Also dump a JSON with full inspection
json_path = PROJECT_DATA / 'reports' / 'inspection_full.json'
json_path.parent.mkdir(parents=True, exist_ok=True)
json_path.write_text(json.dumps(inspection, indent=2, ensure_ascii=False), encoding='utf-8')
print('WROTE', json_path)
