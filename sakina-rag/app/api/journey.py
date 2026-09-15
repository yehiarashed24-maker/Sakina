from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from pymongo.database import Database
from bson.objectid import ObjectId
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ..database import get_db
from .dependencies import get_current_user
from ..journey.journey_engine import (
    calculate_wellbeing_trend,
    generate_session_summary_rule_based,
    compare_journey_periods,
    synthesize_progress_narrative,
    detect_session_themes
)

router = APIRouter(prefix="/journey", tags=["Journey Intelligence"])

# ----------------- PYDANTIC SCHEMAS -----------------

class CheckinInput(BaseModel):
    mood_score: int = Field(..., ge=1, le=5)
    factors: List[str] = []
    note: Optional[str] = None

class MemorySettingsInput(BaseModel):
    memory_enabled: bool

class ActionCreateInput(BaseModel):
    title: str
    action_type: str = "breathing"


# ----------------- ENDPOINTS -----------------

@router.get("/overview")
def get_journey_overview(
    db: Database = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    """
    Returns the 4 top cards:
    1. CHECK-INS count
    2. ACTIVE DAYS count
    3. CURRENT TREND (Real calculation)
    4. SAFETY STATUS (From real persisted safety checks)
    """
    user_id = current_user["id"]

    # 1. Check-ins
    checkins_cursor = list(db.wellbeing_checkins.find({"user_id": user_id}).sort("created_at", 1))
    checkins_count = len(checkins_cursor)

    # 2. Active Days (Unique days with either checkin or conversation)
    active_dates = set()
    for c in checkins_cursor:
        if "created_at" in c and isinstance(c["created_at"], datetime):
            active_dates.add(c["created_at"].strftime("%Y-%m-%d"))

    convs = list(db.conversations.find({"user_id": user_id}, {"created_at": 1}))
    for cv in convs:
        if "created_at" in cv and isinstance(cv["created_at"], datetime):
            active_dates.add(cv["created_at"].strftime("%Y-%m-%d"))

    active_days_count = len(active_dates)

    # 3. Current Trend
    trend = calculate_wellbeing_trend(checkins_cursor)

    # 4. Safety Status
    # Check latest session summaries for safety signals
    summaries = list(db.journey_session_summaries.find({"user_id": user_id}).sort("created_at", -1).limit(5))
    has_crisis = any(s.get("safety_level") == "CRISIS" for s in summaries)
    has_elevated = any(s.get("safety_level") == "ELEVATED" for s in summaries)
    has_supportive = any(s.get("safety_level") == "SUPPORTIVE_ATTENTION" for s in summaries)

    if has_crisis:
        safety_status = {
            "level": "CRISIS",
            "label": "Crisis Protocol Active",
            "label_ar": "بروتوكول الأزمات مفعّل",
            "badge_color": "red",
            "description": "تم رصد مؤشرات حرجة مؤخراً وتقديم خطوط الدعم المتخصصة فوراً."
        }
    elif has_elevated:
        safety_status = {
            "level": "ELEVATED",
            "label": "Elevated Care",
            "label_ar": "رعاية نفسية مكثفة",
            "badge_color": "amber",
            "description": "لوحظت مشاعر قلق حاد أو ضغط مرتفع خلال الجلسات الأخيرة."
        }
    elif has_supportive:
        safety_status = {
            "level": "SUPPORTIVE_ATTENTION",
            "label": "Supportive Attention",
            "label_ar": "عناية داعمة مستمرة",
            "badge_color": "blue",
            "description": "تفاعلات تعبر عن حزن أو توتر يومي يتم التعامل معها بود واهتمام."
        }
    else:
        safety_status = {
            "level": "NORMAL",
            "label": "No Recent Safety Signals",
            "label_ar": "مستقر وآمن تماماً",
            "badge_color": "emerald",
            "description": "لم يتم رصد أي إشارات خطر في المحادثات الأخيرة."
        }

    return {
        "checkins_count": checkins_count,
        "active_days": active_days_count,
        "current_trend": trend,
        "safety_status": safety_status
    }


@router.post("/checkins")
def create_checkin(
    body: CheckinInput,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Saves a voluntary 1-5 wellbeing check-in.
    Never overwrites historical check-ins.
    """
    user_id = current_user["id"]
    doc = {
        "user_id": user_id,
        "mood_score": body.mood_score,
        "factors": body.factors,
        "note": body.note or "",
        "created_at": datetime.utcnow()
    }
    res = db.wellbeing_checkins.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@router.get("/checkins")
def get_checkins(
    days: int = Query(30, ge=1, le=365),
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns historical check-ins for the authenticated user filtered by days.
    """
    user_id = current_user["id"]
    cutoff = datetime.utcnow() - timedelta(days=days)
    cursor = db.wellbeing_checkins.find({
        "user_id": user_id,
        "created_at": {"$gte": cutoff}
    }).sort("created_at", 1)

    results = []
    for c in cursor:
        results.append({
            "id": str(c["_id"]),
            "mood_score": c["mood_score"],
            "factors": c.get("factors", []),
            "note": c.get("note", ""),
            "date": c["created_at"].strftime("%Y-%m-%d"),
            "time": c["created_at"].strftime("%H:%M"),
            "timestamp": c["created_at"].isoformat()
        })
    return results


@router.get("/timeline")
def get_journey_timeline(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns chronological session list (Chat & Talk) with summaries and themes.
    Auto-summarizes any existing unsummarized conversation on-the-fly.
    """
    user_id = current_user["id"]

    # 1. Fetch existing summaries
    existing_summaries_dict = {}
    for s in db.journey_session_summaries.find({"user_id": user_id}):
        conv_id = s.get("conversation_id")
        if conv_id:
            existing_summaries_dict[conv_id] = s

    # 2. Fetch conversations
    convs = list(db.conversations.find({"user_id": user_id}).sort("created_at", -1))
    valid_conv_ids = {str(cv["_id"]) for cv in convs}

    # Clean up any orphaned summaries from previously deleted conversations
    db.journey_session_summaries.delete_many({
        "user_id": user_id,
        "conversation_id": {"$nin": list(valid_conv_ids)}
    })

    timeline = []

    for cv in convs:
        conv_id = str(cv["_id"])
        created_at = cv.get("created_at", datetime.utcnow())

        if conv_id in existing_summaries_dict:
            s = existing_summaries_dict[conv_id]
            summary_ar = s.get("summary_ar")
            summary_en = s.get("summary_en")
            if not summary_ar or not summary_en:
                msgs_cursor = list(db.messages.find({"conversation_id": conv_id}).sort("created_at", 1))
                regenerated = generate_session_summary_rule_based(
                    msgs_cursor,
                    session_type=s.get("session_type", "chat"),
                    lang="ar",
                )
                summary_ar = regenerated["summary_ar"]
                summary_en = regenerated["summary_en"]
                db.journey_session_summaries.update_one(
                    {"_id": s["_id"]},
                    {"$set": {"summary_ar": summary_ar, "summary_en": summary_en}},
                )
            timeline.append({
                "id": str(s["_id"]),
                "conversation_id": conv_id,
                "session_type": s.get("session_type", "chat"),
                "date": created_at.strftime("%b %d, %Y"),
                "time": created_at.strftime("%H:%M"),
                "summary": s.get("summary", ""),
                "summary_ar": summary_ar,
                "summary_en": summary_en,
                "themes": s.get("themes", []),
                "user_reported_concerns": s.get("user_reported_concerns", []),
                "suggested_actions": s.get("suggested_actions", []),
                "safety_level": s.get("safety_level", "NORMAL")
            })
        else:
            # Auto-summarize existing conversation on the fly
            msgs_cursor = list(db.messages.find({"conversation_id": conv_id}).sort("created_at", 1))
            if msgs_cursor:
                session_type = "talk" if "مكالمة" in cv.get("title_ar", "") or "talk" in cv.get("title", "").lower() else "chat"
                auto_summary = generate_session_summary_rule_based(msgs_cursor, session_type=session_type, lang="ar")
                
                doc = {
                    "user_id": user_id,
                    "conversation_id": conv_id,
                    "session_type": session_type,
                    "summary": auto_summary["summary"],
                    "summary_ar": auto_summary["summary_ar"],
                    "summary_en": auto_summary["summary_en"],
                    "themes": auto_summary["themes"],
                    "user_reported_concerns": auto_summary["user_reported_concerns"],
                    "suggested_actions": auto_summary["suggested_actions"],
                    "safety_level": "NORMAL",
                    "created_at": created_at
                }
                res = db.journey_session_summaries.insert_one(doc)

                timeline.append({
                    "id": str(res.inserted_id),
                    "conversation_id": conv_id,
                    "session_type": session_type,
                    "date": created_at.strftime("%b %d, %Y"),
                    "time": created_at.strftime("%H:%M"),
                    "summary": auto_summary["summary"],
                    "summary_ar": auto_summary["summary_ar"],
                    "summary_en": auto_summary["summary_en"],
                    "themes": auto_summary["themes"],
                    "user_reported_concerns": auto_summary["user_reported_concerns"],
                    "suggested_actions": auto_summary["suggested_actions"],
                    "safety_level": "NORMAL"
                })

    return timeline


@router.get("/themes")
def get_recurring_themes(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns aggregated non-diagnostic topics discussed across user sessions.
    """
    user_id = current_user["id"]
    summaries = list(db.journey_session_summaries.find({"user_id": user_id}))

    theme_counts: Dict[str, int] = {}
    theme_sessions: Dict[str, List[str]] = {}

    for s in summaries:
        conv_id = s.get("conversation_id", "")
        for t in s.get("themes", []):
            theme_counts[t] = theme_counts.get(t, 0) + 1
            if t not in theme_sessions:
                theme_sessions[t] = []
            if conv_id and conv_id not in theme_sessions[t]:
                theme_sessions[t].append(conv_id)

    results = []
    for theme, count in sorted(theme_counts.items(), key=lambda x: x[1], reverse=True):
        results.append({
            "theme": theme,
            "session_count": count,
            "conversation_ids": theme_sessions.get(theme, [])
        })

    return results


@router.get("/progress")
def get_progress_insights(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns calculated progress narrative and Then vs Now comparison.
    Never fabricates false progress.
    """
    user_id = current_user["id"]

    checkins = list(db.wellbeing_checkins.find({"user_id": user_id}).sort("created_at", 1))
    summaries = list(db.journey_session_summaries.find({"user_id": user_id}).sort("created_at", 1))
    completed_actions = db.support_actions.count_documents({"user_id": user_id, "status": "completed"})

    narrative_ar = synthesize_progress_narrative(checkins, summaries, completed_actions, lang="ar")
    narrative_en = synthesize_progress_narrative(checkins, summaries, completed_actions, lang="en")
    comparison = compare_journey_periods(checkins, summaries, days=7)

    return {
        "narrative_ar": narrative_ar,
        "narrative_en": narrative_en,
        "has_comparison": comparison is not None,
        "comparison": comparison,
        "completed_actions_count": completed_actions
    }


@router.get("/actions")
def get_support_actions(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns user support plan actions (e.g. 4-7-8 breathing, journaling).
    Seed initial healthy activities if none exist yet.
    """
    user_id = current_user["id"]
    actions = list(db.support_actions.find({"user_id": user_id}).sort("created_at", -1))

    if not actions:
        # Seed 3 default starter wellness support actions
        defaults = [
            {
                "user_id": user_id,
                "title": "تمرين التنفس المهدئ 4-7-8",
                "title_ar": "تمرين التنفس المهدئ 4-7-8",
                "title_en": "4-7-8 calming breath",
                "action_type": "breathing",
                "status": "pending",
                "created_at": datetime.utcnow()
            },
            {
                "user_id": user_id,
                "title": "اكتب عن 3 حاجات كويسة حصلت النهارده",
                "title_ar": "اكتب عن 3 حاجات كويسة حصلت النهارده",
                "title_en": "Write down three good things from today",
                "action_type": "journaling",
                "status": "pending",
                "created_at": datetime.utcnow()
            },
            {
                "user_id": user_id,
                "title": "تمرين التركيز بالحواس 5-4-3-2-1",
                "title_ar": "تمرين التركيز بالحواس 5-4-3-2-1",
                "title_en": "5-4-3-2-1 sensory grounding exercise",
                "action_type": "grounding",
                "status": "pending",
                "created_at": datetime.utcnow()
            }
        ]
        res = db.support_actions.insert_many(defaults)
        actions = list(db.support_actions.find({"user_id": user_id}))

    results = []
    for a in actions:
        results.append({
            "id": str(a["_id"]),
            "title": a["title"],
            "title_ar": a.get("title_ar", a["title"]),
            "title_en": a.get("title_en", a["title"]),
            "action_type": a.get("action_type", "breathing"),
            "status": a.get("status", "pending"),
            "created_at": a.get("created_at", datetime.utcnow()).isoformat(),
            "completed_at": a.get("completed_at").isoformat() if a.get("completed_at") else None
        })

    completed_count = sum(1 for a in results if a["status"] == "completed")
    return {
        "actions": results,
        "total": len(results),
        "completed": completed_count
    }


@router.post("/actions/{action_id}/complete")
def complete_support_action(
    action_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Marks a support action as completed.
    """
    user_id = current_user["id"]
    try:
        oid = ObjectId(action_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid action ID")

    action = db.support_actions.find_one({"_id": oid, "user_id": user_id})
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    new_status = "pending" if action.get("status") == "completed" else "completed"
    completed_at = datetime.utcnow() if new_status == "completed" else None

    db.support_actions.update_one(
        {"_id": oid},
        {"$set": {"status": new_status, "completed_at": completed_at}}
    )
    return {"status": "ok", "new_status": new_status}


@router.get("/memory-settings")
def get_memory_settings(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Returns user privacy & memory toggle.
    """
    user_id = current_user["id"]
    settings = db.user_memory_settings.find_one({"user_id": user_id})
    if not settings:
        return {"memory_enabled": True}
    return {"memory_enabled": settings.get("memory_enabled", True)}


@router.put("/memory-settings")
def update_memory_settings(
    body: MemorySettingsInput,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Updates user memory toggle. Disabling stops longitudinal context retrieval.
    """
    user_id = current_user["id"]
    db.user_memory_settings.update_one(
        {"user_id": user_id},
        {"$set": {"memory_enabled": body.memory_enabled, "updated_at": datetime.utcnow()}},
        upsert=True
    )
    return {"status": "ok", "memory_enabled": body.memory_enabled}


@router.delete("/memory")
def clear_user_journey_memory(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Full user privacy control: Clears all Journey summaries, check-ins,
    and action history strictly for the authenticated user.
    """
    user_id = current_user["id"]
    r1 = db.journey_session_summaries.delete_many({"user_id": user_id})
    r2 = db.wellbeing_checkins.delete_many({"user_id": user_id})
    r3 = db.support_actions.delete_many({"user_id": user_id})
    return {
        "status": "ok",
        "deleted_summaries": r1.deleted_count,
        "deleted_checkins": r2.deleted_count,
        "deleted_actions": r3.deleted_count
    }


@router.post("/summarize-session/{conv_id}")
def summarize_session(
    conv_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Generates and persists a structured session summary for a specific conversation.
    """
    user_id = current_user["id"]
    try:
        c = db.conversations.find_one({"_id": ObjectId(conv_id), "user_id": user_id})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs = list(db.messages.find({"conversation_id": conv_id}).sort("created_at", 1))
    if not msgs:
        return {"status": "empty", "message": "No messages in conversation"}

    summary_data = generate_session_summary_rule_based(msgs, session_type="chat", lang="ar")
    doc = {
        "user_id": user_id,
        "conversation_id": conv_id,
        "session_type": "chat",
        "summary": summary_data["summary"],
        "summary_ar": summary_data["summary_ar"],
        "summary_en": summary_data["summary_en"],
        "themes": summary_data["themes"],
        "user_reported_concerns": summary_data["user_reported_concerns"],
        "suggested_actions": summary_data["suggested_actions"],
        "safety_level": "NORMAL",
        "created_at": c.get("created_at", datetime.utcnow())
    }

    db.journey_session_summaries.update_one(
        {"user_id": user_id, "conversation_id": conv_id},
        {"$set": doc},
        upsert=True
    )
    return {"status": "ok", "summary": summary_data}
