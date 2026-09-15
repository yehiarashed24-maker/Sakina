"""
SAKINA JOURNEY INTELLIGENCE ENGINE
==================================
Longitudinal analysis and pattern reflection for mental wellness.

STRICT MEDICAL & ETHICAL RULES:
- Never infer, state, or record psychiatric diagnoses (Depression, Anxiety, PTSD, OCD, Bipolar, etc.).
- Permitted non-diagnostic vocabulary:
  * Wellbeing signals
  * Self-reported mood
  * Conversation themes
  * Observed conversational patterns
  * User-reported concerns
  * Safety indicators
  * Progress trends
- All metrics are calculated strictly from real user check-ins and session summaries.
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import re

# Non-diagnostic wellness themes with bilingual keyword markers
THEME_KEYWORDS = {
    "Stress & Pressure": [
        "ضغط", "إجهاد", "stress", "overwhelm", "pressure", "مضغوط", "تعبان", "إرهاق", "burned out"
    ],
    "Sleep & Rest": [
        "نوم", "أرق", "sleep", "insomnia", "tired", "مش عارف أنام", "مش عارف انام", "صحيان"
    ],
    "Study & Academic Life": [
        "مذاكرة", "امتحان", "دراسة", "جامعة", "كلية", "study", "exam", "university", "college", "school"
    ],
    "Work & Career": [
        "شغل", "وظيفة", "عمل", "مهنة", "work", "job", "career", "office", "مدير", "زملاء العمل"
    ],
    "Relationships & Social Life": [
        "علاقة", "ارتباط", "أصدقاء", "صحاب", "انفصال", "relationship", "partner", "friends", "breakup"
    ],
    "Family Dynamics": [
        "أهل", "عائلة", "أسرة", "والدي", "والدتي", "family", "parents", "siblings", "بيت العيلة"
    ],
    "Self-Confidence & Growth": [
        "ثقة", "تقدير الذات", "قيمة", "confidence", "self-esteem", "worth", "شك في نفسي"
    ],
    "Motivation & Daily Energy": [
        "شغف", "طاقة", "تسويف", "كسل", "motivation", "procrastination", "energy", "روتين"
    ],
    "Loneliness & Connection": [
        "وحدة", "عزلة", "وحيد", "lonely", "loneliness", "isolated", "مافيش حد يفهمني"
    ],
    "Daily Routine & Mindfulness": [
        "تنفس", "هدوء", "روتين", "استرخاء", "meditation", "breathing", "mindfulness", "routine"
    ]
}


def detect_session_themes(messages: List[Dict[str, Any]]) -> List[str]:
    """
    Extracts non-diagnostic conversation themes from session messages.
    Returns sorted list of matching themes.
    """
    if not messages:
        return ["General Wellness"]

    full_text = " ".join(
        (m.get("textAr", "") or m.get("text_ar", "") or "") + " " +
        (m.get("textEn", "") or m.get("text_en", "") or "")
        for m in messages
    ).lower()

    matched_themes = []
    for theme, keywords in THEME_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw.lower() in full_text)
        if count >= 1:
            matched_themes.append((theme, count))

    # Sort by keyword match frequency
    matched_themes.sort(key=lambda x: x[1], reverse=True)
    
    if not matched_themes:
        return ["General Wellness Reflection"]

    return [t[0] for t in matched_themes[:3]]


def generate_session_summary_rule_based(
    messages: List[Dict[str, Any]], 
    session_type: str = "chat",
    lang: str = "ar"
) -> Dict[str, Any]:
    """
    Creates a non-diagnostic, privacy-conscious summary of a conversation session.
    No internal chain-of-thought or diagnostic labels.
    """
    user_msgs = [m for m in messages if not m.get("is_ai", False) and not m.get("isAi", False)]
    themes = detect_session_themes(messages)

    # Detect user reported concerns
    concerns = []
    for t in themes:
        if t == "Stress & Pressure":
            concerns.append("Managing day-to-day tension and feeling overwhelmed")
        elif t == "Sleep & Rest":
            concerns.append("Difficulty unwinding and irregular sleep patterns")
        elif t == "Study & Academic Life":
            concerns.append("Academic workload and exam-related worry")
        elif t == "Work & Career":
            concerns.append("Workplace responsibilities and work-life balance")
        elif t == "Relationships & Social Life":
            concerns.append("Navigating interpersonal communication and connection")

    if not concerns:
        concerns.append("Reflecting on everyday emotions and personal wellness")

    # Generate suggested wellness support actions
    suggested_actions = []
    if "Stress & Pressure" in themes or "Study & Academic Life" in themes:
        suggested_actions.append({
            "title": "تمرين التنفس 4-7-8 للتهدئة والاسترخاء",
            "title_en": "4-7-8 Breathing Exercise for Calm",
            "type": "breathing"
        })
    if "Sleep & Rest" in themes:
        suggested_actions.append({
            "title": "روتين الاسترخاء قبل النوم بنصف ساعة",
            "title_en": "Pre-sleep Wind-Down Routine",
            "type": "sleep"
        })
    if "Self-Confidence & Growth" in themes or "Motivation & Daily Energy" in themes:
        suggested_actions.append({
            "title": "تدوين 3 مشاعر أو أهداف صغيرة اليوم",
            "title_en": "3 Small Daily Wellness Reflections",
            "type": "journaling"
        })
    if not suggested_actions:
        suggested_actions.append({
            "title": "تمرين التأريض الذهني 5-4-3-2-1",
            "title_en": "5-4-3-2-1 Grounding Exercise",
            "type": "grounding"
        })

    # Summary text
    theme_str_ar = " و".join(themes[:2])
    theme_str_en = " and ".join(themes[:2])
    
    if session_type == "talk":
        summary_ar = f"مكالمة صوتية مع سكينة تناولت الحديث حول {theme_str_ar}، مع استكشاف طرق عملية للتعامل مع المشاعر."
        summary_en = f"Voice conversation with Sakina exploring {theme_str_en}, focusing on supportive coping strategies."
    else:
        summary_ar = f"جلسة محادثة ركزت على موضوعات {theme_str_ar}، ومشاركة المشاعر الحالية مع سكينة."
        summary_en = f"Chat session discussing {theme_str_en}, sharing current emotions and exploring healthy routines."

    summary = summary_ar if lang == "ar" else summary_en

    return {
        "summary": summary,
        "summary_ar": summary_ar,
        "summary_en": summary_en,
        "themes": themes,
        "user_reported_concerns": concerns,
        "suggested_actions": suggested_actions
    }


def calculate_wellbeing_trend(checkins: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculates genuine wellbeing trend from voluntary check-ins.
    NEVER fabricates a positive trend or fake numbers.
    """
    if not checkins or len(checkins) < 2:
        return {
            "status": "Not enough data",
            "status_ar": "لا توجد بيانات كافية بعد",
            "delta": 0.0,
            "average": round(checkins[0]["mood_score"], 1) if checkins else 0.0,
            "has_sufficient_data": False,
            "explanation": "We need at least two voluntary check-ins to identify a reliable pattern."
        }

    # Sort chronologically
    sorted_checkins = sorted(checkins, key=lambda x: x.get("created_at", datetime.min))
    midpoint = len(sorted_checkins) // 2

    earlier_period = sorted_checkins[:midpoint]
    recent_period = sorted_checkins[midpoint:]

    earlier_avg = sum(c["mood_score"] for c in earlier_period) / len(earlier_period)
    recent_avg = sum(c["mood_score"] for c in recent_period) / len(recent_period)
    total_avg = sum(c["mood_score"] for c in sorted_checkins) / len(sorted_checkins)

    delta = round(recent_avg - earlier_avg, 2)

    if delta >= 0.4:
        status = "Improving"
        status_ar = "في تحسن مستمر"
    elif delta <= -0.4:
        status = "Needs Attention"
        status_ar = "يحتاج إلى اهتمام ورعاية"
    elif abs(delta) < 0.4:
        # Check standard deviation / variance
        scores = [c["mood_score"] for c in sorted_checkins]
        variance = sum((s - total_avg) ** 2 for s in scores) / len(scores)
        if variance > 1.8:
            status = "Mixed"
            status_ar = "متفاوت ومتذبذب"
        else:
            status = "Stable"
            status_ar = "مستقر ومتوازن"
    else:
        status = "Stable"
        status_ar = "مستقر"

    return {
        "status": status,
        "status_ar": status_ar,
        "delta": delta,
        "earlier_avg": round(earlier_avg, 2),
        "recent_avg": round(recent_avg, 2),
        "average": round(total_avg, 2),
        "total_checkins": len(checkins),
        "has_sufficient_data": True
    }


