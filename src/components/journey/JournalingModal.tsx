import { createCheckin } from '../../services/journeyService';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Check } from 'lucide-react';

interface JournalingModalProps {
  context?: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  lang?: 'en' | 'ar';
}

export default function JournalingModal({
  isOpen,
  onClose,
  onComplete,
  context = '',
  lang = 'ar'
}: JournalingModalProps) {
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [mood, setMood] = useState(3);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!q1.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      await createCheckin({ mood_score: mood, factors: ['journaling'], note: [context, q1, q2, q3].filter(Boolean).join('\n\n') });
      setIsSaved(true);
      onComplete();
    } catch {
      setError(lang === 'ar' ? 'الحفظ ماكملش. كلامك لسه هنا، جرّب تاني.' : 'Could not save. Your writing is still here; please try again.');
    } finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { onClose(); if (isSaved) { setIsSaved(false); setQ1(''); setQ2(''); setQ3(''); } }}
          className="fixed inset-0 bg-[#0d0b09]/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className={`relative z-10 w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-[24px] p-8 border border-[#f3efe6]/20 bg-[#0d0b09]/95 text-[#f3efe6] shadow-2xl backdrop-blur-2xl space-y-6 ${
            lang === 'ar' ? 'text-right' : 'text-left'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#f3efe6]/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#f3efe6]/[0.06] border border-[#f3efe6]/15 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#f3efe6]" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#f3efe6]/40 block">
                  {lang === 'ar' ? '[ تمرين التأمل والتدوين ]' : '[ REFLECTIVE JOURNALING ]'}
                </span>
                <h3 className="text-base font-medium text-[#f3efe6] mt-0.5">
                  {lang === 'ar' ? 'تفريغ الأفكار والمشاعر' : 'Thought & Emotion Release'}
                </h3>
              </div>
            </div>

            <button
              onClick={() => { onClose(); if (isSaved) { setIsSaved(false); setQ1(''); setQ2(''); setQ3(''); } }}
              className="p-2 rounded-full bg-[#f3efe6]/[0.05] hover:bg-[#f3efe6]/[0.1] text-[#f3efe6]/60 hover:text-[#f3efe6] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isSaved ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#f3efe6]/10 border border-[#f3efe6]/20 flex items-center justify-center text-[#f3efe6]">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-base font-medium text-[#f3efe6]">
                {lang === 'ar' ? 'كتابتك اتحفظت 🤍' : 'Reflections saved gently 🤍'}
              </h4>
              <p className="text-xs text-[#f3efe6]/50 font-mono">
                {lang === 'ar' ? 'كتابتك وتقييم شعورك اتحفظوا في رحلتك.' : 'Your reflection and mood check-in have been saved.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {context && <blockquote dir="auto" className="border-s-2 border-white/30 ps-3 leading-6 break-words">{context}</blockquote>}
              <label className="block">{lang === 'ar' ? 'حاسس إزاي دلوقتي؟ من 1 (صعب) لـ5 (كويس)' : 'How do you feel now? 1 (difficult) to 5 (good)'}
                <input aria-label={lang === 'ar' ? 'تقييم شعورك' : 'Mood score'} type="range" min="1" max="5" value={mood} onChange={e => setMood(Number(e.target.value))} className="w-full mt-3" />
                <output>{mood}/5</output>
              </label>
              {error && <p role="alert">{error}</p>}
              {/* Question 1 */}
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] text-[#f3efe6]/60 block">
                  {lang === 'ar' ? '1. لما تبص على الكلام اللي شاركته، إيه الإحساس اللي وراه؟' : '1. Looking at what you shared, what feeling is behind it?'}
                </label>
                <textarea
                  value={q1}
                  onChange={e => setQ1(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب براحتك...' : 'Write freely and without judgment...'}
                  rows={2}
                  className="w-full bg-[#f3efe6]/[0.03] border border-[#f3efe6]/15 focus:border-[#f3efe6]/40 rounded-[14px] p-3 text-xs text-[#f3efe6] placeholder-[#f3efe6]/30 outline-none transition-all resize-none font-sans"
                />
              </div>

              {/* Question 2 */}
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] text-[#f3efe6]/60 block">
                  {lang === 'ar' ? '2. إيه اللي كنت محتاجه وقتها؟' : '2. What did you need in that moment?'}
                </label>
                <textarea
                  value={q2}
                  onChange={e => setQ2(e.target.value)}
                  placeholder={lang === 'ar' ? 'موقف لطيف، كوب قهوة، صوت هادئ...' : 'A quiet moment, a warm drink, a kind word...'}
                  rows={2}
                  className="w-full bg-[#f3efe6]/[0.03] border border-[#f3efe6]/15 focus:border-[#f3efe6]/40 rounded-[14px] p-3 text-xs text-[#f3efe6] placeholder-[#f3efe6]/30 outline-none transition-all resize-none font-sans"
                />
              </div>

              {/* Question 3 */}
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] text-[#f3efe6]/60 block">
                  {lang === 'ar' ? '3. إيه خطوة صغيرة تحب تجربها؟' : '3. What small step would you like to try?'}
                </label>
                <input
                  type="text"
                  value={q3}
                  onChange={e => setQ3(e.target.value)}
                  placeholder={lang === 'ar' ? 'هاخدها خطوة خطوة...' : 'One step at a time with patience...'}
                  className="w-full bg-[#f3efe6]/[0.03] border border-[#f3efe6]/15 focus:border-[#f3efe6]/40 rounded-[14px] p-3 text-xs text-[#f3efe6] placeholder-[#f3efe6]/30 outline-none transition-all font-sans"
                />
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-[#f3efe6]/10 flex justify-end gap-3">
                <button
                  onClick={() => { onClose(); if (isSaved) { setIsSaved(false); setQ1(''); setQ2(''); setQ3(''); } }}
                  className="px-4 py-2 rounded-full text-xs font-mono text-[#f3efe6]/60 hover:text-[#f3efe6] transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  disabled={saving || !q1.trim()}
                  onClick={handleSave}
                  className="px-6 py-2 rounded-full bg-[#f3efe6] hover:bg-white text-[#0d0b09] font-medium text-xs tracking-tight transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving
                    ? (lang === 'ar' ? 'بيتحفظ...' : 'Saving...')
                    : (lang === 'ar' ? 'احفظ التمرين' : 'Save exercise')}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
