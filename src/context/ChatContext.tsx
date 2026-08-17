import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ChatMessage {
  id: number;
  isAi: boolean;
  textEn: string;
  textAr: string;
}

export interface MoodState {
  calm: number;
  anxious: number;
  stressed: number;
  happy: number;
  dominant: string;
}

export interface Conversation {
  id: number;
  title: string;
  titleAr?: string;
  time: string;
  messages: ChatMessage[];
  mood: MoodState;
}

interface ChatContextType {
  conversations: Conversation[];
  activeConvId: number;
  activeConversation: Conversation;
  messages: ChatMessage[];
  mood: MoodState;
  startNewConversation: () => void;
  switchConversation: (id: number) => void;
  sendMessage: (text: string, lang: 'en' | 'ar', sendApiCall: (history: ChatMessage[], lang: string) => Promise<string>) => Promise<void>;
  isTyping: boolean;
}

const defaultWelcomeMessage: ChatMessage = {
  id: 1,
  isAi: true,
  textEn: "Welcome to Sakina. I'm your AI psychological companion. This is a safe, private space for you to share what's on your mind. How are you feeling today?",
  textAr: "مرحباً بك في سكينة، رفيقك النفسي الذكي. هذه مساحة آمنة وخاصة لتشارك ما يدور في ذهنك. كيف تشعر اليوم؟"
};

const zeroMood: MoodState = {
  calm: 0,
  anxious: 0,
  stressed: 0,
  happy: 0,
  dominant: '---'
};

const initialConversations: Conversation[] = [
  {
    id: 101,
    title: "Feeling anxious today",
    titleAr: "أشعر بالقلق اليوم",
    time: "Just now",
    mood: { calm: 40, anxious: 70, stressed: 50, happy: 20, dominant: 'Anxious' },
    messages: [
      defaultWelcomeMessage,
      {
        id: 2,
        isAi: false,
        textEn: "I feel a lot of anxiety and stress about my work deadlines.",
        textAr: "أشعر بالكثير من القلق والتوتر بشأن مواعيد العمل النهائية."
      },
      {
        id: 3,
        isAi: true,
        textEn: "I understand how overwhelming deadlines can feel. Take a slow, deep breath. You don't have to carry it all at once.",
        textAr: "أفهم كم يمكن أن تكون المواعيد النهائية مرهقة. خذ نفساً عميقاً وبطيئاً. ليس عليك تحمل كل شيء دفعة واحدة."
      }
    ]
  },
  {
    id: 102,
    title: "Understanding my emotions",
    titleAr: "فهم مشاعري",
    time: "Yesterday",
    mood: { calm: 80, anxious: 20, stressed: 15, happy: 65, dominant: 'Calm' },
    messages: [
      defaultWelcomeMessage,
      {
        id: 2,
        isAi: false,
        textEn: "How can I better understand why I feel moody sometimes?",
        textAr: "كيف يمكنني فهم سبب تقلب مجازي في بعض الأحيان بشكل أفضل؟"
      },
      {
        id: 3,
        isAi: true,
        textEn: "Mood fluctuations are completely normal. Observing your triggers without judgment is the first step toward inner peace.",
        textAr: "تقلبات المزاج أمر طبيعي تماماً. ملاحظة مسببات القلق لديك دون إطلاق أحكام هي الخطوة الأولى نحو السلام الداخلي."
      }
    ]
  },
  {
    id: 103,
    title: "Stress management techniques",
    titleAr: "تقنيات إدارة التوتر",
    time: "Last week",
    mood: { calm: 65, anxious: 30, stressed: 60, happy: 40, dominant: 'Stressed' },
    messages: [
      defaultWelcomeMessage,
      {
        id: 2,
        isAi: false,
        textEn: "Can you guide me through a quick breathing exercise?",
        textAr: "هل يمكنك توجيهي خلال تمرين تنفس سريع؟"
      },
      {
        id: 3,
        isAi: true,
        textEn: "Inhale slowly for 4 seconds, hold for 4 seconds, and exhale for 6 seconds. Repeat this 3 times to ground yourself.",
        textAr: "شهيق بطيء لمدة 4 ثوانٍ، احبس نفسك 4 ثوانٍ، ثم زفير لمدة 6 ثوانٍ. كرر هذا 3 مرات لاستعادة هدوئك."
      }
    ]
  }
];

