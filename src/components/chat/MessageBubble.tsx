import { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';

interface MessageProps {
  text: string;
  isAi: boolean;
  lang?: 'en' | 'ar';
}

export default function MessageBubble({ text, isAi, lang = 'ar' }: MessageProps) {
  const { speak, stopSpeaking, isSpeaking } = useVoice();
  const [isPlayingThis, setIsPlayingThis] = useState(false);

  const handleToggleSpeak = () => {
    if (isPlayingThis && isSpeaking) {
      stopSpeaking();
      setIsPlayingThis(false);
    } else {
      setIsPlayingThis(true);
      speak(text, lang, () => setIsPlayingThis(false));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full ${isAi ? 'justify-start' : 'justify-end'}`}
    >
      <div 
        className={`relative group p-5 px-7 text-[16px] leading-relaxed shadow-2xl backdrop-blur-md max-w-[85%] md:max-w-[75%] ${
          isAi 
            ? 'liquid-glass text-white/90 rounded-3xl rounded-tl-sm border border-white/10' 
            : 'bg-white text-black font-medium rounded-3xl rounded-tr-sm'
        }`}
      >
        <p className="whitespace-pre-line">{text}</p>

        {isAi && (
          <button
            onClick={handleToggleSpeak}
            title={isPlayingThis ? "Stop Voice" : "Listen to Response"}
            className={`mt-3 flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full transition-all border ${
              isPlayingThis
                ? 'bg-purple-500/20 text-purple-300 border-purple-400/40 animate-pulse'
                : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border-white/5'
            }`}
          >
            {isPlayingThis ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-purple-400" />
                <span>Stop Speaking</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'استمع للرد 🔊' : 'Listen 🔊'}</span>
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
