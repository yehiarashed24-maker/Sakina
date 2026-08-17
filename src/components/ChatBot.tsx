import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { sendChatMessage } from '../services/aiService';

export default function ChatBot() {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      isAi: true,
      textEn: "Hi! I'm Sakina AI 🌿 How are you feeling today?",
      textAr: "مرحباً! أنا سكينة AI 🌿 كيف تشعر اليوم؟"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const newMsg = { id: Date.now(), isAi: false, textEn: userText, textAr: userText };
    const updatedHistory = [...messages, newMsg];

    setMessages(updatedHistory);
    setInput('');
    setIsTyping(true);

    try {
      const aiReply = await sendChatMessage(updatedHistory, lang);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        isAi: true,
        textEn: aiReply,
        textAr: aiReply
      }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 liquid-glass rounded-3xl overflow-hidden z-50 flex flex-col shadow-2xl"
            style={{ maxHeight: '500px', height: '60vh' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-emerald-400"
                />
                <span className="text-white font-medium text-sm">Sakina AI · سكينة</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 hide-scrollbar">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.isAi
                        ? 'bg-white/10 text-white rounded-tl-sm self-start'
                        : 'bg-white text-black rounded-tr-sm self-end'
                    }`}
                  >
                    {lang === 'ar' ? msg.textAr : msg.textEn}
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="self-start bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center"
                  >
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        className="w-1.5 h-1.5 rounded-full bg-white/60"
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={endRef} />
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-white/10 bg-black/20">
              <div className="liquid-glass rounded-full pr-1 pl-4 py-1 flex items-center">
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'اكتب رسالتك...' : 'Type a message...'}
                  className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-white/40"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={handleSend}
                  disabled={isTyping}
                  className="bg-white rounded-full p-2 text-black hover:bg-white/90 transition-colors ml-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 liquid-glass rounded-full p-4 text-white shadow-lg hover:bg-white/10 transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </>
  );
}
