import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import AIThinking from './AIThinking';
import { useLanguage } from '../../context/LanguageContext';
import { useChatContext } from '../../context/ChatContext';
import { sendChatMessage } from '../../services/aiService';

export default function ChatWindow() {
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
    <section className="flex-1 flex flex-col relative z-10 h-screen p-4 md:p-6 md:pl-3">
      <div className="flex-1 liquid-glass rounded-[40px] border border-white/5 shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-2xl bg-white/[0.02]">

        {/* Header */}
        <header className="px-10 py-6 border-b border-white/5 flex items-center justify-between z-20 bg-black/10">
          <div className="flex items-center gap-3">
            <img src="/sakina-logo.png" alt="Sakina AI" className="w-10 h-10 rounded-full object-cover border border-white/20" />
            <div className="flex flex-col">
              <span className={`text-3xl tracking-tight text-white ${lang === 'en' ? 'font-instrument italic' : 'font-semibold'}`}>
                Sakina AI <span className="text-sm font-sans text-white/50 ml-2 not-italic">سَكِينَة</span>
              </span>
              <span className="text-xs text-white/40 mt-1 uppercase tracking-widest font-mono">AI Mental Wellness Companion</span>
            </div>
          </div>
          <div className="flex items-center gap-2 liquid-glass px-5 py-2.5 rounded-full border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
              {lang === 'ar' ? 'متصل' : 'Online'}
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-10 flex flex-col gap-10 hide-scrollbar z-20">
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

        {/* Input */}
        <div className="p-8 pt-0 z-20">
          <div className="liquid-glass bg-white/[0.03] rounded-[32px] p-3 px-6 flex items-center gap-4 border border-white/10 shadow-2xl backdrop-blur-3xl focus-within:border-white/20 transition-all">
            <input
              type="text"
              placeholder={lang === 'en' ? "Share what's on your mind..." : "اكتب ما بداخلك..."}
              className="flex-1 bg-transparent border-none outline-none text-white text-[16px] py-4 px-2 placeholder:text-white/30"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={isTyping || !input.trim()}
              className={`bg-white rounded-full p-4 px-5 ml-2 text-black hover:bg-purple-50 hover:shadow-[0_0_20px_rgba(192,132,252,0.5)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${lang === 'ar' ? 'rotate-180' : ''}`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
