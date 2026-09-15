const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const RAG_BACKEND_URL = `${API_BASE_URL}/api/chat`;

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface EvidenceSource {
  rank: number;
  source?: string;
  document: string;
  document_title?: string;
  page: number;
  topic: string;
  chunk_id?: string;
  raw_score?: number;
  normalized_relevance?: number;
  qualitative_relevance?: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | string;
  excerpt?: string;
}

export interface RetrievalMetadata {
  top_k: number;
  evidence_strength: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT' | string;
  evidence_score?: number;
  sufficient: boolean;
  is_conversational?: boolean;
  reason?: string;
}

export interface SafetyMetadata {
  level: 'NORMAL' | 'SUPPORTIVE_ATTENTION' | 'ELEVATED' | 'CRISIS' | string;
  signals: string[];
  action_required: string;
  is_crisis: boolean;
}

export interface LatencyMetadata {
  safety_ms: number;
  retrieval_ms: number;
  generation_ms: number;
  total_ms: number;
}

export interface ChatResponseFull {
  answer: string;
  sources: EvidenceSource[];
  retrieval?: RetrievalMetadata;
  safety?: SafetyMetadata;
  cited_ranks?: number[];
  latency_ms?: LatencyMetadata;
}

/**
 * Full RAG inference call returning rich evidence metadata,
 * safety status, and deterministic source citations.
 */
export async function sendChatMessageFull(
  messagesHistory: { isAi: boolean; textEn: string; textAr: string }[],
  userLanguage: string,
  conversationId?: string
): Promise<ChatResponseFull> {
  const lastUserMsg = messagesHistory.filter(m => !m.isAi).pop();
  const userText = lastUserMsg
    ? (userLanguage === 'ar' ? (lastUserMsg.textAr || lastUserMsg.textEn) : (lastUserMsg.textEn || lastUserMsg.textAr))
    : "";

  if (!userText.trim()) {
    return {
      answer: userLanguage === 'ar'
        ? "أنا سامعاك، احكيلي إيه اللي حاسس بيه دلوقتي."
        : "I am here listening to you, share more about how you feel right now.",
      sources: []
    };
  }

  try {
    const token = localStorage.getItem('sakina_token');
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const ragResponse = await fetch(RAG_BACKEND_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: userText,
        language: userLanguage,
        conversation_id: conversationId,
        history: messagesHistory.slice(0, -1).slice(-30).map(msg => ({
          role: msg.isAi ? 'assistant' : 'user',
          content: userLanguage === 'ar' ? (msg.textAr || msg.textEn) : (msg.textEn || msg.textAr)
        }))
      })
    });

    if (!ragResponse.ok) {
      throw new Error(`Server returned ${ragResponse.status}`);
    }

    const ragData = await ragResponse.json();
    return {
      answer: ragData.answer || "",
      sources: ragData.sources || [],
      retrieval: ragData.retrieval,
      safety: ragData.safety,
      cited_ranks: ragData.cited_ranks || [],
      latency_ms: ragData.latency_ms
    };
  } catch (ragError) {
    console.error("AI Chat Service Error:", ragError);
    return {
      answer: userLanguage === 'ar'
        ? "آسفة، مش قادرة أوصل للخدمة دلوقتي. جرّب تاني بعد شوية."
        : "I am having trouble connecting to the server right now, could you try again later?",
      sources: []
    };
  }
}

/**
 * Backward-compatible wrapper returning plain string reply.
 * Used by Sakina Talk (Voice Mode) and audio handlers.
 */
export async function sendChatMessage(
  messagesHistory: { isAi: boolean; textEn: string; textAr: string }[],
  userLanguage: string
): Promise<string> {
  const full = await sendChatMessageFull(messagesHistory, userLanguage);
  return full.answer;
}
