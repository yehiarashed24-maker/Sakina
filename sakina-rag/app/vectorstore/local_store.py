"""
Lightweight on-disk VectorStore using numpy for embeddings and JSONL for metadata/documents.
Provides add, upsert, similarity_search, delete, reset, count, health.
This avoids external DB dependencies and is deterministic and portable.
"""
from typing import List, Dict, Optional, Tuple, Any
import os
import re
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
                with self.metadatas_path.open('r', encoding='utf-8') as f:
                    for line in f:
                        if line.strip():
                            self.metadatas.append(json.loads(line))
            else:
                self.metadatas = []
            self.documents = []
            if self.documents_path.exists():
                with self.documents_path.open('r', encoding='utf-8') as f:
                    for line in f:
                        if line.strip():
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

from app.rag.evidence_gate import (
    assess_retrieval_evidence,
    normalize_cosine_similarity,
    EvidenceAssessment,
    MIN_RETRIEVAL_SCORE
)

# Feature Flag: Reranking Architecture (Prepared for Hackathon expansion)
# When False: Reranking is explicitly documented as 'Not Enabled'
ENABLE_RERANKER = False

def optional_reranker(query: str, candidate_chunks: List[Dict[str, Any]], top_k: int) -> List[Dict[str, Any]]:
    """
    Reranking hook.
    If ENABLE_RERANKER is activated, candidates (Top 12-20) are re-scored
    via a cross-encoder before the final Top-K selection.
    Currently: Preserves pure embedding retrieval order.
    """
    if not ENABLE_RERANKER:
        return candidate_chunks[:top_k]
    # Future extension point: CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return candidate_chunks[:top_k]


def normalize_mental_health_query(query: str) -> str:
    """
    Normalizes common Arabic mental health typos and dialectal expressions
    prior to embedding retrieval to ensure accurate document matching.
    """
    q = query
    # Social Anxiety & Fear of People / Phobia
    q = re.sub(r'\b(بخاف من الناس|خوف من الناس|الخوف من الناس|رهاب اجتماعي|قلق اجتماعي)\b', 'قلق ورهاب اجتماعي Social Anxiety', q)
    q = re.sub(r'\b(خوف|بخاف|خايف|خايفة|مرعوب|مرعوبة|رهاب)\b', 'قلق وخوف Anxiety and Fear', q)
    # Depression variations (e.g. اكتابب, اكتاب, مكتئب)
    q = re.sub(r'\b(اكتابب|اكتاب|إكتاب|اكتأب|إكتأب|كتابب|اكتياب|إكتياب|الكتئاب|الاكتاب|مكتئب|مكتئبه)\b', 'اكتئاب', q)
    # Anxiety and panic
    q = re.sub(r'\b(بانيك|هلع|قلقان|قلقانه|متوتر|متوتره)\b', 'قلق وهلع', q)
    # OCD
    q = re.sub(r'\b(وسوااس|وسوسه|وسواس قهري)\b', 'وسواس قهري', q)
    # PTSD
    q = re.sub(r'\b(تروما|صدمه نفسيه|صدمة نفسية)\b', 'صدمة نفسية PTSD', q)
    return q


def is_pure_greeting(query: str) -> bool:
    q = query.lower().strip().strip(".!؟?، ")
    greetings = {
        "اهلا", "أهلا", "مرحبا", "هاي", "هالو", "يا هلا", "هلا",
        "ازيك", "إزيك", "ازيك يا سكينة", "إزيك يا سكينة",
        "عامل ايه", "عاملة ايه", "عاملين ايه", "اخبارك", "أخبارك",
        "صباح الخير", "صباح النور", "مساء الخير", "مساء النور",
        "السلام عليكم", "سلام عليكم", "hello", "hi", "hey",
        "good morning", "good evening", "how are you",
        "ولد", "أنا ولد", "انا ولد", "بنت", "أنا بنت", "انا بنت",
        "راجل", "أنا راجل", "انا راجل", "ست", "أنا ست", "انا ست",
        "شاب", "أنا شاب", "انا شاب", "بنوتة", "بنوته", "أنا بنوتة",
        "كلميني كولد", "كلميني كبنت", "صيغة ولد", "صيغة بنت",
        "ولد يا سكينة", "بنت يا سكينة"
    }
    return q in greetings

