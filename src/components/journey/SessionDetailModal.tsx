import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, PhoneCall, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { fetchConversationMessages } from '../../services/journeyService';
import type { TimelineSession, SessionMessage } from '../../services/journeyService';

interface SessionDetailModalProps {
  session: TimelineSession | null;
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'ar';
}

export default function SessionDetailModal({
  session,
  isOpen,
  onClose,
  lang = 'ar'
}: SessionDetailModalProps) {
  const navigate = useNavigate();
  const { switchConversation } = useChat();
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !session) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    fetchConversationMessages(session.conversation_id)
      .then(msgs => setMessages(msgs))
      .catch(() => setMessages([]))
      .finally(() => setIsLoading(false));
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  const handleContinueChat = () => {
    switchConversation(session.conversation_id);
    onClose();
    navigate('/chat');
  };

  const isTalk = session.session_type === 'talk';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0d0b09]/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className={`relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[24px] border border-[#f3efe6]/20 bg-[#0d0b09]/95 text-[#f3efe6] shadow-2xl backdrop-blur-2xl overflow-hidden ${
            lang === 'ar' ? 'text-right' : 'text-left'
          }`}
        >
          {/* Header */}
          <div className="p-6 border-b border-[#f3efe6]/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f3efe6]/[0.06] border border-[#f3efe6]/15 flex items-center justify-center">
                {isTalk ? (
                  <PhoneCall className="w-4 h-4 text-[#f3efe6]" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-[#f3efe6]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#f3efe6]/20 text-[#f3efe6]/70 uppercase">
                    {isTalk ? (lang === 'ar' ? 'محادثة صوتية TALK' : 'Voice Talk') : (lang === 'ar' ? 'محادثة نصية CHAT' : 'Chat Session')}
                  </span>
                  <span className="text-xs font-mono text-[#f3efe6]/40">&bull; {session.date} {session.time}</span>
                </div>
                <h3 className="text-base font-medium text-[#f3efe6] mt-1">
                  {lang === 'ar' ? 'تفاصيل الجلسة ومحتوى الحوار' : 'Session Details & Dialogue'}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#f3efe6]/[0.05] hover:bg-[#f3efe6]/[0.1] text-[#f3efe6]/60 hover:text-[#f3efe6] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content (Scrollable) */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Session Summary Card */}
            <div className="p-4 rounded-[16px] bg-[#f3efe6]/[0.03] border border-[#f3efe6]/15 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#f3efe6]/40 block">
                {lang === 'ar' ? '[ ملخص الجلسة ]' : '[ SESSION SUMMARY ]'}
              </span>
              <p className="text-xs text-[#f3efe6]/90 leading-relaxed font-body">
                {session.summary}
              </p>

              {session.themes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {session.themes.map((th, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full bg-[#f3efe6]/[0.06] text-[#f3efe6]/70 border border-[#f3efe6]/10 text-[10px] font-mono"
                    >
                      #{th}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation Messages Stream */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#f3efe6]/40 block">
                {lang === 'ar' ? '[ نص الحوار المتبادل ]' : '[ MESSAGE TRANSCRIPT ]'}
              </span>

              {isLoading ? (
                <div className="py-8 text-center text-xs font-mono text-[#f3efe6]/40 flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-[#f3efe6]/40 border-t-transparent rounded-full animate-spin" />
                  <span>{lang === 'ar' ? 'جارٍ تحميل الرسائل...' : 'Loading messages...'}</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-[#f3efe6]/40 border border-[#f3efe6]/10 rounded-[14px]">
                  {lang === 'ar' ? 'مفيش رسايل متسجلة للمحادثة دي.' : 'No messages found for this session.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => {
                    const isAi = m.isAi;
                    const text = lang === 'ar' ? (m.textAr || m.textEn) : (m.textEn || m.textAr);
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          isAi ? (lang === 'ar' ? 'items-start' : 'items-start') : (lang === 'ar' ? 'items-end' : 'items-end')
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-[16px] p-3.5 text-xs leading-relaxed ${
                            isAi
                              ? 'bg-[#f3efe6]/[0.05] border border-[#f3efe6]/15 text-[#f3efe6]'
                              : 'bg-[#f3efe6]/15 border border-[#f3efe6]/25 text-[#f3efe6]'
                          }`}
                        >
                          <div className="text-[9px] font-mono text-[#f3efe6]/40 mb-1 flex items-center gap-2">
                            <span>{isAi ? (lang === 'ar' ? 'سكينة' : 'Sakina') : (lang === 'ar' ? 'أنت' : 'You')}</span>
                            {m.created_at && <span>{m.created_at}</span>}
                          </div>
                          <p className="whitespace-pre-wrap font-sans">{text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Action Button */}
          <div className="p-4 border-t border-[#f3efe6]/10 flex items-center justify-between gap-3 bg-[#0d0b09]/80">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-mono text-[#f3efe6]/60 hover:text-[#f3efe6] transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'إغلاق' : 'Close'}
            </button>

            <button
              onClick={handleContinueChat}
              className="group px-5 py-2 rounded-full bg-[#f3efe6] hover:bg-white text-[#0d0b09] font-medium text-xs tracking-tight flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>{lang === 'ar' ? 'كمّل الكلام ده في الشات' : 'Continue in Chat'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
