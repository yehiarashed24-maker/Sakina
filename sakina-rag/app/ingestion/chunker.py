from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

TOPIC_KEYWORDS = {
    "Depression": ["اكتئاب", "depress", "مزاج منخفض", "anhedonia", "حزن"],
    "Anxiety": ["قلق", "anxiety", "توتر", "خوف", "worry"],
    "Panic Attacks": ["هلع", "panic", "خفقان", "تسارع ضربات القلب", "نوبة هلع"],
    "Social Anxiety": ["قلق اجتماعي", "رهاب اجتماعي", "social anxiety", "خوف من التقييم"],
    "OCD": ["وسواس", "قهري", "ocd", "أفكار اقتحامية", "طقوس"],
    "PTSD": ["صدمة", "ptsd", "كوابيس", "فلاش باك", "إيذاء النفس", "احداث صادمة"],
    "Stress": ["ضغط", "stress", "إجهاد", "إرهاق"],
    "Sleep Problems": ["نوم", "أرق", "sleep", "insomnia"],
    "Self Esteem": ["انعدام القيمة", "تقدير الذات", "self esteem", "ثقة"],
    "Grief": ["فقدان", "حداد", "grief", "موت"]
}

def detect_topic(text: str) -> str:
    lower_text = text.lower()
    for topic, keywords in TOPIC_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in lower_text:
                return topic
    return "General Mental Health"

def chunk_documents(documents: List[Document], chunk_size: int = 500, chunk_overlap: int = 100) -> List[Document]:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    
    chunks = text_splitter.split_documents(documents)
    
    for chunk in chunks:
        topic = detect_topic(chunk.page_content)
        chunk.metadata["topic"] = topic
        
    return chunks
