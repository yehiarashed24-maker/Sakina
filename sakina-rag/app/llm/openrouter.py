import httpx
import re
from typing import List, Dict, Any
from app.config import settings
from app.prompts.sakina_prompt import SAKINA_SYSTEM_PROMPT

async def generate_sakina_response(query: str, context: str, sources: List[Dict[str, Any]], history: List[Dict[str, str]] = None) -> str:
    prompt = SAKINA_SYSTEM_PROMPT.format(
        context=context,
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
            "name": "OpenRouter Laguna",
            "url": "https://openrouter.ai/api/v1/chat/completions",
            "headers": {
                "Authorization": f"Bearer {openrouter_api_key}",
                "HTTP-Referer": settings.BACKEND_URL,
                "X-Title": "Sakina AI RAG Backend",
                "Content-Type": "application/json"
            },
            "model": "poolside/laguna-s-2.1:free"
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
    if ar_chars > 0:
        query_suffix = "\n\n[CRITICAL SYSTEM INSTRUCTION: The user is speaking ARABIC. You MUST reply ENTIRELY in Arabic. Be warm, empathetic, and concise in 1 to 3 short sentences.]"
    elif eng_chars > 0:
        query_suffix = "\n\n[CRITICAL SYSTEM INSTRUCTION: The user is speaking ENGLISH. You MUST reply ENTIRELY in English. Be warm, empathetic, and concise in 1 to 3 short sentences.]"

    # We always ensure the latest query is appended at the end
    messages.append({"role": "user", "content": query + query_suffix})

    reply = ""
    # Try endpoints one by one
    async with httpx.AsyncClient(timeout=120.0) as client:
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
                    
                    if reply and reply.strip() and not reply.lower().startswith("user safety"):
                        print(f"✅ LLM Endpoint {ep['name']} generated response successfully!")
                        break
                    else:
                        print(f"⚠️ Endpoint {ep['name']} returned invalid reply ({reply}), trying next endpoint...")
                        reply = ""
                else:
                    print(f"❌ Endpoint {ep['name']} HTTP Error status: {response.status_code}, body: {response.text}")
            except Exception as err:
                print(f"❌ Endpoint {ep['name']} Exception failed: {repr(err)}")

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

    # Medical/psychological terms indicating a factual domain answer
    med_keywords = [
        "اضطراب", "أعراض", "علاج", "نفسي", "وسواس", "فرط", "انتباه", "اكتئاب", "هلع", "قلق", "صدمة", "ثنائي القطب", "ذهان", "أدوية", "سلوك",
        "disorder", "symptom", "treatment", "anxiety", "depression", "adhd", "ocd", "ptsd", "bipolar", "psychosis", "therapy"
    ]
    is_medical_content = any(kw in reply.lower() for kw in med_keywords) or len(reply) > 250

    # Short pure greetings filter (greetings are under 250 chars and have no medical keywords)
    greeting_phrases = [
        "أهلاً", "اهلا", "مرحباً", "مرحبا", "ازيك", "عامل ايه", "اخبارك", "أخبارك",
        "كيف حالك", "كيفك", "شلونك", "صباح", "مساء", "السلام عليكم",
        "hello", "hi", "hey", "how are you", "welcome to sakina"
    ]
    is_greeting = any(p in query.lower() for p in ["ازيك", "عامل ايه", "اخبارك", "كيف حالك", "كيفك", "مرحبا", "اهلا", "hello", "hi"]) or (len(reply) < 250 and any(p in reply.lower() for p in greeting_phrases) and not any(kw in reply.lower() for kw in med_keywords))

    # Check if the reply is a refusal or apology for an out-of-scope query
    refusal_keywords = [
        "أعتذر", "اعتذر", "apologize", "apologies", "sorry",
        "تخصصي يقتصر", "متخصص حصرياً", "specialized exclusively",
        "خارج نطاق", "outside", "out_of_scope",
        "ليس لدي معلومات", "do not have documented information",
        "غير متاح", "لا أستطيع الإجابة", "لا يمكنني"
    ]
    is_refusal = any(kw.lower() in reply.lower() for kw in refusal_keywords)

    # Append citation for ANY medical response with retrieved sources (never on greetings or refusals)
    if sources and not is_refusal and not is_greeting and is_medical_content:
        base_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000').rstrip('/')
        citation_lines = []
        for src in sources:
            src_name = src.get('source', '')
            if not src_name:
                continue
                
            src_page = src.get('page', 1)
            cit_str = f"[{src_name} (صـ {src_page})]({base_url}/pdfs/{src_name})"
            if cit_str not in citation_lines:
                citation_lines.append(cit_str)
        
        if citation_lines:
            citation = "\n\n📚 **المراجع**: " + " | ".join(citation_lines)
            if citation not in reply:
                reply += citation
    
    return reply
