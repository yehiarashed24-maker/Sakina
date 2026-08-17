from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.vectorstore.chroma import retrieve_relevant_context
from app.llm.openrouter import generate_sakina_response

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class SourceItem(BaseModel):
    source: str
    page: int
    topic: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceItem]

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty")
        
    try:
        # 1. Retrieve relevant context chunks and metadata sources
        context_text, sources = retrieve_relevant_context(request.message, k=4)
        
        # 2. Generate response via OpenRouter LLM with Sakina personality prompt & anti-hallucination citations
        answer = await generate_sakina_response(request.message, context_text, sources)
        
        return ChatResponse(
            answer=answer,
            sources=sources
        )
    except Exception as e:
        print("Chat Endpoint Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
