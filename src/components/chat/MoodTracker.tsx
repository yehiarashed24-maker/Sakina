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

      <div className="space-y-3 mt-2">
        {moods.map(({ key, label, labelAr, color }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-white/40 w-16">
              {lang === 'ar' ? labelAr : label}
            </span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${color}/80 rounded-full`}
                initial={{ width: '0%' }}
                animate={{ width: `${mood[key]}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs text-white/30 w-8 text-right">{mood[key]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