def compare_journey_periods(
    checkins: List[Dict[str, Any]], 
    summaries: List[Dict[str, Any]], 
    days: int = 7
) -> Optional[Dict[str, Any]]:
    """
    Compares the current window (e.g. last 7 days) against the previous window (7-14 days ago).
    Returns None if there is not enough historical data in both periods.
    """
    now = datetime.utcnow()
    current_cutoff = now - timedelta(days=days)
    previous_cutoff = now - timedelta(days=days * 2)

    current_checkins = [
        c for c in checkins 
        if c.get("created_at") and c["created_at"] >= current_cutoff
    ]
    previous_checkins = [
        c for c in checkins 
        if c.get("created_at") and previous_cutoff <= c["created_at"] < current_cutoff
    ]

    if not current_checkins or not previous_checkins:
        return None

    current_avg = sum(c["mood_score"] for c in current_checkins) / len(current_checkins)
    previous_avg = sum(c["mood_score"] for c in previous_checkins) / len(previous_checkins)
    delta = round(current_avg - previous_avg, 2)

    # Aggregate themes
    current_themes: Dict[str, int] = {}
    previous_themes: Dict[str, int] = {}

    for s in summaries:
        created = s.get("created_at")
        if not created:
            continue
        if created >= current_cutoff:
            for t in s.get("themes", []):
                current_themes[t] = current_themes.get(t, 0) + 1
        elif previous_cutoff <= created < current_cutoff:
            for t in s.get("themes", []):
                previous_themes[t] = previous_themes.get(t, 0) + 1

    top_current_themes = sorted(current_themes.keys(), key=lambda k: current_themes[k], reverse=True)[:3]
    top_previous_themes = sorted(previous_themes.keys(), key=lambda k: previous_themes[k], reverse=True)[:3]

    return {
        "period_days": days,
        "current_avg": round(current_avg, 2),
        "previous_avg": round(previous_avg, 2),
        "delta": delta,
        "current_count": len(current_checkins),
        "previous_count": len(previous_checkins),
        "top_current_themes": top_current_themes,
        "top_previous_themes": top_previous_themes
    }


