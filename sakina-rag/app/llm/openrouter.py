import httpx
import re
from typing import List, Dict, Any
from app.config import settings
from app.prompts.sakina_prompt import SAKINA_SYSTEM_PROMPT

GREETING_KEYWORDS = [
    "hi", "hello", "hey", "hii", "hiii", "ازيك", "إزيك", "اخبارك", "أخبارك", 
    "مرحبا", "أهلا", "اهلا", "سلام عليكم", "السلام عليكم", "صباح الخير", "مساء الخير", 
    "مين انت", "من انت", "ممكن تعرفي بنفسك", "تعرفي بنفسك", "شلونك", "كيفك", "كيف حالك", "عامل ايه", "عاملة ايه"
]

def is_greeting(text: str) -> bool:
    clean = text.strip().lower()
    # Remove basic punctuation
    for p in [',', '!', '.', '؟', '?']:
        clean = clean.replace(p, '')
    clean = clean.strip()
    
    # Check if any greeting keyword is in the text, and the text is short enough (<= 6 words)
    words = clean.split()
    if len(words) <= 6:
        # Check direct word match or phrase match
        for kw in GREETING_KEYWORDS:
            if kw == clean or f" {kw} " in f" {clean} ":
                return True
                
    return False

async def generate_sakina_response(query: str, context: str, sources: List[Dict[str, Any]], history: List[Dict[str, str]] = None) -> str:
    # Check if it's a casual greeting to avoid forcing RAG citations
    greeting_mode = is_greeting(query)

    prompt = SAKINA_SYSTEM_PROMPT.format(
        context=context if not greeting_mode else "CRITICAL: The user is just greeting. You MUST reply ONLY with a warm greeting in the EXACT SAME LANGUAGE and dialect they used in their message. DO NOT USE ARABIC IF THEY SAID HELLO IN ENGLISH.",
        question=query
    )
    
    # Keys should ideally come entirely from settings now
    gemini_api_key = getattr(settings, "GEMINI_API_KEY", "")
    openrouter_api_key = getattr(settings, "OPENROUTER_API_KEY", "")

    candidate_endpoints = [
        {
            "name": "Gemini 3.6 Flash",
            "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            "headers": {
                "Authorization": f"Bearer {gemini_api_key}",
                "Content-Type": "application/json"
            },
            "model": "gemini-3.6-flash"
        },
        {
            "name": "OpenRouter Free",
            "url": "https://openrouter.ai/api/v1/chat/completions",
            "headers": {
                "Authorization": f"Bearer {openrouter_api_key}",
                "HTTP-Referer": settings.BACKEND_URL,
                "X-Title": "Sakina AI RAG Backend",
                "Content-Type": "application/json"
            },
            "model": "openrouter/free"
        }
    ]

    # Build messages array
    messages = [{"role": "system", "content": prompt}]
    
    # Add history (truncate to last 30 messages to protect token limits while maintaining deep conversational memory)
    if history:
        # Take the last 30 messages
        history_to_use = history[-30:]
        for msg in history_to_use:
            # Skip appending the query as a user message again if it's the last one in history
            if msg == history[-1] and msg["role"] == "user" and msg["content"] == query:
                continue
            if msg["role"] in ["user", "assistant", "system"]:
                # Strip citations so the LLM doesn't learn to hallucinate them
                clean_content = msg["content"].split("\n\n📚 **المرجع**:")[0]
                messages.append({"role": msg["role"], "content": clean_content})
    
    # Analyze query language to enforce strict output language
    eng_chars = len(re.findall(r'[a-zA-Z]', query))
    ar_chars = len(re.findall(r'[\u0600-\u06FF]', query))
    
    query_suffix = ""
    if eng_chars > ar_chars and eng_chars > 0:
        query_suffix = "\n\n[CRITICAL SYSTEM INSTRUCTION: The user is speaking ENGLISH. You MUST reply ENTIRELY in English. Do NOT use Arabic.]"
    elif ar_chars > eng_chars and ar_chars > 0:
        query_suffix = "\n\n[CRITICAL SYSTEM INSTRUCTION: The user is speaking ARABIC. You MUST reply ENTIRELY in Arabic.]"

    # We always ensure the latest query is appended at the end
    messages.append({"role": "user", "content": query + query_suffix})

    reply = ""
    # Try endpoints one by one
    async with httpx.AsyncClient(timeout=15.0) as client:
        for ep in candidate_endpoints:
            # Skip endpoint if no key is provided
            if not ep["headers"]["Authorization"].replace("Bearer ", "").strip():
                continue
                
            payload = {
                "model": ep["model"],
                "messages": messages,
                "temperature": 0.1,
                "max_tokens": 2000
            }
            try:
                response = await client.post(
                    ep["url"],
                    headers=ep["headers"],
                    json=payload
                )
                if response.status_code == 200:
                    data = response.json()
                    raw_reply = data["choices"][0]["message"]["content"]
                    
                    # Clean out thinking blocks robustly
                    clean_reply = re.sub(r'<think>.*?</think>', '', raw_reply, flags=re.DOTALL)
                    clean_reply = re.sub(r'Here\'s a thinking process.*?\n\n', '', clean_reply, flags=re.DOTALL)
                    
                    reply = clean_reply.strip()
                    
                    if reply and reply.strip():
                        print(f"✅ LLM Endpoint {ep['name']} generated response successfully!")
                        break
                else:
                    print(f"❌ Endpoint {ep['name']} HTTP Error status: {response.status_code}, body: {response.text}")
            except Exception as err:
                print(f"❌ Endpoint {ep['name']} Exception failed: {err}")

    if not reply or not reply.strip():
        # Fallback context-grounded response if generation failed completely
        if eng_chars > ar_chars and eng_chars > 0:
            reply = "Sorry, I am facing a technical issue right now. I will be back at another time."
        else:
            reply = "عذراً، أواجه عطلاً فنياً في الوقت الحالي. سوف أعود في وقت آخر."
            
        return reply

    if "OUT_OF_SCOPE_NO_CONTEXT" in reply:
        if eng_chars > ar_chars and eng_chars > 0:
            reply = "I apologize, but I do not have documented information about this specific topic in my current mental health references."
        else:
            reply = "أعتذر، ليس لدي معلومات موثقة حول هذا الموضوع في المراجع الطبية المتاحة لي حالياً."

    # Check if the reply is a refusal for an out-of-scope query
    refusal_keywords = [
        "specialized exclusively in mental health",
        "متخصص حصرياً في الصحة النفسية",
        "خارج نطاق تخصصي",
        "outside of this domain",
        "outside my domain",
        "out_of_scope_no_context",
        "ليس لدي معلومات موثقة حول هذا الموضوع",
        "i do not have documented information about this specific topic"
    ]
    is_refusal = any(kw.lower() in reply.lower() for kw in refusal_keywords)

    # Manually append the clickable citation only if it's not a simple greeting and not a refusal
    if sources and not greeting_mode and not is_refusal:
        first_src = sources[0]
        src_name = first_src.get('source', 'mental_health_rag_kb.pdf')
        src_page = first_src.get('page', 1)
        src_topic = first_src.get('topic', 'الصحة النفسية')
        
        # Ensure we don't end up with duplicate slashes
        base_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000').rstrip('/')
        citation = f"\n\n📚 **المرجع**: [{src_name} (صفحة {src_page} - {src_topic})]({base_url}/pdfs/{src_name})"
        reply += citation
    
    return reply
