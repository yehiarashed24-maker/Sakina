import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, MessageSquare, ArrowRight, Send, Check, Hand, Globe, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useVoiceSession } from '../../hooks/useVoiceSession';
import SakinaRobotEntity from './SakinaRobotEntity';

interface SakinaTalkViewProps {
  onSwitchToChat: () => void;
}

export default function SakinaTalkView({ onSwitchToChat }: SakinaTalkViewProps) {
  const { lang, setLang } = useLanguage();
  const [manualText, setManualText] = useState('');

  const {
    state,
    isActive,
    isMuted,
    isSpeakerMuted,
    audioLevel,
    transcript,
    interimTranscript,
    aiResponse,
    statusText,
    callDuration,
    voiceLang,
    setVoiceLang,
    startSession,
    endSession,
    toggleMute,
    toggleSpeaker,
    sendManualPrompt,
    finishSpeakingNow,
    interruptSakina,
  } = useVoiceSession();

  // Format call timer mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleManualSend = () => {
    if (!manualText.trim()) return;
    const txt = manualText.trim();
    setManualText('');
    sendManualPrompt(txt);
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black text-white p-2.5 sm:p-4 md:p-6 flex flex-col select-none">
      {/* Subtle Background Radial Ambient Atmosphere */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neutral-900/35 rounded-full blur-[130px]" />
      </div>

      {/* Main Viewport Frame with Large Rounded Corners */}
      <main className="relative w-full h-full flex-1 rounded-[24px] sm:rounded-[36px] md:rounded-[44px] border border-white/10 bg-black/95 backdrop-blur-3xl flex flex-col justify-between p-5 sm:p-7 md:p-9 overflow-hidden shadow-2xl">
        
        {/* ================= TOP NAVIGATION ================= */}
        <header className="w-full flex items-center justify-between z-30 pb-3 border-b border-white/5 shrink-0">
          {/* Brand Logo / Mark */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full border border-white/20 bg-white/5 flex items-center justify-center p-0.5">
              <img src="/sakina-logo.png" alt="Sakina AI" className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs sm:text-sm tracking-wider uppercase text-white">
                SAKINA AI
              </span>
            </div>
          </div>

          {/* Center/Right Nav Controls: Mode Switch, Voice Language, About, Online */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Direct Mode Switch: CHAT | TALK */}
            <div className="liquid-glass rounded-full p-1 flex items-center border border-white/10">
              <button
                onClick={onSwitchToChat}
                className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-mono uppercase tracking-wider text-white/50 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3 h-3" />
                CHAT
              </button>
              <button
                className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-mono uppercase tracking-wider bg-white text-black font-semibold shadow-sm transition-all"
              >
                TALK
              </button>
            </div>

            {/* Dedicated Voice Language Switcher */}
            <div className="liquid-glass rounded-full p-0.5 flex items-center border border-cyan-500/30">
              <button
                onClick={() => setVoiceLang('ar')}
                className={`px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                  voiceLang === 'ar'
                    ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-400/40 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                    : 'text-white/50 hover:text-white'
                }`}
                title="تحدث بالعربية"
              >
                <span>عربي</span>
              </button>
              <button
                onClick={() => setVoiceLang('en')}
                className={`px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                  voiceLang === 'en'
                    ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-400/40 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                    : 'text-white/50 hover:text-white'
                }`}
                title="Speak in English"
              >
                <span>EN</span>
              </button>
            </div>

            {/* About Link */}
            <Link
              to="/about"
              className="hidden md:inline-block text-[11px] sm:text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors"
            >
              ABOUT
            </Link>

            {/* Online Status Indicator */}
            <div className="flex items-center gap-2 liquid-glass px-3 py-1 sm:py-1.5 rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-[9px] sm:text-[10px] font-mono font-semibold uppercase tracking-widest text-white/70">
                ONLINE
              </span>
            </div>
          </div>
        </header>

        {/* ================= TOP EDITORIAL METADATA GRID ================= */}
        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 z-20 pointer-events-none shrink-0">
          {/* Left Metadata */}
          <div className="flex flex-col">
            <h3 className="text-[11px] uppercase font-mono tracking-widest text-white/90 font-semibold">
              SAKINA AI
            </h3>
            <p className="text-[10px] sm:text-[11px] text-white/45 max-w-xs leading-relaxed font-sans mt-0.5">
              {voiceLang === 'ar'
                ? 'مرافق ذكاء اصطناعي صوتي متقدم ومصمم للاستماع والتفهم والدعم النفسي.'
                : 'An intelligent conversational companion designed to listen, understand and respond.'}
            </p>
          </div>

          {/* Center Metadata */}
          <div className="hidden md:flex flex-col items-center text-center">
            <span className="text-[10px] sm:text-[11px] uppercase font-mono tracking-[0.2em] text-white/50">
              VOICE & INTELLIGENCE // {voiceLang === 'ar' ? 'اللغة العربية' : 'ENGLISH'}
            </span>
          </div>

          {/* Right Metadata: What I Do */}
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-[10px] sm:text-[11px] uppercase font-mono tracking-widest text-white/75 mb-1 font-semibold">
              WHAT I DO
            </span>
            <ul className="text-[10px] font-mono text-white/40 space-y-0.5">
              <li>Real-time conversation</li>
              <li>Natural voice interaction</li>
              <li>Context-aware responses</li>
              <li>Empathetic AI assistance</li>
            </ul>
          </div>
        </section>

        {/* ================= CENTER HERO VISUAL (AI ROBOT) ================= */}
        <section className="flex-1 flex flex-col items-center justify-center relative my-auto py-1 z-20 min-h-0">
          <SakinaRobotEntity
            state={state}
            audioLevel={audioLevel}
            statusText={statusText}
            isActive={isActive}
            onEntityClick={!isActive ? startSession : undefined}
          />

          {/* Dynamic Interactive Action Buttons: Finish Speaking (Send) or Interrupt */}
          {isActive && (
            <div className="mt-2.5 flex items-center gap-3 z-30">
              {/* If listening and user has speech, allow immediate "Done Speaking" submit */}
              {state === 'listening' && (transcript || interimTranscript) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={finishSpeakingNow}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{voiceLang === 'ar' ? 'خلصت كلام (إرسال الآن)' : 'Done Speaking (Send Now)'}</span>
                </motion.button>
              )}

              {/* If Sakina is speaking, allow immediate Interrupt & Speak */}
              {state === 'speaking' && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={interruptSakina}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all cursor-pointer"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>{voiceLang === 'ar' ? 'مقاطعة / أريد التحدث الآن' : 'Interrupt & Speak'}</span>
                </motion.button>
              )}
            </div>
          )}

          {/* Live Subtitle / Dialogue Console Card (User & AI Realtime Dialogue) */}
          <div className="mt-2.5 max-w-xl w-full px-5 py-3.5 rounded-2xl sm:rounded-3xl bg-neutral-950/90 border border-white/15 backdrop-blur-2xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] flex flex-col justify-center min-h-[90px] max-h-[145px] overflow-y-auto transition-all relative">
            {/* Ambient subtle state glow line */}
            <div 
              className={`absolute top-0 left-0 right-0 h-[2px] transition-all duration-500 ${
                state === 'listening' ? 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent' :
                state === 'thinking' ? 'bg-gradient-to-r from-transparent via-indigo-400 to-transparent' :
                state === 'speaking' ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent' :
                'bg-transparent'
              }`} 
            />

            {/* When not active */}
            {!isActive ? (
              <div 
                onClick={startSession}
                className="flex flex-col items-center justify-center text-center cursor-pointer py-1 group"
              >
                <p className="text-white/80 group-hover:text-white text-xs sm:text-sm font-sans transition-colors font-medium">
                  {voiceLang === 'ar' ? 'المكالمة الصوتية جاهزة.. اضغط على الروبوت لبدء الحديث' : 'Voice session ready. Click the robot to begin.'}
                </p>
                <span className="text-[10px] font-mono text-cyan-400/80 mt-0.5">
                  {voiceLang === 'ar' ? '🎙️ اضغط هنا للبدء' : '🎙️ Click here to start'}
                </span>
              </div>
            ) : (
              <>
                {/* 1. If user is currently speaking (interim or new speech while listening) */}
                {state === 'listening' && (interimTranscript || (!aiResponse && transcript)) ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <span className="text-[10px] sm:text-[11px] font-mono tracking-wider text-cyan-400 flex items-center gap-1.5 font-semibold">
                        <Mic className="w-3 h-3 text-cyan-400 animate-pulse" />
                        {voiceLang === 'ar' ? 'أنت تتحدث الآن:' : 'You are speaking:'}
                      </span>
                      <span className="text-[9px] font-mono text-cyan-300/60">
                        {voiceLang === 'ar' ? 'استماع نشط' : 'Listening...'}
                      </span>
                    </div>
                    <p className="text-white text-xs sm:text-sm font-sans leading-relaxed text-center sm:text-start" dir={voiceLang === 'ar' ? 'rtl' : 'ltr'}>
                      "{interimTranscript || transcript}"
                    </p>
                  </div>
                ) : state === 'thinking' ? (
                  /* 2. When AI is thinking */
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <span className="text-[10px] sm:text-[11px] font-mono tracking-wider text-indigo-400 flex items-center gap-1.5 font-semibold">
                        <Sparkles className="w-3 h-3 text-indigo-400 animate-spin" />
                        {voiceLang === 'ar' ? 'أنت سألت:' : 'You asked:'}
                      </span>
                      <span className="text-[9px] font-mono text-indigo-300/80 animate-pulse">
                        {voiceLang === 'ar' ? 'سكينة تفكر في الرد...' : 'Thinking...'}
                      </span>
                    </div>
                    <p className="text-white/80 text-xs sm:text-sm font-sans italic leading-relaxed text-center sm:text-start" dir={voiceLang === 'ar' ? 'rtl' : 'ltr'}>
                      "{transcript}"
                    </p>
                  </div>
                ) : aiResponse ? (
                  /* 3. When AI has answered (either actively speaking or finished speaking) */
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <span className="text-[10px] sm:text-[11px] font-mono tracking-wider text-emerald-400 flex items-center gap-1.5 font-semibold">
                        <Volume2 className={`w-3.5 h-3.5 text-emerald-400 ${state === 'speaking' ? 'animate-pulse' : ''}`} />
                        {voiceLang === 'ar' ? 'سكينة (Sakina):' : 'Sakina:'}
                      </span>
                      <span className="text-[9px] font-mono text-white/40">
                        {state === 'speaking' ? (voiceLang === 'ar' ? 'تتحدث الآن...' : 'Speaking now...') : (voiceLang === 'ar' ? 'أنا أستمع إليك..' : 'Listening to you..')}
                      </span>
                    </div>
                    <p className="text-white/95 text-xs sm:text-sm md:text-[15px] font-sans leading-relaxed text-center sm:text-start" dir={/[\u0600-\u06FF]/.test(aiResponse) ? 'rtl' : 'ltr'}>
                      {aiResponse.split(/📚|\*\*المراجع\*\*|\bالمراجع\b|\bReferences\b/i)[0].trim()}
                    </p>
                  </div>
                ) : (
                  /* 4. Active listening but nothing spoken yet */
                  <div className="flex flex-col items-center justify-center text-center py-1">
                    <p className="text-white/80 text-xs sm:text-sm font-sans font-medium">
                      {voiceLang === 'ar' ? 'أنا أستمع إليك.. تفضل بالتحدث في أي وقت 🎙️' : 'I am listening.. feel free to speak anytime 🎙️'}
                    </p>
                    <span className="text-[10px] font-mono text-cyan-400/60 mt-0.5">
                      {voiceLang === 'ar' ? 'تحدث بشكل طبيعي وسكينة سترد عليك فوراً' : 'Speak naturally, Sakina will reply automatically'}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pre-call Inviting Suggestions when Idle */}
          {!isActive && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 max-w-md">
              {[
                voiceLang === 'ar' ? 'أشعر بضغط نفسي اليوم' : 'I feel overwhelmed today',
                voiceLang === 'ar' ? 'كيف يمكنك مساعدتي؟' : 'How can you help me relax?',
                voiceLang === 'ar' ? 'أحتاج تمرين تنفس' : 'Guide me through breathing',
              ].map((hint, i) => (
                <button
                  key={i}
                  onClick={async () => {
                    await startSession();
                    setTimeout(() => sendManualPrompt(hint), 800);
                  }}
                  className="text-[10px] font-mono text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-0.5 rounded-full transition-all cursor-pointer"
                >
                  "{hint}"
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ================= BOTTOM BAR: HEADLINE & INTERACTION CONTROLS ================= */}
        <footer className="w-full flex flex-col sm:flex-row items-end justify-between gap-4 pt-2 z-30 shrink-0">
          {/* Bottom-Left Editorial Headline */}
          <div className="flex flex-col text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-light uppercase tracking-tight text-white/90 leading-[1.08]">
              I'M HERE <br />
              TO{' '}
              <span className="font-mono tracking-widest text-lg sm:text-2xl md:text-3xl text-white px-2 py-0.5 rounded bg-white/10 border border-white/20">
                LISTEN
              </span>{' '}
              <br />
              UNDERSTAND <br />
              AND{' '}
              <span className="font-mono tracking-widest text-lg sm:text-2xl md:text-3xl text-white px-2 py-0.5 rounded bg-white/10 border border-white/20">
                RESPOND
              </span>
            </h2>
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] mt-1.5">
              SAKINA AI // VOICE EXPERIENCE
            </p>
          </div>

          {/* Bottom-Right Voice Controls */}
          <div className="flex flex-col items-end gap-2.5 w-full sm:w-auto">
            {!isActive ? (
              /* Pre-call: Start Talk Button */
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={startSession}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
              >
                <Mic className="w-4 h-4 text-black" />
                <span className="tracking-wider uppercase font-mono">
                  {voiceLang === 'ar' ? 'تحدث مع سكينة' : 'TALK TO SAKINA'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </motion.button>
            ) : (
              /* In-Call Active Controls */
              <div className="flex flex-col items-end gap-2.5 w-full sm:w-auto">
                {/* Manual Text Fallback bar during call */}
                <div className="w-full sm:w-72 liquid-glass rounded-full px-3 py-1 flex items-center gap-2 border border-white/10">
                  <input
                    type="text"
                    placeholder={voiceLang === 'ar' ? 'أو اكتب هنا لتنطق سكينة...' : 'Or type text here...'}
                    className="flex-1 bg-transparent border-none outline-none text-white text-xs px-1 placeholder:text-white/40 font-sans"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSend()}
                  />
                  <button
                    onClick={handleManualSend}
                    className="bg-white rounded-full p-1 text-black hover:bg-white/90 transition-all cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>

                {/* Control Action Pills */}
                <div className="flex items-center gap-2.5 liquid-glass p-1.5 px-3 rounded-full border border-white/10 backdrop-blur-3xl shadow-2xl">
                  {/* Interrupt button shortcut inside bottom controls if speaking */}
                  {state === 'speaking' && (
                    <button
                      onClick={interruptSakina}
                      className="px-2.5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-semibold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                      title={voiceLang === 'ar' ? 'مقاطعة سكينة' : 'Interrupt'}
                    >
                      <Hand className="w-3 h-3" />
                      <span>{voiceLang === 'ar' ? 'مقاطعة' : 'Cut In'}</span>
                    </button>
                  )}

                  {/* Finish speaking shortcut inside bottom controls if listening */}
                  {state === 'listening' && (transcript || interimTranscript) && (
                    <button
                      onClick={finishSpeakingNow}
                      className="px-2.5 py-1.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                      title={voiceLang === 'ar' ? 'إرسال كلامي' : 'Send speech'}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>{voiceLang === 'ar' ? 'إرسال' : 'Send'}</span>
                    </button>
                  )}

                  {/* Call Duration */}
                  <span className="text-xs font-mono text-white/60 mr-1">
                    {formatTime(callDuration)}
                  </span>

                  {/* Mute Mic */}
                  <button
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    className={`p-2.5 rounded-full transition-all cursor-pointer ${
                      isMuted
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  {/* Speaker Output Toggle */}
                  <button
                    onClick={toggleSpeaker}
                    aria-label={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
                    className={`p-2.5 rounded-full transition-all cursor-pointer ${
                      isSpeakerMuted
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    {isSpeakerMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  {/* End Talk Call */}
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={endSession}
                    aria-label="End Call"
                    className="p-2.5 px-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(220,38,38,0.7)] transition-all cursor-pointer"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>END</span>
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}
