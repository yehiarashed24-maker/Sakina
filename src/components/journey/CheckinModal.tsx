import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { createCheckin } from '../../services/journeyService';
import type { CheckinItem } from '../../services/journeyService';

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: CheckinItem) => void;
  lang?: 'en' | 'ar';
}

export default function CheckinModal({
  isOpen,
  onClose,
  onSuccess,
  lang = 'ar'
}: CheckinModalProps) {
  const [selectedScore, setSelectedScore] = useState<number>(3);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const moodLevels = [
    { score: 1, label_ar: 'صعب أوي', label_en: 'Very Difficult' },
    { score: 2, label_ar: 'صعب', label_en: 'Difficult' },
    { score: 3, label_ar: 'ماشي الحال', label_en: 'Okay' },
    { score: 4, label_ar: 'جيد', label_en: 'Good' },
    { score: 5, label_ar: 'ممتاز', label_en: 'Very Good' }
  ];

  const factorsList = [
    { id: 'Work', label_ar: 'العمل', label_en: 'Work' },
    { id: 'Study', label_ar: 'الدراسة', label_en: 'Study' },
    { id: 'Relationships', label_ar: 'العلاقات', label_en: 'Relationships' },
    { id: 'Sleep', label_ar: 'النوم', label_en: 'Sleep' },
    { id: 'Stress', label_ar: 'الضغط والتوتر', label_en: 'Stress' },
    { id: 'Health', label_ar: 'الصحة العامة', label_en: 'Health' },
    { id: 'Family', label_ar: 'أهلي', label_en: 'Family' },
    { id: 'Other', label_ar: 'حاجات تانية', label_en: 'Other' }
  ];

  const toggleFactor = (fId: string) => {
    setSelectedFactors(prev =>
      prev.includes(fId) ? prev.filter(x => x !== fId) : [...prev, fId]
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await createCheckin({
        mood_score: selectedScore,
        factors: selectedFactors,
        note: note.trim()
      });
      onSuccess(res);
      onClose();
    } catch (err) {
      console.error('Failed to create check-in:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0d0b09]/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          className={`relative z-10 w-full max-w-lg rounded-[24px] p-8 border border-[#f3efe6]/20 bg-[#0d0b09]/95 text-[#f3efe6] shadow-2xl backdrop-blur-2xl space-y-6 ${
            lang === 'ar' ? 'text-right' : 'text-left'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#f3efe6]/10">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#f3efe6]/40 block">
                [ VOLUNTARY CHECK-IN ]
              </span>
              <h3 className="text-lg font-medium text-[#f3efe6] mt-0.5">
                {lang === 'ar' ? 'سجّل إحساسك النهارده' : 'Daily Wellbeing Check-in'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#f3efe6]/[0.05] hover:bg-[#f3efe6]/[0.1] text-[#f3efe6]/60 hover:text-[#f3efe6] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Question 1: How are you feeling right now? */}
          <div className="space-y-3">
            <label className="text-xs font-mono uppercase tracking-widest text-[#f3efe6]/50 block">
              {lang === 'ar' ? '1. حاسس إزاي دلوقتي؟' : '1. How are you feeling right now?'}
            </label>

            <div className="grid grid-cols-5 gap-2">
              {moodLevels.map(m => {
                const isSelected = selectedScore === m.score;
                return (
                  <button
                    key={m.score}
                    type="button"
                    onClick={() => setSelectedScore(m.score)}
                    className={`py-3.5 px-2 rounded-[16px] border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-[#f3efe6] text-[#0d0b09] border-[#f3efe6] shadow-lg font-medium'
                        : 'border-[#f3efe6]/15 bg-[#f3efe6]/[0.03] text-[#f3efe6]/60 hover:border-[#f3efe6]/30 hover:text-[#f3efe6]'
                    }`}
                  >
                    <span className="text-sm font-mono font-medium">{m.score}</span>
                    <span className="text-[10px] font-sans truncate text-center leading-tight">
                      {lang === 'ar' ? m.label_ar : m.label_en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 2: What is affecting you most today? */}
          <div className="space-y-3">
            <label className="text-xs font-mono uppercase tracking-widest text-[#f3efe6]/50 block">
              {lang === 'ar' ? '2. إيه اللي شاغل بالك النهارده؟' : '2. What is affecting you most today?'}
            </label>

            <div className="flex flex-wrap gap-2">
              {factorsList.map(f => {
                const isSelected = selectedFactors.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFactor(f.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#f3efe6]/20 text-[#f3efe6] border-[#f3efe6]/40'
                        : 'bg-[#f3efe6]/[0.04] text-[#f3efe6]/60 border-[#f3efe6]/15 hover:border-[#f3efe6]/30 hover:text-[#f3efe6]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-[#f3efe6]" />}
                    <span>{lang === 'ar' ? f.label_ar : f.label_en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-[#f3efe6]/50 block">
              {lang === 'ar' ? 'ملاحظة شخصية (اختيارية):' : 'Personal note (optional):'}
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={lang === 'ar' ? 'احكي سطرين عن يومك...' : 'A few words about your day...'}
              rows={2}
              className="w-full bg-[#f3efe6]/[0.03] border border-[#f3efe6]/15 focus:border-[#f3efe6]/40 rounded-[14px] p-3 text-xs text-[#f3efe6] placeholder-[#f3efe6]/30 outline-none transition-all resize-none font-sans"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-[#f3efe6]/10 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-mono text-[#f3efe6]/60 hover:text-[#f3efe6] transition-all cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 rounded-full bg-[#f3efe6] hover:bg-white text-[#0d0b09] font-medium text-xs tracking-tight transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-[#0d0b09] border-t-transparent inline-block" />
              ) : (
                <span>{lang === 'ar' ? 'احفظ إحساسي' : 'Save Check-in'}</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
