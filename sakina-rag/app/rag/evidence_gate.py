"""
SAKINA EVIDENCE GATE & ASSESSMENT ENGINE
========================================
Assesses retrieval confidence, evidence strength, and enforces the
Evidence Gate before grounded AI generation to prevent hallucinations.

Signals used:
- Top-1 retrieval cosine similarity
- Average cosine similarity across top-K valid chunks
- Number of chunks passing the relevance threshold
- Source diversity (unique medical documents)

Evidence Strength:
- HIGH: Strong direct evidence from validated medical documents
- MODERATE: Partial or single-source evidence; requires careful response
- LOW: Weak semantic match; potential off-topic inquiry
- INSUFFICIENT: Below threshold; triggers Safe Abstention
"""

from typing import List, Dict, Any, Tuple
import re

# Configurable thresholds
MIN_RETRIEVAL_SCORE = 0.30  # Lowered to allow colloquial Arabic queries to match formal clinical text
MIN_EVIDENCE_COUNT = 1      # Minimum number of valid chunks required
HIGH_EVIDENCE_SCORE = 0.60  # Cosine similarity for HIGH strength
MODERATE_EVIDENCE_SCORE = 0.35 # Lowered so short emotional medical questions pass the gate


class EvidenceStrength:
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"
    INSUFFICIENT = "INSUFFICIENT"


class EvidenceAssessment:
    def __init__(
        self,
        strength: str,
        score: int,  # 0 to 100 calibrated score
        is_sufficient: bool,
        top_score: float,
        avg_score: float,
        chunk_count: int,
        source_count: int,
        is_conversational: bool,
        reason: str
    ):
        self.strength = strength
        self.score = score
        self.is_sufficient = is_sufficient
        self.top_score = top_score
        self.avg_score = avg_score
        self.chunk_count = chunk_count
        self.source_count = source_count
        self.is_conversational = is_conversational
        self.reason = reason

    def to_dict(self) -> Dict[str, Any]:
        return {
            "evidence_strength": self.strength,
            "evidence_score": self.score,
            "sufficient": self.is_sufficient,
            "top_score": round(self.top_score, 4),
            "avg_score": round(self.avg_score, 4),
            "chunk_count": self.chunk_count,
            "source_count": self.source_count,
            "is_conversational": self.is_conversational,
            "reason": self.reason
        }


def is_conversational_query(query: str) -> bool:
    """
    Detects if the query is a greeting, casual check-in, or supportive talk/emotional sharing
    that does NOT require clinical/medical evidence gate refusal.
    """
    q = query.lower().strip().strip(".!؟?، ")
    memory_recall = re.search(
        r"(فاكر|فاكرة|تفتكر|تفتكري|كنا بنتكلم|اتكلمنا قبل|"
        r"قلتلك قبل|قولتلك قبل|حكيتلك قبل|المحادثة اللي فاتت|"
        r"do you remember|we talked about|last conversation)",
        q,
    )
    if memory_recall:
        return True
    social_or_emotional = re.search(
        r"(?:hello|hi|hey|how are you|good morning|good evening|thanks|thank you|"
        r"ازيك|إزيك|عامل ايه|عاملة ايه|عاملين ايه|اخبارك|أخبارك|مرحبا|أهلا|اهلا|هاي|هالو|يا هلا|هلا|"
        r"صباح الخير|صباح النور|مساء الخير|مساء النور|السلام عليكم|سلام عليكم|"
        r"شكرا|شكراً|تسلم|تسلمي|تمام|الحمد لله|مين انتي|مين انت|who are you|"
        r"فضفضة|محتاج اتكلم|عايز اتكلم|عايزة اتكلم|ممكن نحكي|نفسي اتكلم|"
        r"حاسس|حاسة|خاسس|خاسة|مخنوق|مخنوقة|متضايق|متضايقة|زعلان|زعلانة|تعبان|تعبانة|مرهق|مرهقة|تعبت|عندي|بعاني|"
        r"ولد|بنت|أنا ولد|انا ولد|أنا بنت|انا بنت|راجل|ست|شاب|بنوتة|بنوته|كلميني كولد|كلميني كبنت|صيغة ولد|صيغة بنت|"
        r"رفض|مرفوض|وحدة|وحيد|مش مرتاح|حاسس بضيق|"
        r"i feel|feeling|rejected|lonely)",
        q,
    )

    clinical_terms = (
        "اكتئاب", "قلق", "وسواس", "ثنائي القطب", "ذهان", "هلع",
        "disorder", "depression", "anxiety", "ocd", "bipolar", "psychosis", "panic",
        "أعراض", "اعراض", "علاج", "دواء", "جرعة", "تشخيص", "اضطراب",
        "symptom", "treatment", "medicine", "dose", "diagnos"
    )
    question_markers = (
        "ما ", "ايه ", "إيه ", "هل ", "ليه ", "ازاي ", "إزاي ",
        "what ", "how ", "why ", "is ", "are ",
    )
    if any(term in q for term in clinical_terms) or any(
        q.startswith(marker) for marker in question_markers
    ):
        return False

    social_or_emotional = re.search(
        r"(?:hello|hi|hey|how are you|good morning|good evening|thanks|thank you|"
        r"ازيك|إزيك|عامل ايه|عاملة ايه|عاملين ايه|اخبارك|أخبارك|مرحبا|أهلا|اهلا|هاي|هالو|يا هلا|هلا|"
        r"صباح الخير|صباح النور|مساء الخير|مساء النور|السلام عليكم|سلام عليكم|"
        r"شكرا|شكراً|تسلم|تسلمي|تمام|الحمد لله|مين انتي|مين انت|who are you|"
        r"فضفضة|محتاج اتكلم|عايز اتكلم|عايزة اتكلم|ممكن نحكي|نفسي اتكلم|"
        r"حاسس|حاسة|خاسس|خاسة|مخنوق|مخنوقة|متضايق|متضايقة|زعلان|زعلانة|تعبان|تعبانة|مرهق|مرهقة|تعبت|عندي|بعاني|"
        r"ولد|بنت|أنا ولد|انا ولد|أنا بنت|انا بنت|راجل|ست|شاب|بنوتة|بنوته|كلميني كولد|كلميني كبنت|صيغة ولد|صيغة بنت|"
        r"رفض|مرفوض|وحدة|وحيد|مش مرتاح|حاسس بضيق|"
        r"i feel|feeling|rejected|lonely)",
        q,
    )
    return bool(social_or_emotional)


