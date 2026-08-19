"""
Lightweight on-disk VectorStore using numpy for embeddings and JSONL for metadata/documents.
Provides add, upsert, similarity_search, delete, reset, count, health.
This avoids external DB dependencies and is deterministic and portable.
"""
from typing import List, Dict, Optional
import os
from pathlib import Path
import numpy as np
import json
import threading

class VectorStore:
    def __init__(self, persist_directory: str = 'data/vector_store'):
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        # files
        self.ids_path = self.persist_directory / 'ids.json'
        self.metadatas_path = self.persist_directory / 'metadatas.jsonl'
        self.documents_path = self.persist_directory / 'documents.jsonl'
        self.embeddings_path = self.persist_directory / 'embeddings.npy'

        self.lock = threading.Lock()

        # load or init
        self.ids = []
        self.metadatas = []
        self.documents = []
        self.embeddings = None
        self.embeddings_norm = None
        self._load()

    def _load(self):
        with self.lock:
            if self.ids_path.exists():
                self.ids = json.loads(self.ids_path.read_text(encoding='utf-8'))
            else:
                self.ids = []
            self.metadatas = []
            if self.metadatas_path.exists():
                for line in self.metadatas_path.open('r', encoding='utf-8'):
                    self.metadatas.append(json.loads(line))
            else:
                self.metadatas = []
            self.documents = []
            if self.documents_path.exists():
                for line in self.documents_path.open('r', encoding='utf-8'):
                    self.documents.append(json.loads(line))
            else:
                self.documents = []
            if self.embeddings_path.exists():
                self.embeddings = np.load(str(self.embeddings_path))
                if self.embeddings.ndim == 1 and self.embeddings.size > 0:
                    self.embeddings = self.embeddings.reshape(1, -1)
                self._update_norms()
            else:
                self.embeddings = np.zeros((0,))
                self.embeddings_norm = np.zeros((0,))

    def _update_norms(self):
        if self.embeddings is not None and getattr(self.embeddings, 'size', 0) > 0:
            self.embeddings_norm = self.embeddings / (np.linalg.norm(self.embeddings, axis=1, keepdims=True) + 1e-12)
        else:
            self.embeddings_norm = np.zeros((0,))

    def _persist(self):
        self.ids_path.write_text(json.dumps(self.ids, ensure_ascii=False), encoding='utf-8')
        with self.metadatas_path.open('w', encoding='utf-8') as f:
            for m in self.metadatas:
                f.write(json.dumps(m, ensure_ascii=False) + '\n')
        with self.documents_path.open('w', encoding='utf-8') as f:
            for d in self.documents:
                f.write(json.dumps(d, ensure_ascii=False) + '\n')
        if self.embeddings is not None and getattr(self.embeddings, 'size', 0) > 0:
            np.save(str(self.embeddings_path), self.embeddings)

    def add(self, ids: List[str], embeddings: List[List[float]], metadatas: List[Dict], documents: List[str]):
        with self.lock:
            # append new entries (does not dedup)
            embeddings_arr = np.array(embeddings, dtype=np.float32)
            if self.embeddings is None or getattr(self.embeddings, 'size', 0) == 0:
                self.embeddings = embeddings_arr
            else:
                self.embeddings = np.vstack([self.embeddings, embeddings_arr])
            self.ids.extend(ids)
            self.metadatas.extend(metadatas)
            self.documents.extend(documents)
            self._update_norms()
            self._persist()
        return True

    def upsert(self, ids: List[str], embeddings: List[List[float]], metadatas: List[Dict], documents: List[str]):
        with self.lock:
            id_to_index = {idv: idx for idx, idv in enumerate(self.ids)}
            embeddings_arr = np.array(embeddings, dtype=np.float32)
            for i, idv in enumerate(ids):
                if idv in id_to_index:
                    idx = id_to_index[idv]
                    self.embeddings[idx] = embeddings_arr[i]
                    self.metadatas[idx] = metadatas[i]
                    self.documents[idx] = documents[i]
                else:
                    if self.embeddings is None or getattr(self.embeddings, 'size', 0) == 0:
                        self.embeddings = embeddings_arr[i:i+1]
                    else:
                        self.embeddings = np.vstack([self.embeddings, embeddings_arr[i:i+1]])
                    self.ids.append(idv)
                    self.metadatas.append(metadatas[i])
                    self.documents.append(documents[i])
            self._update_norms()
            self._persist()
        return True

    def similarity_search(self, query_embedding: List[float], top_k: int = 5, filter: Optional[Dict] = None):
        if self.embeddings_norm is None or getattr(self.embeddings_norm, 'size', 0) == 0:
            return {'ids': [], 'distances': [], 'metadatas': [], 'documents': []}
        
        q = np.array(query_embedding, dtype=np.float32)
        q_norm = q / (np.linalg.norm(q) + 1e-12)
        
        # Fast dot product on pre-normalized arrays
        with self.lock:
            sims = (self.embeddings_norm @ q_norm).astype(float)
            # topk
            topk_idx = sims.argsort()[::-1][:top_k]
            ids = [self.ids[i] for i in topk_idx]
            distances = [float(sims[i]) for i in topk_idx]
            metadatas = [self.metadatas[i] for i in topk_idx]
            documents = [self.documents[i] for i in topk_idx]
            
        return {'ids': ids, 'distances': distances, 'metadatas': metadatas, 'documents': documents}

    def delete(self, ids: List[str]):
        with self.lock:
            indices = [self.ids.index(i) for i in ids if i in self.ids]
            # remove in reverse order
            for idx in sorted(indices, reverse=True):
                self.ids.pop(idx)
                self.metadatas.pop(idx)
                self.documents.pop(idx)
                self.embeddings = np.delete(self.embeddings, idx, axis=0)
            self._update_norms()
            self._persist()
        return True

    def reset(self):
        with self.lock:
            for p in [self.ids_path, self.metadatas_path, self.documents_path, self.embeddings_path]:
                try:
                    p.unlink()
                except Exception:
                    pass
            self.ids = []
            self.metadatas = []
            self.documents = []
            self.embeddings = np.zeros((0,))
            self.embeddings_norm = np.zeros((0,))
        return True

    def count(self):
        return len(self.ids)

    def health(self):
        return {'status': 'ok'}

