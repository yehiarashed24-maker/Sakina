from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List
from app.vectorstore.local_store import retrieve_relevant_context
from app.llm.openrouter import generate_sakina_response
from app.limiter import limiter

router = APIRouter()

class ChatMessageInput(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessageInput] = []

class SourceItem(BaseModel):
    source: str
    page: int
    topic: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceItem]

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat_endpoint(request: Request, body: ChatRequest):
    if not body.message or not body.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")
        
    try:
        # 1. Retrieve relevant context chunks and metadata sources
        context_text, sources = retrieve_relevant_context(body.message, k=6)
        
        # 2. Generate response via OpenRouter LLM with Sakina personality prompt & anti-hallucination citations
        # Convert history objects to dicts
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in body.history]
        answer = await generate_sakina_response(body.message, context_text, sources, history=history_dicts)
        
        return ChatResponse(
            answer=answer,
            sources=sources
        )
    except Exception as e:
        print("Chat Endpoint Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
