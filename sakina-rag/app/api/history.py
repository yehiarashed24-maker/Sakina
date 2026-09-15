from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database
from bson.objectid import ObjectId
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

from ..database import get_db
from .dependencies import get_current_user

router = APIRouter(prefix="/history", tags=["History"])

class MessageSchema(BaseModel):
    id: Optional[str] = None
    isAi: bool
    textEn: str
    textAr: str

class MoodSchema(BaseModel):
    calm: int
    anxious: int
    stressed: int
    happy: int
    dominant: str

@router.get("/conversations")
def get_conversations(db: Database = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    convs_cursor = db.conversations.find({"user_id": user_id}).sort("created_at", -1)
    
    result = []
    for c in convs_cursor:
        conv_id = str(c["_id"])
        msgs_cursor = db.messages.find({"conversation_id": conv_id}).sort("created_at", 1)
        
        msgs = []
        for m in msgs_cursor:
            msgs.append({
                "id": str(m["_id"]),
                "isAi": m.get("is_ai", False),
                "textEn": m.get("text_en", ""),
                "textAr": m.get("text_ar", ""),
                "sources": m.get("sources", []),
                "retrieval": m.get("retrieval"),
                "safety": m.get("safety"),
                "citedRanks": m.get("cited_ranks", [])
            })
            
        result.append({
            "id": conv_id,
            "title": c.get("title", "New Conversation"),
            "titleAr": c.get("title_ar", "محادثة جديدة"),
            "time": c.get("created_at", datetime.utcnow()).strftime("%Y-%m-%d %H:%M"),
            "mood": c.get("mood", {
                "calm": 0,
                "anxious": 0,
                "stressed": 0,
                "happy": 0,
                "dominant": "---"
            }),
            "messages": msgs
        })
    return result

@router.post("/conversations")
def create_conversation(db: Database = Depends(get_db), current_user: dict = Depends(get_current_user)):
    c = {
        "user_id": current_user["id"],
        "title": "New Conversation",
        "title_ar": "محادثة جديدة",
        "created_at": datetime.utcnow(),
        "mood": {
            "calm": 0,
            "anxious": 0,
            "stressed": 0,
            "happy": 0,
            "dominant": "---"
        }
    }
    res = db.conversations.insert_one(c)
    conv_id = str(res.inserted_id)
    
    # Add welcome message
    welcome_ar = "أهلاً بيك، أنا سكينة. مساحتك الآمنة للدعم ومتابعة مشاعرك في أي وقت. تحب أكلمك بصيغة إيه (ولد ولا بنت)؟ وطمني، حاسس بإيه دلوقتي؟"
    welcome_en = "Welcome, I'm Sakina. Your safe space for support and reflection. How would you like me to address you? And tell me, how are you feeling right now?"
    m = {
        "conversation_id": conv_id,
        "is_ai": True,
        "text_en": welcome_en,
        "text_ar": welcome_ar,
        "created_at": datetime.utcnow()
    }
    db.messages.insert_one(m)
    
    return {"id": conv_id}

class AddMessageRequest(BaseModel):
    isAi: bool
    textEn: str
    textAr: str
    mood: Optional[MoodSchema] = None
    title: Optional[str] = None
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    retrieval: Optional[Dict[str, Any]] = None
    safety: Optional[Dict[str, Any]] = None
    citedRanks: Optional[List[int]] = None

@router.post("/conversations/{conv_id}/messages")
def add_message(conv_id: str, req: AddMessageRequest, db: Database = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        c = db.conversations.find_one({"_id": ObjectId(conv_id), "user_id": current_user["id"]})
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid conversation ID") from exc
        
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    m = {
        "conversation_id": conv_id,
        "is_ai": req.isAi,
        "text_en": req.textEn,
        "text_ar": req.textAr,
        "sources": req.sources,
        "retrieval": req.retrieval,
        "safety": req.safety,
        "cited_ranks": req.citedRanks or [],
        "created_at": datetime.utcnow()
    }
    res = db.messages.insert_one(m)
    
    update_data = {}
    if req.mood:
        update_data["mood"] = req.mood.dict()
    if req.title:
        update_data["title"] = req.title
        update_data["title_ar"] = req.title
        
    if update_data:
        db.conversations.update_one({"_id": ObjectId(conv_id)}, {"$set": update_data})
        
    return {"status": "ok", "message_id": str(res.inserted_id)}

@router.get("/conversations/{conv_id}/messages")
def get_conversation_messages(conv_id: str, db: Database = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        c = db.conversations.find_one({"_id": ObjectId(conv_id), "user_id": current_user["id"]})
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid conversation ID") from exc
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs_cursor = db.messages.find({"conversation_id": conv_id}).sort("created_at", 1)
    msgs = []
    for m in msgs_cursor:
        msgs.append({
            "id": str(m["_id"]),
            "isAi": m.get("is_ai", False),
            "textEn": m.get("text_en", ""),
            "textAr": m.get("text_ar", ""),
            "sources": m.get("sources", []),
            "retrieval": m.get("retrieval"),
            "safety": m.get("safety"),
            "citedRanks": m.get("cited_ranks", []),
            "created_at": m.get("created_at", datetime.utcnow()).strftime("%H:%M")
        })
    return {"messages": msgs, "title": c.get("title", ""), "title_ar": c.get("title_ar", "")}


@router.delete("/conversations/{conv_id}")
def delete_conversation(conv_id: str, db: Database = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        c = db.conversations.find_one({"_id": ObjectId(conv_id), "user_id": current_user["id"]})
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid conversation ID") from exc
        
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.conversations.delete_one({"_id": ObjectId(conv_id)})
    db.messages.delete_many({"conversation_id": conv_id})
    db.journey_session_summaries.delete_many({"conversation_id": conv_id, "user_id": current_user["id"]})
    return {"status": "ok"}
