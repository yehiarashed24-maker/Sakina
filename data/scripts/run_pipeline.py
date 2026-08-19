"""
Run the full pipeline in deterministic order:
1. discover PDFs
2. validate PDFs (basic count)
3. extract text
4. normalize text
5. generate document records
6. chunk documents
7. validate chunks
8. generate embeddings
9. upsert into vector database
10. validate vector database
11. generate reports
"""
import logging
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / 'scripts'

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')
logger = logging.getLogger('run')

steps = [
    ('DISCOVERY', ['python', str(SCRIPTS / 'inspect_pdfs.py')]),
    ('INGESTION', ['python', str(SCRIPTS / 'ingest_pdfs.py')]),
    ('CHUNKING', ['python', str(SCRIPTS / 'chunk_documents.py')]),
    ('EMBEDDING', ['python', str(SCRIPTS / 'generate_embeddings.py')]),
    ('VALIDATION', ['python', str(SCRIPTS / 'validate_data.py')])
]

if __name__ == '__main__':
    for name, cmd in steps:
        logger.info(f'[{name}] Running: {cmd}')
        r = subprocess.run(cmd, cwd=str(ROOT))
        if r.returncode != 0:
            logger.error('[%s] Step failed with exit code %d', name, r.returncode)
            sys.exit(r.returncode)
    logger.info('[COMPLETE] Pipeline finished successfully')
