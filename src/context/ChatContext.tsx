import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { sendChatMessageFull } from '../services/aiService';
import type {
  EvidenceSource,
  RetrievalMetadata,
  SafetyMetadata
} from '../services/aiService';

export interface ChatMessage {
  id: string | number;
  isAi: boolean;
  textEn: string;
  textAr: string;
  sources?: EvidenceSource[];
  retrieval?: RetrievalMetadata;
  safety?: SafetyMetadata;
  citedRanks?: number[];
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
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  activeConvId: string | null;
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  mood: MoodState;
  startNewConversation: () => Promise<void>;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (text: string, lang: 'en' | 'ar') => Promise<string | null>;
  isTyping: boolean;
  isLoading: boolean;
}

const zeroMood: MoodState = { calm: 0, anxious: 0, stressed: 0, happy: 0, dominant: '---' };

// Helpers
function calculateMoodFromMessages(msgs: ChatMessage[]): MoodState {
    const userMsgs = msgs.filter(m => !m.isAi);
    if (userMsgs.length === 0) return zeroMood;
    // Only analyze the user's actual messages, not the AI assistant replies
    const fullText = userMsgs.map(m => (m.textAr || "") + " " + (m.textEn || "")).join(" ").toLowerCase();

    const sadKeywords = [
      'sad', 'depress', 'depression', 'depressed', 'crying', 'cry', 'hopeless', 'lonely', 'empty', 'grief',
      'حزن', 'حزين', 'حزينة', 'اكتئاب', 'مكتئب', 'مكتئبة', 'مخنوق', 'مخنوقة', 'يأس', 'يائس', 'بكي', 'بعيط',
      'وحيد', 'وحدة', 'فراغ', 'محبط', 'إحباط', 'موجوع', 'قلبي واجعني'
    ];

    const anxietyKeywords = [
      'anxious', 'anxiety', 'worry', 'worried', 'fear', 'scared', 'panic', 'phobia', 'nervous',
      'قلق', 'قلقان', 'قلقانة', 'خائف', 'خايف', 'خايفة', 'بخاف', 'خوف', 'رعب', 'مرعوب', 'هلع', 'بانيك',
      'توتر', 'متوتر', 'متوترة', 'رهاب', 'ارتعاش'
    ];

    const stressKeywords = [
      'stress', 'stressed', 'overwhelm', 'overwhelmed', 'tired', 'pressure', 'exhausted', 'burnout',
      'ضغط', 'مضغوط', 'مضغوطة', 'تعب', 'تعبان', 'تعبانة', 'إرهاق', 'مرهق', 'مرهقة', 'مجهد', 'مشاكل',
      'مستنزف', 'هموت من التعب', 'حمل ثقيل'
    ];

    const happyKeywords = [
      'happy', 'joy', 'great', 'hope', 'wonderful', 'smile', 'grateful', 'blessed', 'excited',
      'سعيد', 'سعيدة', 'فرح', 'فرحان', 'فرحانة', 'مبسوط', 'مبسوطة', 'أمل', 'متفائل', 'ممتاز', 'بهجة',
      'الحمد لله رايق', 'بخير', 'الحمد لله'
    ];

    const calmKeywords = [
      'calm', 'peace', 'relax', 'relaxed', 'breathing', 'safe', 'rest', 'stable',
      'هدوء', 'هادئ', 'هادية', 'سكينة', 'اطمئنان', 'مطمئن', 'راحة', 'مرتاح', 'مرتاحة', 'مستقر', 'روقان'
    ];

    const countMatches = (words: string[]) => {
      let count = 0;
      words.forEach(w => {
        const regex = new RegExp(w, 'gi');
        const matches = fullText.match(regex);
        if (matches) count += matches.length;
      });
      return count;
    };

    const dCount = countMatches(sadKeywords);
    const aCount = countMatches(anxietyKeywords);
    const sCount = countMatches(stressKeywords);
    const hCount = countMatches(happyKeywords);
    const cCount = countMatches(calmKeywords);
    const totalMatches = dCount + aCount + sCount + hCount + cCount;

    let calmVal = 20, anxiousVal = 20, stressedVal = 20, happyVal = 20, sadVal = 20;
    if (totalMatches > 0) {
      sadVal = Math.min(95, Math.max(10, Math.round(15 + (dCount / totalMatches) * 80)));
      anxiousVal = Math.min(95, Math.max(10, Math.round(15 + (aCount / totalMatches) * 80)));
      stressedVal = Math.min(95, Math.max(10, Math.round(15 + (sCount / totalMatches) * 80)));
      happyVal = Math.min(95, Math.max(10, Math.round(15 + (hCount / totalMatches) * 80)));
      calmVal = Math.min(95, Math.max(10, Math.round(15 + (cCount / totalMatches) * 80)));
    } else {
      // If user just started chatting without strong emotional keywords yet
      calmVal = 40; anxiousVal = 20; stressedVal = 20; happyVal = 30; sadVal = 20;
    }

    const scores = [
      { name: 'Depressed', nameAr: 'حزن واكتئاب', val: sadVal },
      { name: 'Anxious', nameAr: 'قلق وخوف', val: anxiousVal },
      { name: 'Stressed', nameAr: 'توتر وضغط', val: stressedVal },
      { name: 'Happy', nameAr: 'سعادة وأمل', val: happyVal },
      { name: 'Calm', nameAr: 'هدوء وسكينة', val: calmVal }
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

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const API_BASE = `${API_BASE_URL}/api/history`;

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
        let data = await res.json();
        if (data.length === 0) {
          const createResponse = await fetch(`${API_BASE}/conversations`, { method: 'POST', headers });
          if (createResponse.ok) {
            const refreshResponse = await fetch(`${API_BASE}/conversations`, { headers });
            if (refreshResponse.ok) data = await refreshResponse.json();
          }
        }
        setConversations(data);
        if (data.length > 0) {
          const savedId = localStorage.getItem('sakina_active_id_v3');
          if (savedId && data.some((c: any) => c.id === savedId)) {
            setActiveConvId(savedId);
          } else {
            setActiveConvId(data[0].id);
          }
        }
      } else {
        // Token invalid or expired
        if(res.status === 401) {
            console.error("Token expired or invalid");
            localStorage.removeItem('sakina_token');
            localStorage.removeItem('sakina_user');
            localStorage.removeItem('sakina_active_id_v3');
            window.location.href = '/';
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

  // Re-load when user logs in (triggered via custom event from HeroSection)
  useEffect(() => {
    const handleLogin = () => loadConversations();
    window.addEventListener('sakina:login', handleLogin);
    return () => window.removeEventListener('sakina:login', handleLogin);
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
    localStorage.setItem('sakina_active_id_v3', id);
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
    lang: 'en' | 'ar'
  ): Promise<string | null> => {
    const currentToken = localStorage.getItem('sakina_token');
    if (!text.trim() || isTyping || !currentToken) return null;
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` };

    const targetId = activeConversation.id;
    if (!targetId) {
      console.error("No active conversation ID found");
      return null;
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
      const userSaveResponse = await fetch(`${API_BASE}/conversations/${targetId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ isAi: false, textEn: text, textAr: text, mood: newMood, title: newTitle })
      });
      if (!userSaveResponse.ok) throw new Error(`Could not save user message (${userSaveResponse.status})`);

      // Get AI Response with full evidence metadata
      const fullReply = await sendChatMessageFull(currentMsgs, lang, targetId);
      const aiReply = fullReply.answer;
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        isAi: true,
        textEn: aiReply,
        textAr: aiReply,
        sources: fullReply.sources,
        retrieval: fullReply.retrieval,
        safety: fullReply.safety,
        citedRanks: fullReply.cited_ranks
      };

      // Save AI message to backend with full evidence and safety metadata
      const aiSaveResponse = await fetch(`${API_BASE}/conversations/${targetId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          isAi: true,
          textEn: aiReply,
          textAr: aiReply,
          mood: calculateMoodFromMessages([...currentMsgs, aiMsg]),
          sources: fullReply.sources,
          retrieval: fullReply.retrieval,
          safety: fullReply.safety,
          citedRanks: fullReply.cited_ranks
        })
      });
      if (!aiSaveResponse.ok) throw new Error(`Could not save AI message (${aiSaveResponse.status})`);

      setConversations(prev => prev.map(c => {
        if (c.id !== targetId) return c;
        const newMsgs = [...c.messages, aiMsg];
        return { ...c, messages: newMsgs, mood: calculateMoodFromMessages(newMsgs) };
      }));

      return aiReply;

    } catch (err) {
      console.error("Error sending message:", err);
      return null;
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      setConversations,
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

export const useChat = useChatContext;
