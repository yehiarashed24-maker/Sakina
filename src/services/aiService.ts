const RAG_BACKEND_URL = "http://localhost:8000/chat";
const OPENROUTER_API_KEY = "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";

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPT = `أنت "سكينة AI" (Sakina AI)، رفيق وتطبيق ذكاء اصطناعي متخصص في الصحة النفسية والدعم النفسي والعاطفي (AI Mental Wellness Companion).
دورك هو توفير مساحة آمنة، دافئة، هادئة وخالية من الأحكام للمستخدمين للحديث عن مشاعرهم، القلق، التوتر، أو أي مشاعر تثقل كاهلهم.

قواعد وأسلوب الحديث:
1. التحدث بلغة دافئة، متفهمة، حنونة، وهادئة جداً.
2. الرد بنفس لغة المستخدم (إذا كتب بالعربية ترد بالعربية الفصحى البسيطة والدافئة، وإذا كتب بالإنجليزية ترد بالإنجليزية).
3. استخدام أسلوب الاستماع الفعال: اعترف بمشاعر المستخدم، اشعره بأنك تسمعه وتفهمه، واطرح أسئلة لطيفة تتيح له التعبير أكثر.
4. إعطاء إجابات مختصرة ومريحة (2 إلى 4 فقرات قصيرة) دون إرهاق المستخدم بنصوص طويلة جداً.
5. تقديم نصائح هادئة وتمارين تنفس أو إعادة تأطير أفكار عند الحاجة.
6. إذا كان المستخدم يمر بأزمة شديدة أو أفكار خطيرة، كرر دعمك العاطفي وانصحه بلطف بالتواصل مع مختص أو خط مساعدة نفسي.`;

export async function sendChatMessage(messagesHistory: { isAi: boolean; textEn: string; textAr: string }[], userLanguage: string): Promise<string> {
  const lastUserMsg = messagesHistory.filter(m => !m.isAi).pop();
  const userText = lastUserMsg ? (userLanguage === 'ar' ? (lastUserMsg.textAr || lastUserMsg.textEn) : (lastUserMsg.textEn || lastUserMsg.textAr)) : "";

  // 1. Try Python RAG Backend First
  if (userText.trim()) {
    try {
      const ragResponse = await fetch(RAG_BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userText })
      });

      if (ragResponse.ok) {
        const ragData = await ragResponse.json();
        if (ragData.answer && ragData.answer.trim()) {
          console.log("🟢 RAG Backend Response received:", ragData);
          return ragData.answer;
        }
      }
    } catch (ragError) {
      console.warn("⚠️ Python RAG Backend not responding, falling back to direct OpenRouter AI...", ragError);
    }
  }

  // 2. Direct OpenRouter API Fallback
  const formattedMessages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messagesHistory.map(msg => ({
      role: msg.isAi ? ('assistant' as const) : ('user' as const),
      content: userLanguage === 'ar' ? (msg.textAr || msg.textEn) : (msg.textEn || msg.textAr)
    }))
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "http://localhost:5173",
        "X-Title": "Sakina AI",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 600,
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("OpenRouter API error:", errData);
      throw new Error(errData?.error?.message || "Failed to fetch response from Sakina AI");
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content;
    return reply || (userLanguage === 'ar' ? "أنا هنا معك، هل يمكنك إخباري بمزيد من التفاصيل؟" : "I am here with you. Could you share more details?");
  } catch (error) {
    console.error("AI Chat Service Error:", error);
    return userLanguage === 'ar'
      ? "أنا هنا أستمع إليك، أخبرني المزيد عما تشعر به الآن وسنربط أفكارنا معاً."
      : "I am here listening to you, share more about how you feel right now.";
  }
}
