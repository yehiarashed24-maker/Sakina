import logging
import re
import time
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal

from app.vectorstore.local_store import retrieve_relevant_context, get_vectorstore, get_embedder
from app.llm.openrouter import generate_sakina_response
from app.safety.safety_engine import detect_safety_signals
from app.rag.evidence_gate import generate_abstention_response
from app.limiter import limiter

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_HISTORY_MESSAGES = 30
MAX_MESSAGE_CHARS = 4_000

class ChatMessageInput(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)
    history: List[ChatMessageInput] = Field(default_factory=list, max_length=MAX_HISTORY_MESSAGES)
    language: Optional[str] = None
    conversation_id: Optional[str] = None

class SourceItem(BaseModel):
    source: str
    page: int
    topic: str
    rank: Optional[int] = 1
    document: Optional[str] = None
    document_title: Optional[str] = None
    chunk_id: Optional[str] = None
    raw_score: Optional[float] = None
    normalized_relevance: Optional[int] = None
    qualitative_relevance: Optional[str] = None
    excerpt: Optional[str] = None

class RetrievalMetadata(BaseModel):
    top_k: int
    evidence_strength: str
    evidence_score: Optional[int] = None
    sufficient: bool
    is_conversational: bool = False
    reason: Optional[str] = None

class SafetyMetadata(BaseModel):
    level: str
    signals: List[str] = Field(default_factory=list)
    action_required: str = "NONE"
    is_crisis: bool = False

class LatencyMetadata(BaseModel):
    safety_ms: float
    retrieval_ms: float
    generation_ms: float
    total_ms: float

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceItem] = Field(default_factory=list)
    retrieval: Optional[RetrievalMetadata] = None
    safety: Optional[SafetyMetadata] = None
    cited_ranks: List[int] = Field(default_factory=list)
    latency_ms: Optional[LatencyMetadata] = None


def _message_value(message: Any, key: str) -> str:
    value = getattr(message, key, None)
    if value is None and isinstance(message, dict):
        value = message.get(key, "")
    return str(value or "")


def contextualize_query(query: str, history: List[ChatMessageInput]) -> str:
    """Expand elliptical follow-ups for retrieval without changing the user's message."""
    q = query.strip()
    follow_up_markers = re.compile(
        r"(بينهم|بينهما|الاتنين|الاثنين|دول|دولي|ده|دي|دا|ذلك|هذه|"
        r"عنه|عنها|منه|منها|فيه|فيها|معاه|معاها|الفرق|فرق|"
        r"تاني|أكتر|اكتر|أكثر|ليه|ازاي|إزاي|يعني ايه|يعني إيه|"
        r"الحل|علاجه|علاجها|اللي قولت|اللي قلتي|السابق|"
        r"them|both|those|these|it|this|that|more|difference|why|how)",
        re.IGNORECASE,
    )
    looks_elliptical = len(q.split()) <= 14 and bool(follow_up_markers.search(q))
    if not looks_elliptical or not history:
        return q

    recent_user_turns = [
        _message_value(message, "content").strip()
        for message in history[-12:]
        if _message_value(message, "role") == "user"
        and _message_value(message, "content").strip()
    ][-3:]
    if not recent_user_turns:
        return q
    return (
        "سياق كلام المستخدم السابق: "
        + " | ".join(recent_user_turns)
        + f"\nسؤال المتابعة الحالي: {q}"
    )


