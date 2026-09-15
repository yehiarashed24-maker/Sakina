import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Hand, Volume2, Sparkles, Check } from 'lucide-react';

interface GroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  lang?: 'en' | 'ar';
}

export default function GroundingExerciseModal({
  isOpen,
  onClose,
  onComplete,
  lang = 'ar'
}: GroundingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      num: '5',
      icon: <Eye className="w-6 h-6 text-[#f3efe6]" />,
      title_ar: '5 حاجات شايفها دلوقتي',
      desc_ar: 'بص حواليك براحتك ولاحظ خمس حاجات: لون الحيطة، نور الشمس، شاشة، زرعة، أو انعكاس نور.',
      title_en: '5 Things you can see',
      desc_en: 'Look around slowly. Notice 5 distinct things you see: a patch of light, a color, an object, a shadow, or a texture.'
    },
    {
      num: '4',
      icon: <Hand className="w-6 h-6 text-[#f3efe6]" />,
      title_ar: '4 حاجات تقدر تلمسها',
      desc_ar: 'جرّب تلمس أربع حاجات حواليك ولاحظ ملمسها، زي هدومك أو الترابيزة أو الموبايل أو رجلك على الأرض.',
      title_en: '4 Things you can touch',
      desc_en: 'Physically feel 4 things around you: the fabric of your clothes, the surface of a desk, cool air on skin, or feet grounded on floor.'
    },
    {
      num: '3',
      icon: <Volume2 className="w-6 h-6 text-[#f3efe6]" />,
      title_ar: '3 أصوات سامعها حواليك',
      desc_ar: 'خد وقتك واسمع تلات أصوات حواليك، زي المروحة أو نفسك أو حركة بره أو الساعة.',
      title_en: '3 Things you can hear',
      desc_en: 'Listen closely for 3 sounds: a distant murmur, a gentle breeze, your breath, or ambient room acoustics.'
    },
    {
      num: '2',
      icon: <Sparkles className="w-6 h-6 text-[#f3efe6]" />,
      title_ar: 'ريحتين تقدر تلاحظهم',
      desc_ar: 'لاحظ ريحة المكان، زي القهوة أو الهوا. لو مش ملاحظ ريحة، عادي تعدّي الخطوة دي.',
      title_en: '2 Things you can smell',
      desc_en: 'Inhale deeply and detect 2 scents: fresh air, a warm beverage, soap, or clean room ambiance.'
    },
    {
      num: '1',
      icon: <Check className="w-6 h-6 text-[#f3efe6]" />,
      title_ar: 'حاجة واحدة بتحبها في نفسك',
      desc_ar: 'فكّر في حاجة بتقدّرها في نفسك، حتى لو بس إنك خدت وقت لنفسك النهارده.',
      title_en: '1 Positive affirmation for yourself',
      desc_en: 'Acknowledge your strength: you are here, present, and giving yourself this moment of calm. You are safe.'
    }
  ];

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
      onClose();
      setCurrentStep(0);
    } else {
      setCurrentStep(prev => prev + 1);
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

        {/* Modal */}
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
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#f3efe6]/40 block">
                {lang === 'ar' ? '[ تمرين التركيز بالحواس 5-4-3-2-1 ]' : '[ 5-4-3-2-1 GROUNDING TECHNIQUE ]'}
              </span>
              <h3 className="text-base font-medium text-[#f3efe6] mt-0.5">
                {lang === 'ar' ? 'خد وقتك وركّز في اللي حواليك' : 'Restore Presence & Calm'}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#f3efe6]/[0.05] hover:bg-[#f3efe6]/[0.1] text-[#f3efe6]/60 hover:text-[#f3efe6] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Display */}
          <div className="py-6 space-y-5 text-center flex flex-col items-center">
            {/* Step Number Badge */}
            <div className="w-16 h-16 rounded-full bg-[#f3efe6]/[0.06] border border-[#f3efe6]/20 flex items-center justify-center text-2xl font-mono font-semibold text-[#f3efe6]">
              {step.num}
            </div>

            <h4 className="text-lg font-medium text-[#f3efe6]">
              {lang === 'ar' ? step.title_ar : step.title_en}
            </h4>

            <p className="text-xs text-[#f3efe6]/70 leading-relaxed max-w-sm font-sans">
              {lang === 'ar' ? step.desc_ar : step.desc_en}
            </p>

            {/* Step Dots Indicator */}
            <div className="flex items-center gap-2 pt-3">
              {steps.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentStep ? 'bg-[#f3efe6] w-6' : 'bg-[#f3efe6]/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="pt-4 border-t border-[#f3efe6]/10 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="px-4 py-2 rounded-full text-xs font-mono text-[#f3efe6]/60 hover:text-[#f3efe6] transition-all cursor-pointer disabled:opacity-20"
            >
              {lang === 'ar' ? 'السابق' : 'Previous'}
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-full bg-[#f3efe6] hover:bg-white text-[#0d0b09] font-medium text-xs tracking-tight transition-all cursor-pointer"
            >
              {isLast
                ? (lang === 'ar' ? 'إنهاء التمرين 🤍' : 'Finish Exercise 🤍')
                : (lang === 'ar' ? 'الخطوة التالية &larr;' : 'Next Step &rarr;')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
