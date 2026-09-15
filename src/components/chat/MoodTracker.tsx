import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useChatContext } from '../../context/ChatContext';

const moodDetails: Record<string, { labelAr: string; labelEn: string; color: string; descAr: string; descEn: string }> = {
  'Depressed': {
    labelAr: 'حزن واكتئاب',
    labelEn: 'Depressed / Low',
    color: 'text-indigo-400',
    descAr: 'المحادثة تعبر عن مشاعر ثقل أو حزن. سكينة موجودة هنا جنبك لتسمعك وتخفف عنك خطوة بخطوة.',
    descEn: 'Conversation reflects heavy feelings of sadness. Sakina is here to listen and support you step by step.'
  },
  'Anxious': {
    labelAr: 'قلق وخوف',
    labelEn: 'Anxious / Fearful',
    color: 'text-amber-400',
    descAr: 'المحادثة تعبر عن مشاعر قلق أو توتر وخوف. خذ نفساً عميقاً، وإحنا هنا عشان نهدّي أفكارك سوا.',
    descEn: 'Conversation reflects feelings of anxiety or fear. Take a deep breath, we are here to help calm your thoughts.'
  },
  'Stressed': {
    labelAr: 'ضغط وإرهاق',
    labelEn: 'Stressed',
    color: 'text-purple-400',
    descAr: 'المحادثة تشير إلى ضغوط وتعب يومي. تذكر أن تمنح نفسك استراحة وتفصل عن الضغوط.',
    descEn: 'Conversation indicates daily pressure and exhaustion. Remember to give yourself a break.'
  },
  'Calm': {
    labelAr: 'هدوء وسكينة',
    labelEn: 'Calm & Balanced',
    color: 'text-emerald-400',
    descAr: 'حالتك تبدو هادئة ومستقرة. استمر في الحفاظ على هذا التوازن والراحة النفسية.',
    descEn: 'Your state seems calm and balanced. Keep nurturing this inner peace.'
  },
  'Happy': {
    labelAr: 'سعادة وأمل',
    labelEn: 'Happy & Hopeful',
    color: 'text-pink-400',
    descAr: 'المحادثة مفعمة بمشاعر إيجابية وأمل. ممتنون لوجودك وطاقتك الجميلة اليوم!',
    descEn: 'Conversation is filled with positivity and hope. Grateful for your presence and energy today!'
  }
};

export default function MoodTracker() {
  const { t, lang } = useLanguage();
  const { mood } = useChatContext();

  const isZero = mood.dominant === '---' || !moodDetails[mood.dominant];
  const detail = moodDetails[mood.dominant];
  const dominantText = isZero
    ? (lang === 'ar' ? 'بانتظار الحديث' : 'Waiting...')
    : (lang === 'ar' ? detail.labelAr : detail.labelEn);
  const dominantColor = isZero ? 'text-white/40' : detail.color;

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
          className={`text-sm font-semibold ${dominantColor}`}
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
            : (lang === 'ar' ? detail.descAr : detail.descEn)}
        </p>
      </div>
    </div>
  );
}