// Helper to calculate mood from text dynamically
function calculateMoodFromMessages(msgs: ChatMessage[]): MoodState {
  const userMsgs = msgs.filter(m => !m.isAi);
  if (userMsgs.length === 0) {
    return zeroMood;
  }

  const fullText = msgs.map(m => m.textEn + " " + m.textAr).join(" ").toLowerCase();
  
  const anxietyKeywords = ['anxious', 'anxiety', 'worry', 'worried', 'fear', 'scared', 'panic', 'قلق', 'خائف', 'خايف', 'رعب', 'توتر'];
  const stressKeywords = ['stress', 'stressed', 'overwhelm', 'overwhelmed', 'tired', 'pressure', 'ضغط', 'تعب', 'إرهاق', 'مجهد'];
  const happyKeywords = ['happy', 'joy', 'great', 'hope', 'wonderful', 'smile', 'سعيد', 'فرح', 'أمل', 'ممتاز', 'بهجة'];
  const calmKeywords = ['calm', 'peace', 'relax', 'breathing', 'safe', 'rest', 'هدوء', 'سكينة', 'اطمئنان', 'راحة', 'مستقر'];

  const countMatches = (words: string[]) => {
    let count = 0;
    words.forEach(w => {
      const regex = new RegExp(w, 'gi');
      const matches = fullText.match(regex);
      if (matches) count += matches.length;
    });
    return count;
  };

  const aCount = countMatches(anxietyKeywords);
  const sCount = countMatches(stressKeywords);
  const hCount = countMatches(happyKeywords);
  const cCount = countMatches(calmKeywords);

  const totalMatches = aCount + sCount + hCount + cCount;

  let calmVal = 50;
  let anxiousVal = 20;
  let stressedVal = 20;
  let happyVal = 30;

  if (totalMatches > 0) {
    calmVal = Math.min(95, Math.max(10, Math.round(20 + (cCount / totalMatches) * 75)));
    anxiousVal = Math.min(95, Math.max(10, Math.round(15 + (aCount / totalMatches) * 80)));
    stressedVal = Math.min(95, Math.max(10, Math.round(10 + (sCount / totalMatches) * 85)));
    happyVal = Math.min(95, Math.max(10, Math.round(15 + (hCount / totalMatches) * 75)));
  } else {
    // Default balanced starting state after first message
    calmVal = 60;
    anxiousVal = 25;
    stressedVal = 20;
    happyVal = 40;
  }

  // Determine dominant
  const scores = [
    { name: 'Calm', val: calmVal },
    { name: 'Anxious', val: anxiousVal },
    { name: 'Stressed', val: stressedVal },
    { name: 'Happy', val: happyVal }
  ];
  scores.sort((a, b) => b.val - a.val);

  return {
    calm: calmVal,
    anxious: anxiousVal,
    stressed: stressedVal,
    happy: happyVal,
    dominant: scores[0].name
  };
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('sakina_conversations_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load saved conversations:", e);
    }
    return initialConversations;
  });

  const [activeConvId, setActiveConvId] = useState<number>(() => {
    try {
      const savedId = localStorage.getItem('sakina_active_id_v3');
      if (savedId) {
        const num = Number(savedId);
        if (!isNaN(num)) return num;
      }
    } catch (e) {
      console.error("Failed to load active conv id:", e);
    }
    return conversations[0]?.id || 101;
  });

  const [isTyping, setIsTyping] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sakina_conversations_v3', JSON.stringify(conversations));
      localStorage.setItem('sakina_active_id_v3', String(activeConvId));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  }, [conversations, activeConvId]);

  const activeConversation = conversations.find(c => c.id === activeConvId) || conversations[0] || {
    id: 101,
    title: 'New Conversation',
    time: 'Just now',
    messages: [defaultWelcomeMessage],
    mood: zeroMood
  };

  const startNewConversation = useCallback(() => {
    const newId = Date.now();
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      titleAr: 'محادثة جديدة',
      time: 'Just now',
      messages: [defaultWelcomeMessage],
      mood: zeroMood
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConvId(newId);
  }, []);

  const switchConversation = useCallback((id: number) => {
    setActiveConvId(id);
  }, []);

  const sendMessage = useCallback(async (
    text: string, 
    lang: 'en' | 'ar', 
    sendApiCall: (history: ChatMessage[], lang: string) => Promise<string>
  ) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      isAi: false,
      textEn: text,
      textAr: text
    };

    // Append user message immediately
    setConversations(prev => prev.map(c => {
      if (c.id !== activeConvId) return c;
      const newMsgs = [...c.messages, userMsg];
      const newTitle = c.messages.filter(m => !m.isAi).length === 0
        ? (text.length > 28 ? text.slice(0, 28) + '...' : text)
        : c.title;

      return {
        ...c,
        title: newTitle,
        messages: newMsgs,
        mood: calculateMoodFromMessages(newMsgs)
      };
    }));

    setIsTyping(true);

    try {
      // Get latest context
      const currentConv = conversations.find(c => c.id === activeConvId);
      const currentMsgs = currentConv ? [...currentConv.messages, userMsg] : [userMsg];

      const aiReply = await sendApiCall(currentMsgs, lang);

      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        isAi: true,
        textEn: aiReply,
        textAr: aiReply
      };

      setConversations(prev => prev.map(c => {
        if (c.id !== activeConvId) return c;
        const newMsgs = [...c.messages, aiMsg];
        return {
          ...c,
          messages: newMsgs,
          mood: calculateMoodFromMessages(newMsgs)
        };
      }));
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsTyping(false);
    }
  }, [activeConvId, conversations, isTyping]);

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConvId,
      activeConversation,
      messages: activeConversation.messages,
      mood: activeConversation.mood || zeroMood,
      startNewConversation,
      switchConversation,
      sendMessage,
      isTyping
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}
