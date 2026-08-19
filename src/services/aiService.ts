const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const RAG_BACKEND_URL = `${API_BASE_URL}/chat`;

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function sendChatMessage(messagesHistory: { isAi: boolean; textEn: string; textAr: string }[], userLanguage: string): Promise<string> {
  const lastUserMsg = messagesHistory.filter(m => !m.isAi).pop();
  const userText = lastUserMsg ? (userLanguage === 'ar' ? (lastUserMsg.textAr || lastUserMsg.textEn) : (lastUserMsg.textEn || lastUserMsg.textAr)) : "";

  if (userText.trim()) {
    try {
      const ragResponse = await fetch(RAG_BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          message: userText,
          history: messagesHistory.map(msg => ({
            role: msg.isAi ? 'assistant' : 'user',
            content: userLanguage === 'ar' ? (msg.textAr || msg.textEn) : (msg.textEn || msg.textAr)
          }))
        })
      });

      if (!ragResponse.ok) {
        throw new Error(`Server returned ${ragResponse.status}`);
      }

      const ragData = await ragResponse.json();
      if (ragData.answer && ragData.answer.trim()) {
        return ragData.answer;
      }
    } catch (ragError) {
      console.error("AI Chat Service Error:", ragError);
      return userLanguage === 'ar'
        ? "أواجه صعوبة في الاتصال بالخادم الآن، هل يمكنك المحاولة مرة أخرى لاحقاً؟"
        : "I am having trouble connecting to the server right now, could you try again later?";
    }
  }

  return userLanguage === 'ar'
    ? "أنا هنا أستمع إليك، أخبرني المزيد عما تشعر به الآن."
    : "I am here listening to you, share more about how you feel right now.";
}