def _history_from_database(db: Any, user_id: str, conversation_id: str, query: str) -> List[ChatMessageInput]:
    """Load an authenticated user's current conversation as the source of truth."""
    from bson.errors import InvalidId
    from bson.objectid import ObjectId

    try:
        conversation = db.conversations.find_one(
            {"_id": ObjectId(conversation_id), "user_id": user_id}
        )
    except InvalidId as exc:
        raise HTTPException(status_code=400, detail="Invalid conversation ID") from exc
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    documents = list(
        db.messages.find({"conversation_id": conversation_id})
        .sort("created_at", -1)
        .limit(MAX_HISTORY_MESSAGES + 1)
    )
    documents.reverse()
    persisted = [
        ChatMessageInput(
            role="assistant" if doc.get("is_ai", False) else "user",
            content=(doc.get("text_ar") or doc.get("text_en") or "")[:MAX_MESSAGE_CHARS],
        )
        for doc in documents
        if (doc.get("text_ar") or doc.get("text_en") or "").strip()
    ]
    if persisted and persisted[-1].role == "user" and persisted[-1].content.strip() == query.strip():
        persisted.pop()
    return persisted[-MAX_HISTORY_MESSAGES:]


def _build_previous_conversations_memory(db: Any, user_id: str, current_conversation_id: Optional[str]) -> str:
    """Build a small, user-isolated memory from recent earlier conversations."""
    settings_doc = db.user_memory_settings.find_one({"user_id": user_id})
    if settings_doc and not settings_doc.get("memory_enabled", True):
        return ""

    memory_lines: List[str] = []
    summaries = list(
        db.journey_session_summaries.find(
            {
                "user_id": user_id,
                **({"conversation_id": {"$ne": current_conversation_id}} if current_conversation_id else {}),
            }
        ).sort("created_at", -1).limit(3)
    )
    for summary in summaries:
        text = summary.get("summary_ar") or summary.get("summary") or summary.get("summary_en")
        if text:
            memory_lines.append(str(text)[:700])

    if not memory_lines:
        conversation_filter: Dict[str, Any] = {"user_id": user_id}
        if current_conversation_id:
            from bson.errors import InvalidId
            from bson.objectid import ObjectId
            try:
                conversation_filter["_id"] = {"$ne": ObjectId(current_conversation_id)}
            except InvalidId:
                pass
        previous = list(db.conversations.find(conversation_filter).sort("created_at", -1).limit(3))
        for conversation in previous:
            previous_id = str(conversation["_id"])
            user_messages = list(
                db.messages.find({"conversation_id": previous_id, "is_ai": False})
                .sort("created_at", -1).limit(3)
            )
            snippets = [
                str(item.get("text_ar") or item.get("text_en") or "").strip()[:350]
                for item in reversed(user_messages)
                if str(item.get("text_ar") or item.get("text_en") or "").strip()
            ]
            if snippets:
                memory_lines.append(" | ".join(snippets))

    if not memory_lines:
        return ""
    return "\n".join(f"- {line}" for line in memory_lines)[:3_000]