def synthesize_progress_narrative(
    checkins: List[Dict[str, Any]], 
    summaries: List[Dict[str, Any]], 
    completed_actions_count: int,
    lang: str = "ar"
) -> str:
    """
    Synthesizes a cautious, transparent progress summary from real stored data.
    Never fabricates false clinical improvements.
    """
    if len(checkins) < 2 and len(summaries) < 2:
        return (
            "نحتاج إلى بضعة تسجيلات وجلسات حوارية إضافية حتى تتمكن سكينة من استخلاص نمط موثوق لرحلتك النفسية."
            if lang == "ar" else
            "We need a few more check-ins and sessions before Sakina can identify a reliable pattern across your journey."
        )

    trend = calculate_wellbeing_trend(checkins)
    recent_themes = []
    for s in summaries[-5:]:
        recent_themes.extend(s.get("themes", []))
    
    from collections import Counter
    theme_counts = Counter(recent_themes)
    top_theme = theme_counts.most_common(1)[0][0] if theme_counts else "الاستقرار العام"

    if lang == "ar":
        narrative = f"خلال تفاعلاتك الأخيرة، كان متوسط تقييمك الذاتي للعافية النفسية هو {trend['average']} من 5. "
        if trend["delta"] > 0:
            narrative += f"يُظهر نمط تسجيلاتك تحسناً تدريجياً بنحو +{trend['delta']} نقطة مقارنة بالفترة السابقة. "
        elif trend["delta"] < 0:
            narrative += f"يُظهر نمط التسجيلات انخفاضاً طفيفاً بنحو {trend['delta']} نقطة، ما يشير إلى أهمية أخذ قسط من الراحة وممارسة الدعم الذاتي. "
        else:
            narrative += "تسجيلاتك تظهر استقراراً عاماً في مستوى الراحة النفسية. "

        narrative += f"تكرر موضوع '{top_theme}' في جلساتك الأخيرة بشكل ملحوظ. "
        if completed_actions_count > 0:
            narrative += f"كما أتممت بنجاح {completed_actions_count} من تمارين الدعم المقترحة لمساندتك."
    else:
        narrative = f"Across your recent interactions, your self-reported wellbeing averaged {trend['average']} out of 5. "
        if trend["delta"] > 0:
            narrative += f"Your check-in trend indicates an improvement of +{trend['delta']} compared to the earlier period. "
        elif trend["delta"] < 0:
            narrative += f"Your check-ins show a slight decrease of {trend['delta']}, highlighting the value of gentle self-care and rest. "
        else:
            narrative += "Your check-ins indicate a balanced and stable pattern overall. "

        narrative += f"Topics related to '{top_theme}' were discussed most frequently. "
        if completed_actions_count > 0:
            narrative += f"You have also completed {completed_actions_count} supportive wellbeing activities."

    return narrative
