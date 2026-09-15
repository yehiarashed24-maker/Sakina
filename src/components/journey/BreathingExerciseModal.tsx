import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wind, CheckCircle2 } from 'lucide-react';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  lang?: 'en' | 'ar';
}

type BreathPhase = 'inhale' | 'hold' | 'exhale';

export default function BreathingExerciseModal({
  isOpen,
  onClose,
  onComplete,
  lang = 'ar'
}: BreathingModalProps) {
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [countdown, setCountdown] = useState(4);
  const [cycle, setCycle] = useState(1);
  const totalCycles = 4;

  useEffect(() => {
    if (!isOpen) {
      setPhase('inhale');
      setCountdown(4);
      setCycle(1);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) return prev - 1;

        // Transition phases
        if (phase === 'inhale') {
          setPhase('hold');
          return 7;
        } else if (phase === 'hold') {
          setPhase('exhale');
          return 8;
        } else {
          // exhale finished
          if (cycle < totalCycles) {
            setCycle((c) => c + 1);
            setPhase('inhale');
            return 4;
          } else {
            // Completed all cycles
            if (onComplete) onComplete();
            return 0;
          }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, phase, cycle, onComplete]);

  if (!isOpen) return null;

  const getPhaseText = () => {
    if (lang === 'ar') {
      if (phase === 'inhale') return 'خد نفس براحتك...';
      if (phase === 'hold') return 'استنى شوية لو مرتاح...';
      return 'طلّع النفس براحة...';
    } else {
      if (phase === 'inhale') return 'Inhale deeply...';
      if (phase === 'hold') return 'Hold gently...';
      return 'Exhale slowly...';
    }
  };

  const getScale = () => {
    if (phase === 'inhale') return 1.4;
    if (phase === 'hold') return 1.4;
    return 0.9;
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
          className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative z-10 w-full max-w-md liquid-glass rounded-3xl p-8 border border-white/15 bg-neutral-950/95 text-white shadow-2xl backdrop-blur-3xl text-center space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-cyan-400">
              <Wind className="w-5 h-5" />
              <span className="text-sm font-mono uppercase tracking-wider font-bold">
                {lang === 'ar' ? 'تمرين التنفس 4-7-8' : '4-7-8 Breathing'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Breathing Visual Entity */}
          <div className="py-10 flex flex-col items-center justify-center relative">
            {/* Outer Glow Halo */}
            <motion.div
              animate={{
                scale: getScale(),
                opacity: phase === 'hold' ? 0.9 : 0.6
              }}
              transition={{
                duration: phase === 'inhale' ? 4 : phase === 'hold' ? 1 : 8,
                ease: 'easeInOut'
              }}
              className={`w-48 h-48 rounded-full blur-2xl absolute pointer-events-none ${
                phase === 'inhale'
                  ? 'bg-cyan-500/30'
                  : phase === 'hold'
                  ? 'bg-indigo-500/30'
                  : 'bg-emerald-500/30'
              }`}
            />

            {/* Main Interactive Orb */}
            <motion.div
              animate={{
                scale: getScale()
              }}
              transition={{
                duration: phase === 'inhale' ? 4 : phase === 'hold' ? 1 : 8,
                ease: 'easeInOut'
              }}
              className={`w-36 h-36 rounded-full border border-white/20 flex flex-col items-center justify-center relative shadow-2xl transition-colors duration-1000 ${
                phase === 'inhale'
                  ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/30 shadow-[0_0_40px_rgba(6,182,212,0.4)]'
                  : phase === 'hold'
                  ? 'bg-gradient-to-br from-indigo-500/20 to-purple-600/30 shadow-[0_0_40px_rgba(99,102,241,0.4)]'
                  : 'bg-gradient-to-br from-emerald-500/20 to-teal-600/30 shadow-[0_0_40px_rgba(16,185,129,0.4)]'
              }`}
            >
              <span className="text-4xl font-mono font-bold tracking-tight text-white drop-shadow">
                {countdown}
              </span>
              <span className="text-[11px] font-mono text-white/60 uppercase tracking-widest mt-1">
                {lang === 'ar' ? 'ثواني' : 'seconds'}
              </span>
            </motion.div>
          </div>

          {/* Phase Guidance Text */}
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white font-sans">{getPhaseText()}</h3>
            <p className="text-xs font-mono text-white/50">
              {lang === 'ar'
                ? `الدورة ${cycle} من ${totalCycles} • ريّح كتافك وخد وقتك`
                : `Cycle ${cycle} of ${totalCycles} • Relax your shoulders`}
            </p>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-white/10 flex justify-center">
            <button
              onClick={() => {
                if (onComplete) onComplete();
                onClose();
              }}
              className="px-6 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إنهاء التمرين' : 'Finish & Complete'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