def retrieve_relevant_context(query: str, k: int = 4) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]], EvidenceAssessment]:
    """
    Retrieves evidence-grounded chunks with full transparent metadata:
    - Cosine similarity raw_score
    - Calibrated normalized_relevance percentage
    - Qualitative indicator (VERY HIGH, HIGH, MODERATE, LOW)
    - Deterministic source rank and chunk ID

    Returns:
    (context_text, backward_compatible_sources, detailed_sources, evidence_assessment)
    """
    if is_pure_greeting(query):
        assessment = EvidenceAssessment(
            strength="NOT_APPLICABLE",
            score=0,
            is_sufficient=False,
            top_score=0.0,
            avg_score=0.0,
            chunk_count=0,
            source_count=0,
            is_conversational=True,
            reason="Conversational greeting without medical inquiry."
        )
        return "", [], [], assessment

    from app.rag.evidence_gate import is_conversational_query
    is_conv = is_conversational_query(query)
    store = get_vectorstore()
    embedder = get_embedder()

    # 1. Embed query into 384d multilingual semantic space (with query normalization)
    normalized_query = normalize_mental_health_query(query)
    query_emb = embedder.embed_texts([normalized_query])[0]

    # 2. Candidate Retrieval: Fetch 3x candidates (Top-12) for reranker / deduplication
    candidate_k = max(k * 3, 12)
    results = store.similarity_search(query_emb, top_k=candidate_k)

    raw_candidates = []
    seen_texts = set()

    total_found = len(results.get('documents', []))
    for i in range(total_found):
        raw_score = float(results['distances'][i])
        doc_text = results['documents'][i].strip()

        # Deduplication
        if not doc_text or len(doc_text.split()) < 25 or doc_text in seen_texts or raw_score < MIN_RETRIEVAL_SCORE:
            continue
        seen_texts.add(doc_text)

        metadata = results['metadatas'][i] if i < len(results['metadatas']) else {}
        chunk_id = results['ids'][i] if i < len(results['ids']) else f"chunk-{i}"

        filename = metadata.get("filename", "")
        if not filename or not metadata.get("page_start"):
            continue
        page_start = int(metadata.get("page_start", 1))

        # Filter out the index/keywords page (Page 1) of the medical KB
        if filename == "mental_health_rag_kb.pdf" and page_start == 1:
            continue

        topic_name = metadata.get("topic", "Mental Wellness")

        # Document title clean-up for UI display
        doc_title = filename.replace(".pdf", "").replace("-", " ").replace("_", " ").title()

        # Clean excerpt for evidence panel preview
        excerpt = " ".join(doc_text.split()[:45]) + ("..." if len(doc_text.split()) > 45 else "")

        norm_rel, qual_rel = normalize_cosine_similarity(raw_score)

        raw_candidates.append({
            "chunk_id": chunk_id,
            "raw_score": round(raw_score, 4),
            "normalized_relevance": norm_rel,
            "qualitative_relevance": qual_rel,
            "filename": filename,
            "document": filename,
            "document_title": doc_title,
            "page": page_start,
            "page_start": page_start,
            "topic": topic_name,
            "text": doc_text,
            "excerpt": excerpt
        })

    # 3. Optional Reranking Layer (Candidates Top-12 -> Final Top-K)
    final_chunks = optional_reranker(query, raw_candidates, top_k=k)

    # Assign ranks
    detailed_sources = []
    backward_compatible_sources = []
    formatted_docs = []

    for idx, chunk in enumerate(final_chunks):
        rank = idx + 1
        chunk_data = {**chunk, "rank": rank}
        detailed_sources.append(chunk_data)

        # For backward compatibility with existing ChatResponse model
        backward_compatible_sources.append({
            "source": chunk["filename"],
            "page": chunk["page"],
            "topic": chunk["topic"],
            "rank": rank,
            "raw_score": chunk["raw_score"],
            "normalized_relevance": chunk["normalized_relevance"],
            "qualitative_relevance": chunk["qualitative_relevance"]
        })

        # Structured representation for LLM prompt
        formatted_docs.append(
            f"[SOURCE {rank}]\n"
            f"Document: {chunk['filename']} (Page {chunk['page']})\n"
            f"Topic: {chunk['topic']}\n"
            f"Evidence Excerpt:\n{chunk['text']}"
        )

    context_text = "\n\n---\n\n".join(formatted_docs)

    # 4. Assess Evidence Strength & Gate
    evidence_assessment = assess_retrieval_evidence(query, detailed_sources)

    return context_text, backward_compatible_sources, detailed_sources, evidence_assessment
