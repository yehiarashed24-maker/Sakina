"""
SAKINA SAFETY ENGINE
====================
Provides transparent, multi-tier safety classification and risk detection
for mental health conversations.

Levels:
- NORMAL: General inquiries, wellness education, daily conversation
- SUPPORTIVE_ATTENTION: Mild distress, sadness, loneliness, daily stress
- ELEVATED: Intense anxiety, panic symptoms, acute distress, feelings of hopelessness
- CRISIS: Explicit or implicit suicidal ideation, active self-harm intent, immediate physical danger

IMPORTANT:
- SAKINA does NOT provide clinical diagnosis.
- For CRISIS level, safety handling takes absolute priority over RAG retrieval.
- Responses are empathetic, non-judgmental, and connect to verified human crisis resources.
"""

from typing import List, Dict, Any
import re

class SafetyLevel:
    NORMAL = "NORMAL"
    SUPPORTIVE_ATTENTION = "SUPPORTIVE_ATTENTION"
    ELEVATED = "ELEVATED"
    CRISIS = "CRISIS"


# Configurable Emergency Hotlines
EMERGENCY_RESOURCES = {
    "Egypt": {
        "hotline": "16328",
        "toll_free": "08008880700",
        "organization": "الأمانة العامة للصحة النفسية وعلاج الإدمان - وزارة الصحة المصرية",
        "description": "خط المساعدة الساخن المجاني للدعم النفسي والاستشارات النفسية في مصر (متاح على مدار 24 ساعة)"
    },
    "Global": {
        "hotline": "988 (USA/Canada) or local emergency services",
        "international_directory": "https://findahelpline.com",
        "description": "Free, confidential support available 24/7. In immediate danger, please contact your local emergency services (e.g. 911, 112, 123)."
    }
}


# Crisis Keywords and Idioms (Arabic & English)
# Includes Modern Standard Arabic and Egyptian Colloquial phrases
CRISIS_PATTERNS_AR = [
    r"عايز\s+انتحر",
    r"عايزة\s+انتحر",
    r"نفسي\s+انتحر",
    r"أفكر\s+في\s+الانتحار",
    r"افكر\s+في\s+الانتحار",
    r"عايز\s+أموت\s+نفسي",
    r"عايز\s+اموت\s+نفسي",
    r"عايزة\s+أموت\s+نفسي",
    r"عايزة\s+اموت\s+نفسي",
    r"أنهي\s+حياتي",
    r"انهي\s+حياتي",
    r"أخلص\s+من\s+حياتي",
    r"اخلص\s+من\s+حياتي",
    r"مش\s+عايز\s+أعيش",
    r"مش\s+عايز\s+اعيش",
    r"مش\s+عايزة\s+أعيش",
    r"مش\s+عايزة\s+اعيش",
    r"الموت\s+أحسن\s+لي",
    r"الموت\s+احسن\s+لي",
    r"مش\s+قادر\s+أكمل\s+حياتي",
    r"مش\s+قادر\s+اكمل\s+حياتي",
    r"أذبح\s+نفسي",
    r"اذبح\s+نفسي",
    r"أقطع\s+شراييني",
    r"اقطع\s+شراييني",
    r"أرمي\s+نفسي",
    r"ارمي\s+نفسي",
    r"شربت\s+سم",
    r"أخذت\s+حبوب\s+عشان\s+أموت",
    r"اخذت\s+حبوب\s+عشان\s+اموت",
    r"أذي\s+نفسي",
    r"أؤذي\s+نفسي",
    r"إيذاء\s+النفس",
    r"ايذاء\s+النفس"
]

CRISIS_PATTERNS_EN = [
    r"\bwant\s+to\s+die\b",
    r"\bwant\s+to\s+kill\s+myself\b",
    r"\bsuicidal\b",
    r"\bsuicide\b",
    r"\bend\s+my\s+life\b",
    r"\bend\s+it\s+all\b",
    r"\bcommit\s+suicide\b",
    r"\bbetter\s+off\s+dead\b",
    r"\bdon'?t\s+want\s+to\s+live\b",
    r"\bhang\s+myself\b",
    r"\bcut\s+my\s+wrists\b",
    r"\boverdose\s+on\b",
    r"\bhurt\s+myself\b",
    r"\bself[\s-]harm\b"
]

ELEVATED_PATTERNS_AR = [
    r"نوبة\s+هلع",
    r"مش\s+قادر\s+أتنفس",
    r"مش\s+قادر\s+اتنفس",
    r"قلبي\s+هيوقف",
    r"رعب\s+شديد",
    r"حاسس\s+إني\s+هموت",
    r"حاسس\s+اني\s+هموت",
    r"انهيار\s+عصبي",
    r"يأس\s+تام",
    r"فقدت\s+كل\s+أمل",
    r"فقدت\s+كل\s+امل",
    r"مخنوق\s+أوي",
    r"مخنوق\s+جداً"
]

ELEVATED_PATTERNS_EN = [
    r"\bpanic\s+attack\b",
    r"\bcan'?t\s+breathe\b",
    r"\bsevere\s+panic\b",
    r"\bmental\s+breakdown\b",
    r"\blost\s+all\s+hope\b",
    r"\bunbearable\s+pain\b",
    r"\boverwhelming\s+terror\b"
]

SUPPORTIVE_PATTERNS_AR = [
    r"حزين",
    r"مكتئب",
    r"قلقان",
    r"متوتر",
    r"وحيد",
    r"مضغوط",
    r"تعبان\s+نفسياً",
    r"مش\s+عارف\s+أعمل\s+إيه",
    r"مش\s+عارف\s+اعمل\s+ايه"
]

