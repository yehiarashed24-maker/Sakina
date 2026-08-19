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


class VectorStore:
    def __init__(self, persist_directory: str = 'data/vector_store'):
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        # files
        self.ids_path = self.persist_directory / 'ids.json'
        self.metadatas_path = self.persist_directory / 'metadatas.jsonl'
        self.documents_path = self.persist_directory / 'documents.jsonl'
        self.embeddings_path = self.persist_directory / 'embeddings.npy'

        # load or init
        self.ids = []
        self.metadatas = []
        self.documents = []
        self.embeddings = None
        self._load()

    def _load(self):
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
        else:
            self.embeddings = np.zeros((0,))

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
        # append new entries (does not dedup)
        embeddings_arr = np.array(embeddings, dtype=np.float32)
        if self.embeddings is None or self.embeddings.size == 0:
            self.embeddings = embeddings_arr
        else:
            self.embeddings = np.vstack([self.embeddings, embeddings_arr])
        self.ids.extend(ids)
        self.metadatas.extend(metadatas)
        self.documents.extend(documents)
        self._persist()
        return True

    def upsert(self, ids: List[str], embeddings: List[List[float]], metadatas: List[Dict], documents: List[str]):
        # update if id exists else append
        id_to_index = {idv: idx for idx, idv in enumerate(self.ids)}
        embeddings_arr = np.array(embeddings, dtype=np.float32)
        for i, idv in enumerate(ids):
            if idv in id_to_index:
                idx = id_to_index[idv]
                self.embeddings[idx] = embeddings_arr[i]
                self.metadatas[idx] = metadatas[i]
                self.documents[idx] = documents[i]
            else:
                # append
                if self.embeddings is None or getattr(self.embeddings, 'size', 0) == 0:
                    self.embeddings = embeddings_arr[i:i+1]
                else:
                    self.embeddings = np.vstack([self.embeddings, embeddings_arr[i:i+1]])
                self.ids.append(idv)
                self.metadatas.append(metadatas[i])
                self.documents.append(documents[i])
        self._persist()
        return True

    def similarity_search(self, query_embedding: List[float], top_k: int = 5, filter: Optional[Dict] = None):
        # compute cosine similarity
        if self.embeddings is None or getattr(self.embeddings, 'size', 0) == 0:
            return {'ids': [], 'distances': [], 'metadatas': [], 'documents': []}
        import numpy as np
        q = np.array(query_embedding, dtype=np.float32)
        # normalize
        emb = self.embeddings
        if emb.ndim == 1:
            emb = emb.reshape(1, -1)
        emb_norm = emb / (np.linalg.norm(emb, axis=1, keepdims=True) + 1e-12)
        q_norm = q / (np.linalg.norm(q) + 1e-12)
        sims = (emb_norm @ q_norm).astype(float)
        # topk
        topk_idx = sims.argsort()[::-1][:top_k]
        ids = [self.ids[i] for i in topk_idx]
        distances = [float(sims[i]) for i in topk_idx]
        metadatas = [self.metadatas[i] for i in topk_idx]
        documents = [self.documents[i] for i in topk_idx]
        return {'ids': ids, 'distances': distances, 'metadatas': metadatas, 'documents': documents}

    def delete(self, ids: List[str]):
        indices = [self.ids.index(i) for i in ids if i in self.ids]
        # remove in reverse order
        for idx in sorted(indices, reverse=True):
            self.ids.pop(idx)
            self.metadatas.pop(idx)
            self.documents.pop(idx)
            self.embeddings = np.delete(self.embeddings, idx, axis=0)
        self._persist()
        return True

    def reset(self):
        # remove files
        for p in [self.ids_path, self.metadatas_path, self.documents_path, self.embeddings_path]:
            try:
                p.unlink()
            except Exception:
                pass
        self.ids = []
        self.metadatas = []
        self.documents = []
        self.embeddings = np.zeros((0,))
        self._persist()

    def count(self):
        return len(self.ids)

    def health(self):
        return {'status': 'ok'}
