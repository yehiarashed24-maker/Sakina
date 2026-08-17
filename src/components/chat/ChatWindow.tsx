import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, Volume2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import MessageBubble from './MessageBubble';
import AIThinking from './AIThinking';
import VoiceCallModal from './VoiceCallModal';
import { useLanguage } from '../../context/LanguageContext';
import { useChatContext } from '../../context/ChatContext';
import { sendChatMessage } from '../../services/aiService';

export default function ChatWindow() {
  const { lang } = useLanguage();
  const { messages, sendMessage, isTyping } = useChatContext();
  const [input, setInput] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, activeStep]);

  useEffect(() => {
    let interval: any;
    if (isTyping) {
      setActiveStep(0);
      interval = setInterval(() => {
        setActiveStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 700);
    } else {
      setActiveStep(0);
    }
    return () => clearInterval(interval);
  }, [isTyping]);

  // Robust Text-to-Speech function for Safari/Chrome on Mac
  const speakResponse = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();

      const cleanText = text
        .replace(/[*_#`~]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const targetLang = lang === 'ar' ? 'ar' : 'en';
        const foundVoice = voices.find(v => v.lang.startsWith(targetLang));
        if (foundVoice) utterance.voice = foundVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error(e);
      setIsPlayingAudio(false);
    }
  }, [lang]);

  // Test Voice Output Button
  const handleTestVoice = () => {
    const testText = lang === 'ar'
      ? "أهلاً بك، أنا سكينة. صوتي يعمل بشكل ممتاز الآن."
      : "Welcome to Sakina. My voice is working perfectly now.";
    speakResponse(testText);
  };

  // Send text message
  const handleSendText = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    setInput('');
    try {
      await sendMessage(textToSend, lang, sendChatMessage);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <section className="flex-1 flex flex-col relative z-10 h-screen p-4 md:p-6 md:pl-3">
        <div className="flex-1 liquid-glass rounded-[40px] border border-white/5 shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-2xl bg-white/[0.02]">

          {/* Header */}
          <header className="px-10 py-6 border-b border-white/5 flex items-center justify-between z-20 bg-black/10">
            <div className="flex items-center gap-3">
              <img src="/sakina-logo.png" alt="Sakina AI" className="w-10 h-10 rounded-full object-cover border border-white/20" />
              <div className="flex flex-col">
                <span className={`text-3xl tracking-tight text-white ${lang === 'en' ? 'font-instrument italic' : 'font-semibold'}`}>
                  Sakina AI <span className="text-sm font-sans text-white/50 ml-2 not-italic">سكينة</span>
                </span>
                <span className="text-xs text-white/40 mt-1 uppercase tracking-widest font-mono">
                  AI Mental Wellness Companion
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* ChatGPT Voice Mode Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsVoiceCallOpen(true)}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium text-xs shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all border border-cyan-400/30"
              >
                <Mic className="w-4 h-4 animate-bounce text-cyan-200" />
                <span>{lang === 'ar' ? 'المحادثة الصوتية (ChatGPT Voice) 🎙️' : 'Voice Mode 🎙️'}</span>
              </motion.button>

              {/* Test Voice Button */}
              <button
                onClick={handleTestVoice}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all text-xs font-medium ${
                  isPlayingAudio
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/40 animate-pulse'
                    : 'liquid-glass text-white/70 hover:text-white border-white/10 hover:bg-white/10'
                }`}
              >
                <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce text-purple-400' : ''}`} />
                <span>{lang === 'ar' ? 'تجربة الصوت 🔊' : 'Test Voice 🔊'}</span>
              </button>

              {/* Online Status */}
              <div className="flex items-center gap-3 liquid-glass px-5 py-2.5 rounded-full border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                  {lang === 'ar' ? 'متصل' : 'Online'}
                </span>
              </div>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-10 flex flex-col gap-10 hide-scrollbar z-20">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  isAi={msg.isAi}
                  text={lang === 'ar' ? msg.textAr : msg.textEn}
                  lang={lang}
                />
              ))}
              {isTyping && (
                <div className="w-full flex justify-start">
                  <AIThinking activeStep={activeStep} />
                </div>
              )}
            </AnimatePresence>
            <div ref={endRef} className="h-4" />
          </div>

          {/* Input */}
          <div className="p-8 pt-0 z-20">
            <div className="liquid-glass bg-white/[0.03] rounded-[32px] p-3 px-6 flex items-center gap-4 border border-white/10 shadow-2xl backdrop-blur-3xl focus-within:border-white/20 focus-within:bg-white/[0.05] transition-all">
              <input
                type="text"
                placeholder={lang === 'en' ? "Share what's on your mind..." : "اكتب ما بداخلك..."}
                className="flex-1 bg-transparent border-none outline-none text-white text-[16px] py-4 px-2 placeholder:text-white/30"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendText(input)}
              />

              {/* Mic Recording Button -> Opens ChatGPT Blue Voice Orb */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
                onClick={() => setIsVoiceCallOpen(true)}
                title={lang === 'ar' ? "بدء المحادثة الصوتية التفاعلية" : "Start ChatGPT Voice Mode"}
                className="p-3.5 rounded-full bg-blue-500/20 text-blue-300 hover:text-white hover:bg-blue-600/40 border border-blue-400/30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                <Mic className="w-5 h-5 text-cyan-300 animate-pulse" />
              </motion.button>

              {/* Send Button */}
              <button
                onClick={() => handleSendText(input)}
                disabled={isTyping || !input.trim()}
                className={`bg-white rounded-full p-4 px-5 ml-2 text-black hover:bg-purple-50 hover:shadow-[0_0_20px_rgba(192,132,252,0.5)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${lang === 'ar' ? 'rotate-180' : ''}`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ChatGPT Signature Blue Orb Voice Mode */}
      <VoiceCallModal
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
      />
    </>
  );
}
