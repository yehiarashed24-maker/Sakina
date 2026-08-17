import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Send, Mic } from 'lucide-react';
import TiltCard from './TiltCard';
import BackgroundVideo from './BackgroundVideo';
import { useLanguage } from '../context/LanguageContext';

export default function SakinaChatSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t, lang } = useLanguage();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'user',
      textEn: 'I feel anxious and overwhelmed',
      textAr: 'أشعر بالقلق ولا أعرف ماذا أفعل'
    },
    {
      id: 2,
      sender: 'ai',
      textEn: "I'm here with you.\nTell me more about what you're feeling.",
      textAr: 'أنا هنا للاستماع لك.\nأخبرني أكثر عما تشعر به.'
    }
  ]);
  
  const [isTyping, setIsTyping] = useState(false);
  const [aiProcess, setAiProcess] = useState('');

  const processSteps = [
    "step1",
    "step2",
    "step3",
    "step4"
  ] as const;

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      sender: 'user', 
      textEn: input, 
      textAr: input 
    }]);
    setInput('');
    setIsTyping(true);

    let step = 0;
    const interval = setInterval(() => {
      setAiProcess(t(processSteps[step]));
      step++;
      if (step >= processSteps.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsTyping(false);
          setAiProcess('');
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            sender: 'ai',
            textEn: "I hear you, and it's completely normal to feel this way. Let's work through it together.",
            textAr: "أنا أسمعك، ومن الطبيعي تماماً أن تشعر بهذا. دعنا نتجاوز هذا معاً."
          }]);
        }, 800);
      }
    }, 800);
  };

  return (
    <section ref={ref} className="min-h-screen relative flex items-center justify-center p-6 md:p-12 overflow-hidden">
      {/* Cinematic Abstract Background */}
      <BackgroundVideo
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4"
        className="absolute inset-0 w-full h-full object-cover opacity-50"
      />
      
      {/* Overlay gradient for soft emotional light */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 1 }}
        className="w-full max-w-4xl relative z-10"
      >
        <TiltCard className="liquid-glass rounded-3xl md:rounded-[40px] flex flex-col h-[75vh] md:h-[80vh] shadow-2xl shadow-white/5 border border-white/10">
          
          {/* Chat Header */}
          <div className="p-6 md:p-8 flex justify-between items-center border-b border-white/10 bg-black/20">
            <div className="flex flex-col">
              <h3 className="text-white text-2xl md:text-3xl font-instrument italic tracking-tight">Sakina AI</h3>
              <span className="text-white/40 text-sm font-medium mt-1">سكينة</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 liquid-glass rounded-full">
              <motion.div 
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-emerald-400"
              />
              <span className="text-white/80 text-xs font-semibold tracking-widest uppercase">{t('online')}</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 hide-scrollbar">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl ${
                    msg.sender === 'user' 
                      ? 'bg-white text-black rounded-tr-sm' 
                      : 'liquid-glass text-white rounded-tl-sm border border-white/5'
                  }`}>
                    <p className={`text-sm md:text-base leading-relaxed mb-2 ${msg.sender === 'user' ? 'font-medium' : ''}`}>
                      {lang === 'ar' ? msg.textAr : msg.textEn}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing & AI Process Animation */}
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="self-start max-w-[70%] flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3 text-white/50 text-xs tracking-widest uppercase mx-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-3 h-3 border-2 border-white/20 border-t-white/80 rounded-full shrink-0"
                    />
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={aiProcess}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                      >
                        {aiProcess}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  
                  <div className="liquid-glass rounded-2xl rounded-tl-sm p-4 w-24 flex justify-center items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        className="w-2 h-2 rounded-full bg-white/50"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-6 md:p-8 bg-black/20 border-t border-white/10">
            <div className="liquid-glass rounded-full p-2 px-6 flex items-center gap-3 relative">
              <input
                type="text"
                placeholder={t('typeMsg')}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/30 text-sm md:text-base px-2"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              
              <button className="p-3 text-white/50 hover:text-white transition-colors">
                <Mic className="w-5 h-5" />
              </button>
              
              <button 
                onClick={handleSend}
                className={`bg-white rounded-full p-3 text-black hover:bg-white/90 transition-transform hover:scale-105 active:scale-95 ${lang === 'ar' ? 'rotate-180' : ''}`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

        </TiltCard>
      </motion.div>
    </section>
  );
}
