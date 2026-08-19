import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useChatContext } from '../../context/ChatContext';

const moods = [
  { key: 'calm' as const, label: 'Calm', labelAr: 'هادئ', color: 'bg-emerald-400' },
  { key: 'anxious' as const, label: 'Anxious', labelAr: 'قلق', color: 'bg-blue-400' },
  { key: 'stressed' as const, label: 'Stressed', labelAr: 'متوتر', color: 'bg-purple-400' },
  { key: 'happy' as const, label: 'Happy', labelAr: 'سعيد', color: 'bg-pink-400' },
];

export default function MoodTracker() {
  const { t, lang } = useLanguage();
  const { mood } = useChatContext();

  const isZero = mood.dominant === '---';
  const dominantText = isZero
    ? (lang === 'ar' ? 'بانتظار الحديث' : 'Waiting...')
    : mood.dominant;

  return (
    <div className="liquid-glass rounded-2xl p-5 border border-white/5 flex flex-col gap-4 mt-8">
      <div className="flex justify-between items-end">
        <span className="text-sm text-white/50 font-medium tracking-wide">
          {t('currentState') || 'Current State'}
        </span>
        <motion.span
          key={mood.dominant}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm font-medium ${isZero ? 'text-white/40' : 'text-emerald-400'}`}
        >
          {dominantText}
        </motion.span>
      </div>

      <div className="mt-3 bg-white/[0.02] rounded-xl p-4 border border-white/5">
        <p className="text-white/70 text-sm leading-relaxed">
          {isZero 
            ? (lang === 'ar' 
                ? 'ابدأ التحدث ليتمكن الذكاء الاصطناعي من فهم مشاعرك وتحليل حالتك المزاجية.' 
                : 'Start chatting so the AI can understand your feelings and analyze your mood.')
            : (lang === 'ar' 
                ? `بناءً على تحليل المحادثة، يبدو أن حالتك المزاجية الغالبة الآن هي (${dominantText}). سَكِينَة هنا لدعمك دائماً.` 
                : `Based on the conversation analysis, your dominant mood right now seems to be (${dominantText}). Sakina is here to support you.`)}
        </p>
      </div>
    </div>
  );
}