def detect_user_gender_preference(message: str, history: Optional[List[ChatMessageInput]] = None) -> Optional[str]:
    """
    Detects if the user identifies as male ('male') or female ('female')
    from current message or previous conversation context.
    """
    import re
    msg_clean = message.strip().lower()

    # Direct explicit responses to "تحب أكلمك بصيغة إيه (ولد ولا بنت)؟"
    if re.search(r'^(أنا\s+|انا\s+)?(بنت|بنوته|بنوتة|ست|أنثى|انثى)$', msg_clean) or re.search(r'^(كلميني\s+|كلمني\s+)?(كبنت|كمؤنث)$', msg_clean) or "صيغة مؤنث" in msg_clean:
        return "female"
    if re.search(r'^(أنا\s+|انا\s+)?(ولد|راجل|شاب|ذكر)$', msg_clean) or re.search(r'^(كلميني\s+|كلمني\s+)?(كولد|كمذكر)$', msg_clean) or "صيغة مذكر" in msg_clean:
        return "male"

    # Analyze history and current message
    all_texts = []
    if history:
        for m in history:
            role = m.role if hasattr(m, 'role') else m.get('role', '')
            c = m.content if hasattr(m, 'content') else m.get('content', '')
            if role in ['user', 'human'] and c:
                all_texts.append(c)
    if message:
        all_texts.append(message)

    combined = " ".join(all_texts).lower()

    # Explicit preferences in text
    if any(re.search(p, combined) for p in [r'\b(أنا بنت|انا بنت|كلميني كبنت|أنا ست|انا ست|بنوته)\b']):
        return "female"
    if any(re.search(p, combined) for p in [r'\b(أنا ولد|انا ولد|كلميني كولد|أنا راجل|انا راجل|أنا شاب|انا شاب)\b']):
        return "male"

    # Grammatical clues (Egyptian active participles)
    # Check current message first
    if re.search(r'\b(حاسس|مخنوق|تعبان|مكتئب|قلقان|خايف|متوتر|لوحدي ومحتاس)\b', msg_clean):
        return "male"
    if re.search(r'\b(حاسة|مخنوقة|تعبانة|مكتئبة|قلقانة|خايفة|متوترة|لوحدي ومحتاسة)\b', msg_clean):
        return "female"

    # Check combined history
    if re.search(r'\b(حاسة|مخنوقة|تعبانة|مكتئبة|قلقانة|خايفة|متوترة)\b', combined):
        return "female"
    if re.search(r'\b(حاسس|مخنوق|تعبان|مكتئب|قلقان|خايف|متوتر)\b', combined):
        return "male"

    return None


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat_endpoint(request: Request, body: ChatRequest):
    if not body.message or not body.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    start_time = time.perf_counter()

    try:
        # ================= 1. SAFETY ENGINE (Independent Check) =================
        t0 = time.perf_counter()
        safety_result = detect_safety_signals(body.message)
        t_safety = (time.perf_counter() - t0) * 1000

        # Safety Priority: If crisis/self-harm detected, immediate compassionate intervention
        if safety_result.is_crisis:
            t_total = (time.perf_counter() - start_time) * 1000
            return ChatResponse(
                answer=safety_result.safety_message,
                sources=[],
                retrieval=RetrievalMetadata(
                    top_k=0,
                    evidence_strength="INSUFFICIENT",
                    evidence_score=0,
                    sufficient=False,
                    is_conversational=False,
                    reason="Safety Priority: Crisis escalation protocol activated."
                ),
                safety=SafetyMetadata(
                    level=safety_result.level,
                    signals=safety_result.signals,
                    action_required=safety_result.action_required,
                    is_crisis=True
                ),
                cited_ranks=[],
                latency_ms=LatencyMetadata(
                    safety_ms=round(t_safety, 2),
                    retrieval_ms=0.0,
                    generation_ms=0.0,
                    total_ms=round(t_total, 2)
                )
            )

        # ================= 2. CONVERSATION HISTORY & USER MEMORY =================
        history = body.history[-MAX_HISTORY_MESSAGES:]
        user_memory_context = ""
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                import jwt
                from app.api.auth import ALGORITHM, JWT_SECRET
                from app.database import get_db

                payload = jwt.decode(auth_header[7:], JWT_SECRET, algorithms=[ALGORITHM])
                user_id = payload.get("sub")
                if user_id:
                    db = get_db()
                    if body.conversation_id:
                        persisted_history = _history_from_database(
                            db, user_id, body.conversation_id, body.message
                        )
                        if len(persisted_history) >= len(history):
                            history = persisted_history
                    user_memory_context = _build_previous_conversations_memory(
                        db, user_id, body.conversation_id
                    )
            except HTTPException:
                raise
            except Exception:
                logger.warning("Could not load optional conversation memory", exc_info=True)

        # ================= 3. RAG RETRIEVAL & EVIDENCE ASSESSMENT =================
        t1 = time.perf_counter()
        retrieval_query = contextualize_query(body.message, history)
        context_text, _, detailed_sources, evidence_assessment = retrieve_relevant_context(
            retrieval_query, k=4
        )
        t_retrieval = (time.perf_counter() - t1) * 1000

        # ================= 4. EVIDENCE GATE (Safe Abstention Check) =================
        # If evidence is insufficient and NOT conversational/supportive, refuse safely without hallucinating
        if not evidence_assessment.is_sufficient and not evidence_assessment.is_conversational:
            abstention_answer = generate_abstention_response(body.message)
            t_total = (time.perf_counter() - start_time) * 1000
            return ChatResponse(
                answer=abstention_answer,
                sources=[],
                retrieval=RetrievalMetadata(
                    top_k=len(detailed_sources),
                    evidence_strength=evidence_assessment.strength,
                    evidence_score=evidence_assessment.score,
                    sufficient=False,
                    is_conversational=False,
                    reason=evidence_assessment.reason
                ),
                safety=SafetyMetadata(
                    level=safety_result.level,
                    signals=safety_result.signals,
                    action_required=safety_result.action_required,
                    is_crisis=False
                ),
                cited_ranks=[],
                latency_ms=LatencyMetadata(
                    safety_ms=round(t_safety, 2),
                    retrieval_ms=round(t_retrieval, 2),
                    generation_ms=0.0,
                    total_ms=round(t_total, 2)
                )
            )

        # ================= 5. GROUNDED GENERATION =================
        t2 = time.perf_counter()
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in history]

        # Provide full context and sources to the generator if they passed the retrieval threshold
        generation_sources = detailed_sources if not evidence_assessment.is_conversational else []
        generation_context = context_text if not evidence_assessment.is_conversational else ""

        user_gender = detect_user_gender_preference(body.message, history)

        answer, cited_ranks = await generate_sakina_response(
            body.message,
            generation_context,
            generation_sources,
            history=history_dicts,
            user_gender=user_gender,
            memory_context=user_memory_context,
        )
        t_generation = (time.perf_counter() - t2) * 1000
        t_total = (time.perf_counter() - start_time) * 1000

        # Build structured sources list for Evidence Gate & Side Drawer transparency
        response_sources = [
            SourceItem(
                source=s.get("document", s.get("source", "")),
                page=s.get("page", 1),
                topic=s.get("topic", "Mental Wellness"),
                rank=s.get("rank", 1),
                document=s.get("document", s.get("filename", "")),
                document_title=s.get("document_title", ""),
                chunk_id=s.get("chunk_id", ""),
                raw_score=s.get("raw_score", 0.0),
                normalized_relevance=s.get("normalized_relevance", 0),
                qualitative_relevance=s.get("qualitative_relevance", "MODERATE"),
                excerpt=s.get("excerpt", "")
            )
            for s in generation_sources
        ]

        return ChatResponse(
            answer=answer,
            sources=response_sources,
            retrieval=RetrievalMetadata(
                top_k=len(detailed_sources),
                evidence_strength=(evidence_assessment.strength if response_sources else "NOT_APPLICABLE" if evidence_assessment.is_conversational else "INSUFFICIENT"),
                evidence_score=(evidence_assessment.score if response_sources else 0),
                sufficient=bool(response_sources),
                is_conversational=evidence_assessment.is_conversational,
                reason=evidence_assessment.reason
            ),
            safety=SafetyMetadata(
                level=safety_result.level,
                signals=safety_result.signals,
                action_required=safety_result.action_required,
                is_crisis=False
            ),
            cited_ranks=cited_ranks,
            latency_ms=LatencyMetadata(
                safety_ms=round(t_safety, 2),
                retrieval_ms=round(t_retrieval, 2),
                generation_ms=round(t_generation, 2),
                total_ms=round(t_total, 2)
            )
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Chat endpoint failed")
        raise HTTPException(status_code=500, detail="Unable to process the message") from exc


@router.post("/chat/inspect")
async def inspect_rag_pipeline(body: ChatRequest):
    """
    Developer & Demo endpoint for SAKINA RAG Inspector.
    Executes the full pipeline and exposes all internal intermediate states:
    query embeddings, candidate chunks, similarity scores, evidence gate,
    safety checks, and generation timings.
    """
    start_time = time.perf_counter()

    # 1. Safety Check
    t0 = time.perf_counter()
    safety_result = detect_safety_signals(body.message)
    t_safety = (time.perf_counter() - t0) * 1000

    # 2. Embedding & Candidates
    t1 = time.perf_counter()
    store = get_vectorstore()
    embedder = get_embedder()
    retrieval_query = contextualize_query(body.message, body.history)
    query_emb = embedder.embed_texts([retrieval_query])[0]

    context_text, _, detailed_sources, evidence_assessment = retrieve_relevant_context(
        retrieval_query, k=4
    )
    t_retrieval = (time.perf_counter() - t1) * 1000

    # 3. Generation (or Safety Override or Abstention)
    t2 = time.perf_counter()
    if safety_result.is_crisis:
        final_answer = safety_result.safety_message
        cited_ranks = []
        gen_type = "SAFETY_OVERRIDE_CRISIS"
    elif not evidence_assessment.is_sufficient and not evidence_assessment.is_conversational:
        final_answer = generate_abstention_response(body.message)
        cited_ranks = []
        gen_type = "SAFE_ABSTENTION_INSUFFICIENT_EVIDENCE"
    else:
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in body.history]
        user_gender = detect_user_gender_preference(body.message, body.history)
        final_answer, cited_ranks = await generate_sakina_response(
            body.message,
            context_text if not evidence_assessment.is_conversational else "",
            detailed_sources if not evidence_assessment.is_conversational else [],
            history=history_dicts,
            user_gender=user_gender
        )
        gen_type = "GROUNDED_GENERATION"

    t_generation = (time.perf_counter() - t2) * 1000
    t_total = (time.perf_counter() - start_time) * 1000

    return {
        "query": body.message,
        "embedding": {
            "model": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
            "dimension": len(query_emb),
            "vector_sample": [round(v, 4) for v in query_emb[:8]]
        },
        "safety": {
            **safety_result.to_dict(),
            "latency_ms": round(t_safety, 2)
        },
        "retrieval": {
            "top_k": len(detailed_sources),
            "evidence_assessment": evidence_assessment.to_dict(),
            "candidates": detailed_sources,
            "latency_ms": round(t_retrieval, 2),
            "reranking_enabled": False,
            "reranking_status": "Not Enabled (Architecture Prepared)"
        },
        "evidence_gate": {
            "passed": evidence_assessment.is_sufficient or evidence_assessment.is_conversational,
            "strength": evidence_assessment.strength,
            "calibrated_score": evidence_assessment.score,
            "reason": evidence_assessment.reason,
            "decision": "PROCEED_TO_GENERATION" if (evidence_assessment.is_sufficient or evidence_assessment.is_conversational) else "TRIGGER_ABSTENTION"
        },
        "generation": {
            "type": gen_type,
            "answer": final_answer,
            "cited_ranks": cited_ranks,
            "latency_ms": round(t_generation, 2)
        },
        "total_latency_ms": round(t_total, 2)
    }


@router.get("/rag/eval-metrics")
async def get_evaluation_metrics():
    """
    Returns real benchmark evaluation metrics from sakina-rag/eval/eval_results.json.
    """
    import json
    from pathlib import Path
    eval_file = Path(__file__).resolve().parent.parent.parent / "eval" / "eval_results.json"
    if not eval_file.exists():
        # Fallback to local eval path in sakina-rag
        eval_file = Path(__file__).resolve().parent.parent / "eval" / "eval_results.json"

    if eval_file.exists():
        with open(eval_file, "r", encoding="utf-8") as f:
            return json.load(f)

    return {
        "status": "not_evaluated",
        "message": "Evaluation has not yet been executed. Run python eval/eval_rag.py"
    }
