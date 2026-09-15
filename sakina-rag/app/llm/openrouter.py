import httpx
import logging
import re
from typing import List, Dict, Any, Tuple, Optional
from app.rag.evidence_gate import generate_abstention_response
from app.config import settings
from app.prompts.sakina_prompt import SAKINA_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


def _clean_history(history: Optional[List[Dict[str, str]]], limit: int = 30) -> List[Dict[str, str]]:
    """Keep valid turns, merge duplicate roles, and drop a leading assistant greeting."""
    cleaned: List[Dict[str, str]] = []
    for message in (history or [])[-limit:]:
        role = message.get("role")
        content = message.get("content", "").split("\n\n📚 **المرجع**:")[0].strip()
        if role not in {"user", "assistant"} or not content:
            continue
        if cleaned and cleaned[-1]["role"] == role:
            cleaned[-1]["content"] += "\n" + content
        else:
            cleaned.append({"role": role, "content": content})
    while cleaned and cleaned[0]["role"] == "assistant":
        cleaned.pop(0)
    return cleaned

def process_deterministic_citations(text: str, sources: List[Dict[str, Any]]) -> Tuple[str, List[int]]:
    """
    Validates and deterministically maps in-text citations [1], [2] to real retrieved sources.
    - If citation index [n] exists in sources (1 <= n <= len(sources)), it is validated and retained.
    - If citation index [n] is hallucinated (n > len(sources) or n <= 0), it is strictly removed.
    Returns:
        (sanitized_text, list_of_validated_ranks)
    """
    valid_ranks = {s.get("rank", i + 1) for i, s in enumerate(sources)}
    if not sources:
        clean_text = re.sub(r'\[\d+\]', '', text)
        return clean_text.strip(), []

    cited_ranks = set()

    def replace_citation(match):
        try:
            num = int(match.group(1))
            if num in valid_ranks:
                cited_ranks.add(num)
                return f"[{num}]"
            return ""  # Strip hallucinated citation
        except Exception:
            return ""

    cleaned_text = re.sub(r'\[(\d+)\]', replace_citation, text)
    cleaned_text = re.sub(r' +', ' ', cleaned_text).strip()

    return cleaned_text, sorted(list(cited_ranks))


def sanitize_sakina_text(text: str) -> str:
    if not text:
        return ""
    # 1. Strip all variations of formal honorifics
    text = re.sub(r'يا\s*فندم[،,]?', '', text)
    text = re.sub(r'\bفندم[،,]?', '', text)
    text = re.sub(r'يا\s*سيدي[،,]?', '', text)
    text = re.sub(r'يا\s*هانم[،,]?', '', text)
    text = re.sub(r'\bحضرتك[،,]?', '', text)

    # 2. Fix Sakina's female voice consistency
    text = re.sub(r'\bأنا موجود\b', 'أنا موجودة', text)
    text = re.sub(r'\bانا موجود\b', 'أنا موجودة', text)
    text = re.sub(r'\bأنا مستعد\b', 'أنا مستعدة', text)
    text = re.sub(r'\bأنا جاهز\b', 'أنا جاهزة', text)
    text = re.sub(r'\bأنا قادر\b', 'أنا قادرة', text)
    text = re.sub(r'\bأنا متأكد\b', 'أنا متأكدة', text)

    # 3. Clean punctuation / double spaces
    text = re.sub(r'([،,])\s*([،,])', r'\1', text)
    text = re.sub(r'^\s*([،,])\s*', '', text)
    text = re.sub(r' +', ' ', text).strip()
    return text


