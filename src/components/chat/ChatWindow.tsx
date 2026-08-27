import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MessageSquare, PhoneCall, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import AIThinking from './AIThinking';
import { useLanguage } from '../../context/LanguageContext';
import { useChatContext } from '../../context/ChatContext';
import { sendChatMessage } from '../../services/aiService';

interface ChatWindowProps {
  onSwitchToTalk?: () => void;
}

export default function ChatWindow({ onSwitchToTalk }: ChatWindowProps) {
  const { lang } = useLanguage();
  const { messages, sendMessage, isTyping } = useChatContext();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    return () => clearTimeout(t);
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;
    setInput('');
    try { await sendMessage(text, lang, sendChatMessage); }
    catch (e) { console.error(e); }
  };

  return (
    <section className="flex-1 flex flex-col relative z-10 h-screen p-3 sm:p-4 md:p-6 md:pl-3">
      <div className="flex-1 liquid-glass rounded-[32px] md:rounded-[40px] border border-white/10 shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-2xl bg-white/[0.02]">

        {/* Header with High-Visibility Voice Call Action */}
        <header className="px-5 md:px-8 py-4 md:py-5 border-b border-white/5 flex items-center justify-between z-20 bg-black/20">
          <div className="flex items-center gap-3">
            <img src="/sakina-logo.png" alt="Sakina AI" className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border border-white/20" />
            <div className="flex flex-col">
              <span className={`text-xl md:text-2xl lg:text-3xl tracking-tight text-white ${lang === 'en' ? 'font-instrument italic' : 'font-semibold'}`}>
                Sakina AI <span className="text-xs md:text-sm font-sans text-white/50 ml-1.5 not-italic">سَكِينَة</span>
              </span>
              <span className="text-[9px] md:text-[11px] text-white/40 uppercase tracking-widest font-mono">
                {lang === 'ar' ? 'جلسة العلاج والدعم النفسي' : 'AI Therapy & Wellness Session'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Prominent Voice Call (Talk Mode) Button */}
            {onSwitchToTalk && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSwitchToTalk}
                className="group relative flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-black font-semibold text-xs shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:bg-neutral-100 transition-all cursor-pointer"
                title={lang === 'ar' ? 'بدء المكالمة الصوتية المباشرة مع سكينة' : 'Start Live Voice Call with Sakina'}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <PhoneCall className="w-3.5 h-3.5 text-black" />
                <span className="tracking-wide uppercase font-mono hidden sm:inline">
                  {lang === 'ar' ? 'بدء مكالمة صوتية' : 'Voice Call'}
                </span>
                <span className="tracking-wide uppercase font-mono sm:hidden">
                  TALK
                </span>
              </motion.button>
            )}

            {/* Mode Switch: CHAT | TALK */}
            {onSwitchToTalk && (
              <div className="hidden lg:flex liquid-glass rounded-full p-1 items-center border border-white/10">
                <button
                  className="px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-white/20 text-white font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3 h-3" />
                  CHAT
                </button>
                <button
                  onClick={onSwitchToTalk}
                  className="px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider text-white/50 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-3 h-3" />
                  TALK
                </button>
              </div>
            )}

            {/* Online Status */}
            <div className="hidden md:flex items-center gap-2 liquid-glass px-3.5 py-2 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest font-mono">
                {lang === 'ar' ? 'متصل' : 'Online'}
              </span>
            </div>
          </div>
        </header>

        {/* Top Voice Invitation Banner inside Session */}
        {onSwitchToTalk && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-cyan-950/30 via-neutral-900/40 to-indigo-950/30 border-b border-white/5 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>
                {lang === 'ar'
                  ? 'هل تفضل التحدث بالصوت مباشرة؟ سكينة تستمع إليك وترد بصوتها فوراً'
                  : 'Prefer speaking out loud? Talk to Sakina in real-time cinematic voice call'}
              </span>
            </div>
            <button
              onClick={onSwitchToTalk}
              className="text-xs font-mono font-medium text-cyan-300 hover:text-white underline underline-offset-4 cursor-pointer flex items-center gap-1"
            >
              <span>{lang === 'ar' ? 'انتقل للمكالمة الآن' : 'Switch to Talk'}</span>
              <span>&rarr;</span>
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 flex flex-col gap-6 md:gap-8 hide-scrollbar z-20">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} isAi={msg.isAi}
                text={lang === 'ar' ? msg.textAr : msg.textEn} lang={lang} />
            ))}
            {isTyping && (
              <div className="w-full flex justify-start"><AIThinking /></div>
            )}
          </AnimatePresence>
          <div ref={endRef} className="h-4" />
        </div>

        {/* Input Bar with Direct Voice Call Button */}
        <div className="p-3 sm:p-4 md:p-6 pt-0 z-20">
          <div className="liquid-glass bg-white/[0.03] rounded-[28px] md:rounded-[32px] p-2 md:p-3 px-4 md:px-6 flex items-center gap-3 border border-white/10 shadow-2xl backdrop-blur-3xl focus-within:border-white/20 transition-all">
            <input
              type="text"
              placeholder={lang === 'en' ? "Share what's on your mind..." : "اكتب ما بداخلك..."}
              className="flex-1 bg-transparent border-none outline-none text-white text-sm md:text-base py-2.5 md:py-3 px-2 placeholder:text-white/30"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            />

            {/* Direct Voice Talk shortcut button */}
            {onSwitchToTalk && (
              <button
                onClick={onSwitchToTalk}
                title={lang === 'ar' ? 'بدء المكالمة الصوتية' : 'Start Voice Talk'}
                className="bg-white/10 hover:bg-white/20 rounded-full p-2.5 sm:p-3 text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Mic className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span className="text-xs font-mono text-cyan-200 hidden sm:inline">
                  {lang === 'ar' ? 'تحدث' : 'Talk'}
                </span>
              </button>
            )}

            <button
              onClick={() => handleSend(input)}
              disabled={isTyping || !input.trim()}
              className={`bg-white rounded-full p-2.5 sm:p-3 md:p-3.5 px-4 md:px-5 text-black hover:bg-neutral-100 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${lang === 'ar' ? 'rotate-180' : ''}`}
            >
              <Send className="w-4 h-4 md:w-4 md:h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
