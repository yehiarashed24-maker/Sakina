"""
Generate embeddings for processed/chunks.jsonl and upsert into vector store.
"""
import json
from pathlib import Path
import yaml
import logging
import sys
# ensure project root is on sys.path so local rag package can be imported
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from rag.embeddings import get_provider
from rag.vectorstore import VectorStore

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / 'config' / 'rag_config.yaml'
config = yaml.safe_load(CONFIG_PATH.read_text())

PROCESSED = ROOT / 'processed'
VECTOR_DIR = ROOT / 'vector_store'
VECTOR_DIR.mkdir(parents=True, exist_ok=True)

logger = logging.getLogger('embeddings')
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')


def generate_and_upsert():
    chunks_file = PROCESSED / 'chunks.jsonl'
    if not chunks_file.exists():
        logger.error('chunks.jsonl not found. Run chunking first.')
        return

    provider = get_provider(config['embedding']['provider'], config['embedding']['model'])
    vs = VectorStore(str(VECTOR_DIR))

    ids = []
    texts = []
    metadatas = []
    documents = []

    with chunks_file.open('r', encoding='utf-8') as f:
        for line in f:
            c = json.loads(line)
            ids.append(c['chunk_id'])
            texts.append(c['text'])
            metadatas.append({
                'document_id': c['document_id'],
                'filename': c['filename'],
                'page_start': c['page_start'],
                'page_end': c['page_end'],
                'language': c.get('language')
            })
            documents.append(c['text'])

    logger.info('[EMBEDDING] Encoding %d chunks', len(texts))
    embeddings = provider.embed_texts(texts)
    logger.info('[EMBEDDING] Upserting into vector store')
    vs.upsert(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents)
    logger.info('[VECTORSTORE] Now contains %d entries', vs.count())


if __name__ == '__main__':
    try:
        generate_and_upsert()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise
