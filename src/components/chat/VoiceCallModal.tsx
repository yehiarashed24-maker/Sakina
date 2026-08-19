import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Volume2, Sparkles, Send } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useChatContext } from '../../context/ChatContext';
import { sendChatMessage } from '../../services/aiService';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CallStatus = 'listening' | 'thinking' | 'speaking' | 'idle';

export default function VoiceCallModal({ isOpen, onClose }: VoiceCallModalProps) {
  const { lang } = useLanguage();
  const { messages, sendMessage } = useChatContext();

  const [status, setStatus] = useState<CallStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [debugLog, setDebugLog] = useState<string>('');
  const [manualInput, setManualInput] = useState('');

  const recognitionRef = useRef<any>(null);
  const isCallActiveRef = useRef(false);
  const capturedTextRef = useRef('');

  // Clean Speech Output
  const speakText = useCallback((text: string, onEnded: () => void) => {
    if (!('speechSynthesis' in window)) {
      onEnded();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume(); // Safari audio context unlock

      const cleanText = text
        .replace(/[*_#`~]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .trim();

      if (!cleanText) {
        onEnded();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setStatus('speaking');
      };

      utterance.onend = () => onEnded();
      utterance.onerror = () => onEnded();

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const targetLang = lang === 'ar' ? 'ar' : 'en';
        const preferredVoice = voices.find(v => v.lang.startsWith(targetLang));
        if (preferredVoice) utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error(e);
      onEnded();
    }
  }, [lang]);

  // Process Speech -> Call AI -> Speak Reply -> Loop
  const processUserSpeech = useCallback(async (userText: string) => {
    if (!userText.trim()) return;

    setStatus('thinking');
    setDebugLog(lang === 'ar' ? 'جاري الاتصال بالذكاء الاصطناعي...' : 'Connecting to AI...');

    try {
      // sendMessage handles optimistic UI, API call, and saving to backend
      await sendMessage(userText, lang, sendChatMessage);
      
      // Get the last AI message from context (it was just added)
      // Since context update might be slightly delayed, we can just let the context update UI.
      // But we need the AI text to speak it. 
      // Actually, sendMessage doesn't return the ai reply text.
      // We can intercept the last message, or we can just fetch it again? No, we shouldn't fetch again.
      // Let's modify sendMessage to return the aiReply string in ChatContext later, or we can do a local call.
      // For now, let's do local call just for voice.
      const history = [...messages, { id: Date.now(), isAi: false, textEn: userText, textAr: userText }];
      const aiReply = await sendChatMessage(history, lang);
      setAiResponseText(aiReply);
      setDebugLog(lang === 'ar' ? 'تم استلام الرد، جاري النطق بالتحدث...' : 'Response received, speaking out loud...');

      // Speak reply out loud
      setStatus('speaking');
      speakText(aiReply, () => {
        if (isCallActiveRef.current && !isMuted) {
          restartListening();
        } else {
          setStatus('idle');
          setDebugLog(lang === 'ar' ? 'في انتظار حديثك القادم...' : 'Waiting for next speech...');
        }
      });
    } catch (err) {
      console.error(err);
      setDebugLog(lang === 'ar' ? 'حدث خطأ في الاتصال، جاري المحاولة ثانية' : 'Connection error, retrying');
      if (isCallActiveRef.current && !isMuted) {
        restartListening();
      }
    }
  }, [lang, messages, speakText, isMuted, sendMessage]);

  // Restart Listening Loop
  const restartListening = useCallback(() => {
    if (!isCallActiveRef.current || isMuted) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setDebugLog(lang === 'ar' ? 'متصفح Safari حظر المايك التلقائي. يمكنك الكتابة أو ضغط زر المايك بالأسفل' : 'Speech recognition blocked in browser. Use mic button or input below.');
      setStatus('idle');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      capturedTextRef.current = '';

      recognition.onstart = () => {
        setStatus('listening');
        setTranscript('');
        setDebugLog(lang === 'ar' ? 'جاري الاستماع... اتحدث الآن 🎙️' : 'Listening... Speak now 🎙️');
      };

      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        if (text.trim()) {
          capturedTextRef.current = text.trim();
          setTranscript(text.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Call recognition error:", event.error);
        if (event.error === 'no-speech') {
          setDebugLog(lang === 'ar' ? 'لم أسمع صوتاً، جاري إعادة المحاولة...' : 'No speech heard, retrying...');
        } else if (event.error === 'not-allowed') {
          setDebugLog(lang === 'ar' ? 'يرجى السماح بالمايكروفون من إعدادات المتصفح' : 'Microphone access denied');
        }
      };

      recognition.onend = () => {
        const textToSend = capturedTextRef.current;
        capturedTextRef.current = '';

        if (textToSend && isCallActiveRef.current) {
          processUserSpeech(textToSend);
        } else if (isCallActiveRef.current && !isMuted) {
          setTimeout(() => {
            if (isCallActiveRef.current) {
              restartListening();
            }
          }, 500);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setDebugLog(lang === 'ar' ? 'اضغط زر المايك في الأسفل لبدء التحدث' : 'Click mic button to start speaking');
      setStatus('idle');
    }
  }, [lang, isMuted, processUserSpeech]);

  // Open/Close Call lifecycle
  useEffect(() => {
    if (isOpen) {
      isCallActiveRef.current = true;
      restartListening();
    } else {
      isCallActiveRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setStatus('idle');
      setTranscript('');
      setAiResponseText('');
      setDebugLog('');
    }

    return () => {
      isCallActiveRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen, restartListening]);

  const handleManualSend = () => {
    if (!manualInput.trim()) return;
    const text = manualInput.trim();
    setManualInput('');
    processUserSpeech(text);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-black/95 backdrop-blur-3xl text-white select-none overflow-y-auto"
      >
        {/* Top Header Bar */}
        <div className="w-full max-w-xl flex items-center justify-between z-10 pt-2">
          <div className="flex items-center gap-3">
            <img src="/sakina-logo.png" alt="Sakina AI" className="w-10 h-10 rounded-full border border-white/20" />
            <div>
              <h3 className="font-semibold text-lg">Sakina Voice Mode</h3>
              <p className="text-xs text-blue-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                {lang === 'ar' ? 'وضع المحادثة الصوتية المباشرة' : 'Live Voice Session'}
              </p>
            </div>
          </div>

          <div className="liquid-glass px-4 py-1.5 rounded-full text-xs font-mono text-blue-300 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            ChatGPT Blue Orb Mode
          </div>
        </div>

        {/* Central ChatGPT Signature Blue Glowing Orb */}
        <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-md my-auto py-4">
          
          {/* Animated Pulsing Blue Aura Rings */}
          <div className="relative flex items-center justify-center">
            {status === 'listening' && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.45, 1], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-64 h-64 rounded-full bg-blue-600/30 blur-2xl"
                />
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  className="absolute w-48 h-48 rounded-full bg-cyan-500/40 blur-xl"
                />
              </>
            )}

            {status === 'thinking' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className="absolute w-56 h-56 rounded-full border-2 border-indigo-500/40 border-t-cyan-300 blur-sm"
              />
            )}

            {status === 'speaking' && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.95, 0.4] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-64 h-64 rounded-full bg-indigo-600/40 blur-2xl"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-50 h-50 rounded-full bg-blue-400/50 blur-lg"
                />
              </>
            )}

            {/* Core Blue Orb Sphere (ChatGPT Icon) */}
            <motion.div
              animate={{
                scale: status === 'speaking' ? [1, 1.1, 1] : status === 'listening' ? [1, 1.05, 1] : 1
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className={`w-36 h-36 md:w-40 md:h-40 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-3xl transition-all duration-700 border cursor-pointer ${
                status === 'listening'
                  ? 'bg-gradient-to-tr from-blue-700/60 via-cyan-600/50 to-blue-400/60 border-cyan-400/60 shadow-[0_0_60px_rgba(59,130,246,0.7)]'
                  : status === 'thinking'
                  ? 'bg-gradient-to-tr from-indigo-700/60 via-purple-600/50 to-blue-500/60 border-purple-400/60 shadow-[0_0_60px_rgba(147,51,234,0.7)]'
                  : status === 'speaking'
                  ? 'bg-gradient-to-tr from-sky-600/60 via-blue-500/50 to-indigo-400/60 border-sky-300/60 shadow-[0_0_60px_rgba(56,189,248,0.8)]'
                  : 'bg-blue-900/40 border-white/30'
              }`}
              onClick={restartListening}
            >
              {status === 'thinking' ? (
                <Sparkles className="w-14 h-14 text-cyan-200 animate-spin" />
              ) : status === 'speaking' ? (
                <Volume2 className="w-14 h-14 text-white animate-pulse" />
              ) : (
                <Mic className="w-14 h-14 text-cyan-100 animate-pulse" />
              )}
            </motion.div>
          </div>

          {/* Status Label */}
          <div className="mt-8 text-center flex flex-col items-center gap-2">
            <h4 className="text-2xl font-light tracking-wide text-white">
              {status === 'listening' && (lang === 'ar' ? 'تحدث الآن... أنا أستمع إليك 🎙️' : 'Listening... Speak now 🎙️')}
              {status === 'thinking' && (lang === 'ar' ? 'سكينة تفكر...' : 'Sakina is thinking...')}
              {status === 'speaking' && (lang === 'ar' ? 'سكينة تتحدث...' : 'Sakina is speaking...')}
              {status === 'idle' && (lang === 'ar' ? 'اضغط الكرة لبدء التحدث' : 'Click Orb to speak')}
            </h4>
            
            {debugLog && (
              <p className="text-xs text-cyan-300/90 bg-blue-950/60 px-4 py-1.5 rounded-full border border-blue-500/30 font-mono">
                {debugLog}
              </p>
            )}
          </div>

          {/* Subtitles / Floating Text Card */}
          {(transcript || aiResponseText) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 w-full liquid-glass p-4 px-6 rounded-2xl border border-blue-400/20 text-center max-w-md shadow-2xl"
            >
              {status === 'listening' && (
                <p className="text-cyan-300 text-sm italic font-medium">
                  "{transcript || (lang === 'ar' ? 'تحدث الآن...' : 'Speak now...')}"
                </p>
              )}
              {status === 'speaking' && (
                <p className="text-white/90 text-sm leading-relaxed">
                  "{aiResponseText}"
                </p>
              )}
            </motion.div>
          )}

          {/* Quick Presets for instant voice testing */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
            {[
              lang === 'ar' ? 'أشعر بالقلق اليوم' : 'I feel anxious today',
              lang === 'ar' ? 'كيف يمكنك مساعدتي؟' : 'How can you help me?',
              lang === 'ar' ? 'أحتاج نصيحة سريعة' : 'I need quick advice'
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => processUserSpeech(preset)}
                className="text-xs bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-full transition-all text-white/80"
              >
                🗣️ "{preset}"
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar & Call Controls */}
        <div className="w-full max-w-md flex flex-col items-center gap-4 pb-4 z-10">
          {/* Quick Text Send inside Voice Call */}
          <div className="w-full liquid-glass rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/10">
            <input
              type="text"
              placeholder={lang === 'ar' ? 'أو اكتب هنا لتسمع الرد صوتاً...' : 'Or type here to speak reply...'}
              className="flex-1 bg-transparent border-none outline-none text-white text-xs px-2 placeholder:text-white/40"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSend()}
            />
            <button
              onClick={handleManualSend}
              className="bg-white rounded-full p-2 text-black hover:bg-white/90 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-6">
            {/* Mute Mic */}
            <button
              onClick={() => {
                if (isMuted) {
                  setIsMuted(false);
                  restartListening();
                } else {
                  setIsMuted(true);
                  if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) {}
                  setStatus('idle');
                }
              }}
              className={`p-4 rounded-full backdrop-blur-xl border transition-all ${
                isMuted
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                  : 'bg-white/10 text-white/80 hover:text-white border-white/10 hover:bg-white/20'
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* End Call / Close Button */}
            <button
              onClick={onClose}
              className="p-5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(220,38,38,0.8)] transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
              title="End Voice Mode & Return to Chat"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
