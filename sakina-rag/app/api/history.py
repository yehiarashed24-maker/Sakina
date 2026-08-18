from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database
from bson.objectid import ObjectId
from typing import List, Optional
from pydantic import BaseModel
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
                "textAr": m.get("text_ar", "")
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
    welcome_ar = "مرحباً بك في سكينة، رفيقك النفسي الذكي. هذه مساحة آمنة وخاصة لتشارك ما يدور في ذهنك. كيف تشعر اليوم؟"
    welcome_en = "Welcome to Sakina. I'm your AI psychological companion. This is a safe, private space for you to share what's on your mind. How are you feeling today?"
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

@router.post("/conversations/{conv_id}/messages")
def add_message(conv_id: str, req: AddMessageRequest, db: Database = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        c = db.conversations.find_one({"_id": ObjectId(conv_id), "user_id": current_user["id"]})
    except Exception:
        return {"error": "invalid id format"}
        
    if not c:
        return {"error": "not found"}
    
    m = {
        "conversation_id": conv_id,
        "is_ai": req.isAi,
        "text_en": req.textEn,
        "text_ar": req.textAr,
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

@router.delete("/conversations/{conv_id}")
def delete_conversation(conv_id: str, db: Database = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        c = db.conversations.find_one({"_id": ObjectId(conv_id), "user_id": current_user["id"]})
    except Exception:
        return {"error": "invalid format"}
        
    if c:
        db.conversations.delete_one({"_id": ObjectId(conv_id)})
        db.messages.delete_many({"conversation_id": conv_id})
    return {"status": "ok"}