def normalize_cosine_similarity(raw_score: float) -> Tuple[int, str]:
    """
    Documented relevance normalization:
    Cosine similarity from sentence-transformers typically spans [0.30, 0.85] for topical text.
    Formula:
        normalized = clamp((raw_score - 0.35) / (0.80 - 0.35) * 100, 0, 100)
    
    Qualitative levels:
    - >= 0.65: VERY HIGH
    - >= 0.52: HIGH
    - >= 0.40: MODERATE
    - < 0.40: LOW
    """
    clamped_val = max(0.0, min(1.0, (raw_score - 0.35) / (0.80 - 0.35)))
    normalized_percentage = int(round(clamped_val * 100))
    
    if raw_score >= 0.65:
        qualitative = "VERY HIGH"
    elif raw_score >= 0.52:
        qualitative = "HIGH"
    elif raw_score >= 0.40:
        qualitative = "MODERATE"
    else:
        qualitative = "LOW"
        
    return normalized_percentage, qualitative


def assess_retrieval_evidence(query: str, retrieved_chunks: List[Dict[str, Any]]) -> EvidenceAssessment:
    """
    Evaluates measurable signals from the vector retrieval output.
    Returns an EvidenceAssessment containing the strength level and gate decision.
    """
    is_conv = is_conversational_query(query)

    # Filter chunks that meet the minimum threshold
    valid_chunks = [c for c in retrieved_chunks if c.get("raw_score", 0.0) >= MIN_RETRIEVAL_SCORE]
    chunk_count = len(valid_chunks)

    if chunk_count == 0:
        top_raw = retrieved_chunks[0].get("raw_score", 0.0) if retrieved_chunks else 0.0
        return EvidenceAssessment(
            strength=EvidenceStrength.INSUFFICIENT if not is_conv else "NOT_APPLICABLE",
            score=max(0, int(top_raw * 100)),
            is_sufficient=False,
            top_score=top_raw,
            avg_score=top_raw,
            chunk_count=0,
            source_count=0,
            is_conversational=is_conv,
            reason="Conversational without evidence." if is_conv else f"No retrieved chunks met the minimum relevance threshold ({MIN_RETRIEVAL_SCORE}). Top score was {top_raw:.3f}."
        )

    scores = [c["raw_score"] for c in valid_chunks]
    top_score = max(scores)
    avg_score = sum(scores) / len(scores)
    unique_sources = len(set(c.get("document", "") for c in valid_chunks if c.get("document")))

    # Calibrated Evidence Strength Formula:
    # 60% top score + 30% average score of top-K + 10% source diversity bonus
    norm_top, _ = normalize_cosine_similarity(top_score)
    norm_avg, _ = normalize_cosine_similarity(avg_score)
    diversity_bonus = min(10, unique_sources * 5)
    
    calibrated_score = int(round(0.60 * norm_top + 0.30 * norm_avg + diversity_bonus))
    calibrated_score = max(0, min(100, calibrated_score))

    # Determine qualitative strength category
    if top_score >= HIGH_EVIDENCE_SCORE and chunk_count >= 2:
        strength = EvidenceStrength.HIGH
        reason = f"High confidence: {chunk_count} chunks retrieved with top similarity {top_score:.3f} across {unique_sources} verified sources."
    elif top_score >= MODERATE_EVIDENCE_SCORE:
        strength = EvidenceStrength.MODERATE
        reason = f"Moderate confidence: {chunk_count} chunks retrieved with top similarity {top_score:.3f}."
    else:
        strength = EvidenceStrength.LOW
        reason = f"Low confidence: retrieval score {top_score:.3f} is near the minimal confidence threshold."

    return EvidenceAssessment(
        strength=strength,
        score=calibrated_score,
        is_sufficient=strength in (EvidenceStrength.HIGH, EvidenceStrength.MODERATE),
        top_score=top_score,
        avg_score=avg_score,
        chunk_count=chunk_count,
        source_count=unique_sources,
        is_conversational=is_conv,
        reason=reason
    )


def generate_abstention_response(query: str) -> str:
    """
    Generates a clear, transparent refusal when the query is outside mental health
    or when the verified knowledge base does not contain sufficient clinical evidence.
    """
    is_arabic = bool(re.search(r'[\u0600-\u06FF]', query))
    if is_arabic:
        return "أنا بعتذر منك، تخصصي هو الصحة النفسية والدعم النفسي فقط، ومش لاقية دليل أقدر أعتمد عليه عشان أجاوبك على مواضيع خارج تخصصي."
    return "I apologize, but I am specifically specialized in mental wellness and emotional support. I cannot find reliable evidence in my sources to answer questions outside this scope."
