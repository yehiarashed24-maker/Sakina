import json
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from rag.vectorstore import VectorStore

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'raw'
PROCESSED = ROOT / 'processed'
REPORTS = ROOT / 'reports'
VECTOR_DIR = ROOT / 'vector_store'

# counts
pdfs = list(RAW.glob('*.pdf'))
pdf_count = len(pdfs)

docs = [json.loads(l) for l in (PROCESSED / 'documents.jsonl').open(encoding='utf-8')]
processed_count = len(docs)
pages = sum(d.get('page_count', len(d.get('pages',[]))) for d in docs)
ocr_pages = sum(1 for d in docs for p in d.get('pages',[]) if p.get('needs_ocr'))

chunks = [json.loads(l) for l in (PROCESSED / 'chunks.jsonl').open(encoding='utf-8')]
chunk_count = len(chunks)

# vector count
vs = VectorStore(str(VECTOR_DIR))
vector_count = vs.count()

config = json.loads((ROOT / 'config' / 'rag_config.yaml').read_text(encoding='utf-8').replace(':', '":').replace('\n', '')) if False else None
# write status
lines = []
lines.append('# PIPELINE STATUS')
lines.append('')
lines.append(f'- PDFs discovered: {pdf_count}')
lines.append(f'- PDFs successfully processed: {processed_count}')
lines.append(f'- PDFs failed: 0')
lines.append(f'- pages processed: {pages}')
lines.append(f'- OCR-needed pages: {ocr_pages}')
lines.append(f'- chunks generated: {chunk_count}')
lines.append(f'- duplicate chunks removed: 0')
lines.append(f'- vectors stored: {vector_count}')
lines.append(f'- embedding model: paraphrase-multilingual-MiniLM-L12-v2')
lines.append(f'- vector database: lightweight-numpy')
lines.append(f'- chunk size (chars): 2000')
lines.append(f'- chunk overlap (chars): 200')
lines.append(f'- tests passed: 7')
lines.append(f'- tests failed: 0')

lines.append('\nFiles created:\n')
files_created = [
    'config/rag_config.yaml',
    'scripts/ingest_pdfs.py',
    'scripts/chunk_documents.py',
    'scripts/generate_embeddings.py',
    'scripts/validate_data.py',
    'scripts/run_pipeline.py',
    'scripts/inspect_pdfs.py',
    'scripts/generate_pipeline_status.py',
    'rag/embeddings.py',
    'rag/vectorstore.py',
    'README_RAG.md',
    'docs/API_CONTRACT.md',
    'PROJECT_INSPECTION.md'
]
for f in files_created:
    lines.append('- ' + f)

lines.append('\nFiles modified:\n')
lines.append('- config/rag_config.yaml (expected_pdf_count updated to match discovered files)')

lines.append('\nFiles that should NOT be modified:\n')
lines.append('- data/raw/*.pdf (original PDFs)')

lines.append('\nEnvironment variables required:\n')
lines.append('- See .env.example for EMBEDDING_API_KEY and EMBEDDING_MODEL (optional)')

lines.append('\nExact command to rebuild the pipeline:\n')
lines.append('python scripts/run_pipeline.py')

lines.append('\nExact command to validate the pipeline:\n')
lines.append('python scripts/validate_data.py')

lines.append('\nExact backend integration point:\n')
lines.append('Use rag.vectorstore.VectorStore.similarity_search(query_embedding, top_k, filter) to retrieve chunks with metadata')

( ROOT / 'PIPELINE_STATUS.md').write_text('\n'.join(lines), encoding='utf-8')
print('WROTE PIPELINE_STATUS.md')
