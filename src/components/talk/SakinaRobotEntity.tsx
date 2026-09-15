import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mic, Volume2 } from 'lucide-react';
import type { VoiceState } from '../../hooks/useVoiceSession';

interface SakinaRobotEntityProps {
  state: VoiceState;
  audioLevel: number;
  statusText: string;
  isActive: boolean;
  onEntityClick?: () => void;
}

export default function SakinaRobotEntity({
  state,
  audioLevel,
  statusText,
  isActive,
  onEntityClick,
}: SakinaRobotEntityProps) {
  // Compute dynamic visualizer ring scale based on real audio level
  const dynamicRingScale = useMemo(() => {
    if (state === 'listening') {
      return 1 + audioLevel * 0.45;
    }
    if (state === 'speaking') {
      return 1.08;
    }
    return 1;
  }, [state, audioLevel]);

  // Compute 24 radial visualizer bars based on audioLevel
  const visualizerBars = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const angle = (i / 28) * 360;
      let height = 4;
      if (state === 'listening') {
        const factor = Math.sin(i * 1.5) * 0.5 + 0.5;
        height = 4 + audioLevel * 28 * (0.4 + factor * 0.6);
      } else if (state === 'speaking') {
        const factor = (Math.sin(i * 2 + Date.now() / 200) + 1) / 2;
        height = 6 + factor * 18;
      } else if (state === 'thinking') {
        height = 4 + Math.sin(i * 0.8) * 4;
      }
      return { angle, height };
    });
  }, [state, audioLevel]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-full max-w-lg mx-auto py-0.5">
      {/* Background Atmospheric Depth & Soft Spotlight */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <div
          className={`w-72 h-72 sm:w-96 sm:h-96 md:w-[460px] md:h-[460px] rounded-full blur-[90px] transition-all duration-1000 ${state === 'listening'
              ? 'bg-cyan-500/10'
              : state === 'thinking'
                ? 'bg-indigo-500/10'
                : state === 'speaking'
                  ? 'bg-white/10'
                  : 'bg-white/[0.03]'
            }`}
        />
      </div>

      {/* Main Interactive Entity Container */}
      <div
        onClick={onEntityClick}
        className="relative flex items-center justify-center cursor-pointer group"
      >
        {/* Outer Circular Audio Visualizer Ring */}
        <motion.div
          animate={{
            scale: dynamicRingScale,
            rotate: state === 'thinking' ? 360 : 0,
          }}
          transition={{
            scale: { type: 'spring', stiffness: 260, damping: 20 },
            rotate: {
              duration: state === 'thinking' ? 8 : 0,
              repeat: state === 'thinking' ? Infinity : 0,
              ease: 'linear',
            },
          }}
          className="absolute w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full border border-white/10 flex items-center justify-center pointer-events-none"
        >
          {/* Radial Audio Visualizer Bars */}
          {visualizerBars.map((bar, idx) => (
            <div
              key={idx}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center"
              style={{
                transform: `rotate(${bar.angle}deg) translateY(-135px)`,
              }}
            >
              <div
                className={`w-[2px] rounded-full transition-all duration-75 ${state === 'listening'
                    ? 'bg-gradient-to-t from-cyan-400 to-white shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                    : state === 'speaking'
                      ? 'bg-gradient-to-t from-white to-white/40 shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                      : state === 'thinking'
                        ? 'bg-indigo-400/50'
                        : 'bg-white/15'
                  }`}
                style={{ height: `${bar.height}px` }}
              />
            </div>
          ))}

          {/* Secondary Concentric Orbital Ring */}
          <div className="absolute inset-4 rounded-full border border-white/5" />
          <div className="absolute inset-8 rounded-full border border-dashed border-white/10 animate-[spin_40s_linear_infinite]" />
        </motion.div>

        {/* Breathing AI Entity / Robot Bust */}
        <motion.div
          animate={{
            scale:
              state === 'idle'
                ? [1, 1.018, 1]
                : state === 'listening'
                  ? [1, 1.03, 1]
                  : state === 'speaking'
                    ? [1, 1.04, 1]
                    : 1,
            rotate: state === 'idle' ? [-0.6, 0.6, -0.6] : [0, 0, 0],
          }}
          transition={{
            duration: state === 'idle' ? 7 : state === 'speaking' ? 0.9 : 1.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full flex items-center justify-center backdrop-blur-2xl transition-all duration-700"
        >
          {/* Cybernetic Entity SVG Illustration / Core Face */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Glowing Core Sphere */}
            <div
              className={`absolute inset-2 rounded-full transition-all duration-700 ${state === 'listening'
                  ? 'bg-gradient-to-b from-neutral-900 via-cyan-950/40 to-black border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)]'
                  : state === 'thinking'
                    ? 'bg-gradient-to-b from-neutral-900 via-indigo-950/40 to-black border border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.25)]'
                    : state === 'speaking'
                      ? 'bg-gradient-to-b from-neutral-900 via-neutral-800 to-black border border-white/40 shadow-[0_0_60px_rgba(255,255,255,0.2)]'
                      : 'bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)]'
                }`}
            />

            {/* Futuristic Cybernetic Visor / Head Sculpture SVG */}
            <svg
              viewBox="0 0 200 200"
              className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 relative z-10 drop-shadow-2xl"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Head Silhouette */}
              <path
                d="M100 25 C62 25 42 55 42 105 C42 145 68 175 100 175 C132 175 158 145 158 105 C158 55 138 25 100 25 Z"
                fill="url(#headGradient)"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.2"
              />

              {/* Side Cybernetic Jaw Plates */}
              <path
                d="M50 95 L65 140 L85 160"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.2"
                strokeDasharray="2 3"
              />
              <path
                d="M150 95 L135 140 L115 160"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.2"
                strokeDasharray="2 3"
              />

              {/* Central Dark Glass Visor */}
              <path
                d="M62 78 Q100 70 138 78 Q140 102 135 110 Q100 120 65 110 Q60 102 62 78 Z"
                fill="url(#visorGradient)"
                stroke={
                  state === 'listening'
                    ? 'rgba(34,211,238,0.7)'
                    : state === 'speaking'
                      ? 'rgba(255,255,255,0.8)'
                      : state === 'thinking'
                        ? 'rgba(165,180,252,0.7)'
                        : 'rgba(255,255,255,0.25)'
                }
                strokeWidth="1.5"
              />

              {/* Intelligent Optical Eye Nodes */}
              {state === 'thinking' ? (
                // Scanning Optical Bar for Thinking
                <motion.line
                  x1="75"
                  y1="94"
                  x2="125"
                  y2="94"
                  stroke="#a5b4fc"
                  strokeWidth="2"
                  animate={{ x1: [75, 95, 75], x2: [105, 125, 105] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  filter="url(#glowFilter)"
                />
              ) : (
                <>
                  {/* Left Optical Node */}
                  <motion.circle
                    cx="84"
                    cy="94"
                    r={state === 'listening' ? 3.5 : state === 'speaking' ? 4 : 2.5}
                    fill={
                      state === 'listening'
                        ? '#22d3ee'
                        : state === 'speaking'
                          ? '#ffffff'
                          : '#ffffff'
                    }
                    opacity={state === 'idle' ? 0.6 : 1}
                    filter="url(#glowFilter)"
                  />
                  {/* Right Optical Node */}
                  <motion.circle
                    cx="116"
                    cy="94"
                    r={state === 'listening' ? 3.5 : state === 'speaking' ? 4 : 2.5}
                    fill={
                      state === 'listening'
                        ? '#22d3ee'
                        : state === 'speaking'
                          ? '#ffffff'
                          : '#ffffff'
                    }
                    opacity={state === 'idle' ? 0.6 : 1}
                    filter="url(#glowFilter)"
                  />
                </>
              )}

              {/* Speech / Vocal Energy Resonator (Mouth Node) */}
              <g transform="translate(100, 138)">
                {state === 'speaking' ? (
                  // Dynamic vocal soundwaves when Sakina speaks
                  <motion.g
                    animate={{ scaleY: [0.6, 1.8, 0.8, 1.5, 0.6] }}
                    transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <line x1="-16" y1="0" x2="-16" y2="4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="-8" y1="-4" x2="-8" y2="4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="0" y1="-8" x2="0" y2="8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" filter="url(#glowFilter)" />
                    <line x1="8" y1="-4" x2="8" y2="4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="16" y1="0" x2="16" y2="4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                  </motion.g>
                ) : (
                  // Minimal geometric vocal slit
                  <line
                    x1="-12"
                    y1="0"
                    x2="12"
                    y2="0"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                )}
              </g>

              {/* Forehead Neural Emblem */}
              <circle
                cx="100"
                cy="54"
                r="3"
                fill={state === 'speaking' || state === 'listening' ? '#ffffff' : 'rgba(255,255,255,0.4)'}
              />
              <line x1="100" y1="46" x2="100" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

              {/* Gradient & Filter Definitions */}
              <defs>
                <linearGradient id="headGradient" x1="100" y1="25" x2="100" y2="175" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1c1c20" />
                  <stop offset="0.6" stopColor="#0d0d10" />
                  <stop offset="1" stopColor="#050507" />
                </linearGradient>
                <linearGradient id="visorGradient" x1="100" y1="70" x2="100" y2="120" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0a0a0f" />
                  <stop offset="1" stopColor="#000000" />
                </linearGradient>
                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
            </svg>

            {/* Hover overlay hint */}
            {!isActive && (
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm z-20">
                <Mic className="w-8 h-8 text-white animate-pulse" />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Status Label below Robot */}
      <div className="mt-4 flex flex-col items-center gap-2 z-10">
        <div className="flex items-center gap-2.5 px-4 py-1 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${state === 'listening'
                ? 'bg-cyan-400 animate-ping shadow-[0_0_10px_rgba(34,211,238,1)]'
                : state === 'thinking'
                  ? 'bg-indigo-400 animate-spin shadow-[0_0_10px_rgba(129,140,248,1)]'
                  : state === 'speaking'
                    ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,1)]'
                    : 'bg-white/40'
              }`}
          />
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/70">
            {statusText}
          </span>
          {state === 'thinking' && (
            <Sparkles className="w-3 h-3 text-indigo-300 animate-spin" />
          )}
          {state === 'speaking' && (
            <Volume2 className="w-3 h-3 text-emerald-300 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