SUPPORTIVE_PATTERNS_EN = [
    r"\bsad\b",
    r"\bdepressed\b",
    r"\banxious\b",
    r"\bstressed\b",
    r"\blonely\b",
    r"\bfeeling\s+down\b",
    r"\bexhausted\b",
    r"\bburned\s+out\b"
]


class SafetyCheckResult:
    def __init__(
        self,
        level: str,
        signals: List[str],
        action_required: str,
        safety_message: str = None,
        is_crisis: bool = False
    ):
        self.level = level
        self.signals = signals
        self.action_required = action_required
        self.safety_message = safety_message
        self.is_crisis = is_crisis

    def to_dict(self) -> Dict[str, Any]:
        return {
            "level": self.level,
            "signals": self.signals,
            "action_required": self.action_required,
            "is_crisis": self.is_crisis
        }


def detect_safety_signals(text: str) -> SafetyCheckResult:
    """
    Evaluates input text against transparent safety criteria.
    Returns a SafetyCheckResult with risk indicators and priority level.
    """
    if not text or not text.strip():
        return SafetyCheckResult(
            level=SafetyLevel.NORMAL,
            signals=[],
            action_required="NONE",
            is_crisis=False
        )

    text_clean = text.lower().strip()
    detected_signals = []

    # 1. Check for CRISIS signals (highest priority)
    for pattern in CRISIS_PATTERNS_AR:
        if re.search(pattern, text_clean):
            detected_signals.append(f"AR_CRISIS_SIGNAL: {pattern}")
            
    for pattern in CRISIS_PATTERNS_EN:
        if re.search(pattern, text_clean):
            detected_signals.append(f"EN_CRISIS_SIGNAL: {pattern}")

    if detected_signals:
        is_arabic = bool(re.search(r'[\u0600-\u06FF]', text))
        crisis_reply = generate_crisis_response(is_arabic)
        return SafetyCheckResult(
            level=SafetyLevel.CRISIS,
            signals=detected_signals,
            action_required="SAFETY_OVERRIDE_RESPONSE",
            safety_message=crisis_reply,
            is_crisis=True
        )

    # 2. Check for ELEVATED signals
    for pattern in ELEVATED_PATTERNS_AR:
        if re.search(pattern, text_clean):
            detected_signals.append(f"AR_ELEVATED_SIGNAL: {pattern}")
            
    for pattern in ELEVATED_PATTERNS_EN:
        if re.search(pattern, text_clean):
            detected_signals.append(f"EN_ELEVATED_SIGNAL: {pattern}")

    if detected_signals:
        return SafetyCheckResult(
            level=SafetyLevel.ELEVATED,
            signals=detected_signals,
            action_required="PRIORITIZE_DE_ESCALATION_EMPATHY",
            is_crisis=False
        )

    # 3. Check for SUPPORTIVE_ATTENTION signals
    for pattern in SUPPORTIVE_PATTERNS_AR:
        if re.search(pattern, text_clean):
            detected_signals.append(f"AR_SUPPORTIVE_SIGNAL: {pattern}")
            
    for pattern in SUPPORTIVE_PATTERNS_EN:
        if re.search(pattern, text_clean):
            detected_signals.append(f"EN_SUPPORTIVE_SIGNAL: {pattern}")

    if detected_signals:
        return SafetyCheckResult(
            level=SafetyLevel.SUPPORTIVE_ATTENTION,
            signals=detected_signals,
            action_required="WARM_ACTIVE_LISTENING",
            is_crisis=False
        )

    # 4. NORMAL (Default)
    return SafetyCheckResult(
        level=SafetyLevel.NORMAL,
        signals=[],
        action_required="STANDARD_EVIDENCE_GROUNDED_PROCESSING",
        is_crisis=False
    )


def generate_crisis_response(is_arabic: bool = True) -> str:
    """
    Generates a compassionate, non-judgmental crisis intervention response
    with validated emergency helplines.
    """
    if is_arabic:
        return (
            "أنا هنا معك وأسمعك بكل اهتمام.. أرجوك تذكر أن حياتك وسلامتك مهمة جداً وثمينة، "
            "ولست مضطراً للمرور بهذا الألم بمفردك الآن.\n\n"
            "لأنني ذكاء اصطناعي ولا أستطيع توفير التدخل الطبي الفوري في حالات الطوارئ، "
            "أرجوك تواصل فوراً مع جهات الدعم المتخصصة:\n\n"
            "📞 **في مصر**: الخط الساخن للأمانة العامة للصحة النفسية: **16328** أو **08008880700** (مجاني ومتاح 24 ساعة)\n"
            "🌍 **دولياً**: يمكنك التواصل مع خطوط المساعدة المجانية عبر: **https://findahelpline.com** أو الاتصال برقم الطوارئ المحلي في بلدك فورا.\n\n"
            "أنا أهتم بسلامتك كثيراً.. هل يمكنك التحدث مع شخص تثق به أو التوجه لأقرب مركز رعاية صحية الآن؟"
        )
    else:
        return (
            "I hear you, and I want you to know that you are not alone in this pain. "
            "Your life and safety truly matter, and there is compassionate help available right now.\n\n"
            "Because I am an AI companion and cannot provide emergency medical intervention, "
            "please connect immediately with dedicated human crisis professionals:\n\n"
            "📞 **In the US/Canada**: Call or text **988** (Suicide & Crisis Lifeline - 24/7 free and confidential)\n"
            "📞 **In Egypt**: Mental Health Hotline **16328** or **08008880700** (Free, 24/7)\n"
            "🌍 **International**: Find immediate free, confidential crisis lines in your country at **https://findahelpline.com** or call your local emergency services (911 / 112).\n\n"
            "Please reach out to a trusted loved one or a professional right now. People who understand are ready to support you."
        )
