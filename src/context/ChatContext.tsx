import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ChatMessage {
  id: string | number;
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
  id: string;
  title: string;
  titleAr?: string;
  time: string;
  messages: ChatMessage[];
  mood: MoodState;
}

interface ChatContextType {
  conversations: Conversation[];
  activeConvId: string | null;
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  mood: MoodState;
  startNewConversation: () => Promise<void>;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (text: string, lang: 'en' | 'ar', sendApiCall: (history: ChatMessage[], lang: string) => Promise<string>) => Promise<void>;
  isTyping: boolean;
  isLoading: boolean;
}

const zeroMood: MoodState = { calm: 0, anxious: 0, stressed: 0, happy: 0, dominant: '---' };

// Helpers
function calculateMoodFromMessages(msgs: ChatMessage[]): MoodState {
    const userMsgs = msgs.filter(m => !m.isAi);
    if (userMsgs.length === 0) return zeroMood;
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

    let calmVal = 50, anxiousVal = 20, stressedVal = 20, happyVal = 30;
    if (totalMatches > 0) {
      calmVal = Math.min(95, Math.max(10, Math.round(20 + (cCount / totalMatches) * 75)));
      anxiousVal = Math.min(95, Math.max(10, Math.round(15 + (aCount / totalMatches) * 80)));
      stressedVal = Math.min(95, Math.max(10, Math.round(10 + (sCount / totalMatches) * 85)));
      happyVal = Math.min(95, Math.max(10, Math.round(15 + (hCount / totalMatches) * 75)));
    } else {
      calmVal = 60; anxiousVal = 25; stressedVal = 20; happyVal = 40;
    }

    const scores = [
      { name: 'Calm', val: calmVal }, { name: 'Anxious', val: anxiousVal },
      { name: 'Stressed', val: stressedVal }, { name: 'Happy', val: happyVal }
    ];
    scores.sort((a, b) => b.val - a.val);

    return { calm: calmVal, anxious: anxiousVal, stressed: stressedVal, happy: happyVal, dominant: scores[0].name };
}


const ChatContext = createContext<ChatContextType | undefined>(undefined);

const API_BASE = "http://localhost:8000/history";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    const currentToken = localStorage.getItem('sakina_token');
    if (!currentToken) {
      setIsLoading(false);
      return;
    }
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` };
    try {
      const res = await fetch(`${API_BASE}/conversations`, { headers });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0) {
          const savedId = localStorage.getItem('sakina_active_id_v3');
          if (savedId && data.some((c: any) => c.id === savedId)) {
            setActiveConvId(savedId);
          } else {
            setActiveConvId(data[0].id);
          }
        } else {
          await startNewConversation();
        }
      } else {
        // Token invalid or expired
        if(res.status === 401) {
            console.error("Token expired or invalid");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeConvId) {
      localStorage.setItem('sakina_active_id_v3', activeConvId);
    }
  }, [activeConvId]);

  const startNewConversation = async () => {
    const currentToken = localStorage.getItem('sakina_token');
    if (!currentToken) return;
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` };
    try {
      const res = await fetch(`${API_BASE}/conversations`, { method: 'POST', headers });
      if (res.ok) {
        await loadConversations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const switchConversation = (id: string) => {
    setActiveConvId(id);
  };

  const deleteConversation = async (id: string) => {
    const currentToken = localStorage.getItem('sakina_token');
    if (!currentToken) return;
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` };
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        await loadConversations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConvId) || {
    id: "", title: 'Loading...', time: '', messages: [], mood: zeroMood
  };

  const sendMessage = async (
    text: string, 
    lang: 'en' | 'ar', 
    sendApiCall: (history: ChatMessage[], lang: string) => Promise<string>
  ) => {
    const currentToken = localStorage.getItem('sakina_token');
    if (!text.trim() || isTyping || !currentToken) return;
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` };

    const targetId = activeConversation.id;
    if (!targetId) {
      console.error("No active conversation ID found");
      return;
    }

    const userMsg: ChatMessage = { id: Date.now(), isAi: false, textEn: text, textAr: text };
    
    // Optimistic UI Update
    setConversations(prev => prev.map(c => {
      if (c.id !== targetId) return c;
      const newMsgs = [...c.messages, userMsg];
      const newTitle = c.messages.filter(m => !m.isAi).length === 0 ? (text.length > 28 ? text.slice(0, 28) + '...' : text) : c.title;
      return { ...c, title: newTitle, messages: newMsgs, mood: calculateMoodFromMessages(newMsgs) };
    }));

    setIsTyping(true);

    try {
      // Get latest state for backend sync
      const currentMsgs = [...activeConversation.messages, userMsg];
      const newTitle = activeConversation.messages.filter(m => !m.isAi).length === 0 ? (text.length > 28 ? text.slice(0, 28) + '...' : text) : undefined;
      const newMood = calculateMoodFromMessages(currentMsgs);

      // Save user message to backend
      await fetch(`${API_BASE}/conversations/${targetId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ isAi: false, textEn: text, textAr: text, mood: newMood, title: newTitle })
      });

      // Get AI Response
      const aiReply = await sendApiCall(currentMsgs, lang);
      const aiMsg: ChatMessage = { id: Date.now() + 1, isAi: true, textEn: aiReply, textAr: aiReply };

      // Optimistic UI Update for AI
      setConversations(prev => prev.map(c => {
        if (c.id !== targetId) return c;
        const newMsgs2 = [...c.messages, aiMsg];
        return { ...c, messages: newMsgs2, mood: calculateMoodFromMessages(newMsgs2) };
      }));

      // Save AI message to backend
      await fetch(`${API_BASE}/conversations/${targetId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ isAi: true, textEn: aiReply, textAr: aiReply, mood: calculateMoodFromMessages([...currentMsgs, aiMsg]) })
      });

    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConvId,
      activeConversation,
      messages: activeConversation.messages,
      mood: activeConversation.mood || zeroMood,
      startNewConversation,
      switchConversation,
      deleteConversation,
      sendMessage,
      isTyping,
      isLoading
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