async def generate_sakina_response(
    query: str,
    context: str,
    sources: List[Dict[str, Any]],
    history: List[Dict[str, str]] = None,
    user_gender: Optional[str] = None,
    memory_context: str = "",
) -> Tuple[str, List[int]]:
    system_prompt = SAKINA_SYSTEM_PROMPT.format(
        context=context if context else "(No verified clinical context available)",
        memory_context=memory_context or "(لا توجد ذاكرة سابقة متاحة)",
        question=query
    )

    gemini_api_key = getattr(settings, "GEMINI_API_KEY", "").strip()
    openrouter_api_key = getattr(settings, "OPENROUTER_API_KEY", "").strip()

    # Analyze query language
    eng_chars = len(re.findall(r'[a-zA-Z]', query))
    ar_chars = len(re.findall(r'[\u0600-\u06FF]', query))

    query_suffix = ""
    if ar_chars > 0:
        gender_guidance = ""
        if user_gender == "male":
            gender_guidance = "The user is MALE (ولد / راجل). Address him in Egyptian Arabic masculine forms ('معاك', 'طمني', 'حاسس'). DO NOT quote female-specific biology/hormones. "
        elif user_gender == "female":
            gender_guidance = "The user is FEMALE (بنت / أنسة). Address her in Egyptian Arabic feminine forms ('معاكي', 'طمنيني', 'حاسة'). "
        else:
            gender_guidance = "The user's gender is not yet specified. Do NOT assume gender or quote female-specific statistics/hormones. You can warmly ask early on: 'تحب أكلمك بصيغة إيه (ولد ولا بنت)؟'. "

        query_suffix = (
            f"\n\n[CRITICAL SYSTEM INSTRUCTION: The user is speaking ARABIC. You MUST reply ENTIRELY in natural Egyptian colloquial Arabic. "
            f"You are Sakina (سَكِينَة), a warm, caring female companion. Speak of yourself strictly as female ('أنا موجودة معاك', 'أنا جنبك', never say 'أنا موجود'). "
            f"NEVER say 'يا فندم' or 'حضرتك' or 'سيدي'. {gender_guidance}"
            f"Use [1], [2] bracket citations when stating facts from the retrieved sources. Keep it concise but answer the actual question completely.]"
        )
    elif eng_chars > 0:
        query_suffix = (
            "\n\n[CRITICAL SYSTEM INSTRUCTION: The user is speaking ENGLISH. You MUST reply ENTIRELY in English. "
            "Be warm, empathetic, therapeutic, and concise. Never use overly formal honorifics. "
            "Use [1], [2] bracket citations when stating facts from the retrieved sources.]"
        )

    full_user_query = query + query_suffix
    reply = ""
    clean_history = _clean_history(history)

    # ================= 1. PRIMARY: GOOGLE GEMINI =================
    if gemini_api_key:
        gemini_models = [model.strip() for model in settings.GEMINI_MODELS.split(",") if model.strip()]
        gemini_contents = []
        if clean_history:
            for msg in clean_history:
                role = "model" if msg.get("role") in ["assistant", "model"] else "user"
                gemini_contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        gemini_contents.append({"role": "user", "parts": [{"text": full_user_query}]})

        async with httpx.AsyncClient(timeout=httpx.Timeout(25.0, connect=8.0)) as client:
            for g_model in gemini_models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{g_model}:generateContent?key={gemini_api_key}"
                    payload = {
                        "system_instruction": {
                            "parts": [{"text": system_prompt}]
                        },
                        "contents": gemini_contents,
                        "generationConfig": {
                            "temperature": 0.35,
                            "maxOutputTokens": 800
                        }
                    }
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            raw_text = "".join(p.get("text", "") for p in parts if "text" in p)
                            clean_text = re.sub(r'<think>.*?</think>', '', raw_text, flags=re.DOTALL)
                            clean_text = re.sub(r'Here\'s a thinking process.*?\n\n', '', clean_text, flags=re.DOTALL)
                            clean_text = clean_text.strip()
                            if clean_text and len(clean_text) > 10:
                                reply = clean_text
                                logger.info("Google Gemini model %s returned a response", g_model)
                                break
                    elif response.status_code == 429:
                        logger.warning("Google Gemini model %s was rate-limited", g_model)
                    else:
                        logger.warning("Google Gemini model %s returned HTTP %s", g_model, response.status_code)
                except httpx.HTTPError:
                    logger.warning("Google Gemini request failed for %s", g_model, exc_info=True)

    # ================= 2. BACKUP: OPENROUTER =================
    if not reply and openrouter_api_key:
        logger.info("Falling back to OpenRouter")
        openrouter_messages = [{"role": "system", "content": system_prompt}]
        openrouter_messages.extend(clean_history)

        openrouter_messages.append({"role": "user", "content": full_user_query})

        configured_models = settings.OPENROUTER_MODELS or settings.OPENROUTER_MODEL
        openrouter_models = [model.strip() for model in configured_models.split(",") if model.strip()]
        payload = {
            "messages": openrouter_messages,
            "temperature": 0.35,
            "max_tokens": 1200,
        }
        if len(openrouter_models) > 1:
            payload["models"] = openrouter_models
        else:
            payload["model"] = openrouter_models[0] if openrouter_models else "openrouter/auto"
        headers = {
            "Authorization": f"Bearer {openrouter_api_key}",
            "HTTP-Referer": settings.BACKEND_URL,
            "X-Title": "Sakina AI RAG Backend",
            "Content-Type": "application/json"
        }
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=8.0)) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload,
                )
                if response.status_code == 200:
                    data = response.json()
                    raw_reply = data["choices"][0]["message"]["content"]
                    clean_reply = re.sub(r'<think>.*?</think>', '', raw_reply, flags=re.DOTALL).strip()
                    if clean_reply and len(clean_reply) > 10:
                        reply = clean_reply
                        logger.info("OpenRouter returned a response")
                else:
                    logger.warning("OpenRouter returned HTTP %s", response.status_code)
        except (httpx.HTTPError, KeyError, IndexError, TypeError):
            logger.warning("OpenRouter request failed", exc_info=True)

    if not reply or "OUT_OF_SCOPE_NO_CONTEXT" in reply:
        return generate_abstention_response(query), []
    sanitized_reply, cited_ranks = process_deterministic_citations(reply, sources)
    if sources and not cited_ranks:
        return generate_abstention_response(query), []
    return sanitize_sakina_text(sanitized_reply), cited_ranks
