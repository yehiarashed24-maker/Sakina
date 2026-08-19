import { useState, useRef, useEffect } from 'react';
import { Send, Mic } from 'lucide-react';
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
            <MicButton lang={lang} onResult={(t) => setInput(p => (p ? p + ' ' : '') + t)} />
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

// ── Mic Button — uses browser's built-in Speech Recognition (no API needed) ──
function MicButton({ lang, onResult }: { lang: string; onResult: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  const toggle = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SR) {
      alert(lang === 'ar'
        ? 'الميكروفون يعمل على Chrome فقط. يرجى استخدام Chrome.'
        : 'Speech input only works on Chrome. Please use Chrome.');
      return;
    }

    // Stop if already listening
    if (listening) {
      recRef.current?.abort();
      setListening(false);
      return;
    }

    const rec = new SR();
    rec.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    rec.continuous = true;       // keep going until user clicks stop
    rec.interimResults = true;   // show partial results

    let finalTranscript = '';

    rec.onstart = () => setListening(true);

    rec.onresult = (e: any) => {
      let interim = '';
      finalTranscript = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
    };

    rec.onend = () => {
      setListening(false);
      const text = finalTranscript.trim();
      if (text) onResult(text);
    };

    rec.onerror = (e: any) => {
      console.error('STT:', e.error);
      setListening(false);
    };

    recRef.current = rec;
    rec.start();
  };

  return (
    <div className="relative">
      {listening && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-red-300 whitespace-nowrap animate-pulse">
          {lang === 'ar' ? '● يسجل' : '● Recording'}
        </span>
      )}
      <button
        type="button"
        onClick={toggle}
        title={listening
          ? (lang === 'ar' ? 'اضغط لإيقاف التسجيل' : 'Click to stop')
          : (lang === 'ar' ? 'اضغط للكلام' : 'Click to speak')}
        className={`relative p-3.5 rounded-full border transition-all ${
          listening
            ? 'bg-red-500/40 border-red-400 shadow-[0_0_18px_rgba(239,68,68,0.6)]'
            : 'bg-blue-500/20 border-blue-400/40 hover:bg-blue-500/40 hover:scale-110'
        }`}
      >
        {listening && <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-60" />}
        <Mic className={`w-5 h-5 relative z-10 ${listening ? 'text-red-300 animate-pulse' : 'text-cyan-300'}`} />
      </button>
    </div>
  );
}