# --- Integration for Sakina API ---
from app.config import settings
from app.embeddings.local_embedder import get_provider

_vectorstore = None
_embedder = None

def get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = VectorStore(persist_directory=settings.LOCAL_VECTOR_STORE_DIR)
    return _vectorstore

def get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = get_provider('sentence_transformers', settings.EMBEDDING_MODEL_NAME)
    return _embedder

def retrieve_relevant_context(query: str, k: int = 4):
    store = get_vectorstore()
    embedder = get_embedder()
    
    # 1. Embed query
    query_emb = embedder.embed_texts([query])[0]
    
    # 2. Search. We fetch more results initially to allow for deduplication.
    results = store.similarity_search(query_emb, top_k=k*2)
    
    docs = []
    sources = []
    seen_sources = set()
    seen_texts = set()
    
    # Relevance Threshold: Only keep results with a cosine similarity > 0.0 to ensure references always appear
    RELEVANCE_THRESHOLD = 0.0
    
    for i in range(len(results['documents'])):
        if len(docs) >= k:
            break
            
        distance = results['distances'][i]
        if distance < RELEVANCE_THRESHOLD:
            continue
            
        doc_text = results['documents'][i]
        
        # Deduplication
        if doc_text in seen_texts:
            continue
        seen_texts.add(doc_text)
        
        metadata = results['metadatas'][i]
        docs.append(doc_text)
        
        source_name = metadata.get("filename", "Mental Health KB")
        page_num = metadata.get("page_start", 1)
        topic_name = metadata.get("topic", "Mental Wellness")
        
        src_key = f"{source_name}-page{page_num}-{topic_name}"
        if src_key not in seen_sources:
            seen_sources.add(src_key)
            sources.append({
                "source": source_name,
                "page": page_num,
                "topic": topic_name
            })
            
    context_text = "\n\n---\n\n".join(docs)
    return context_text, sources
