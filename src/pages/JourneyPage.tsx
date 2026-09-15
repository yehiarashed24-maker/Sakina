import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Heart, Sparkles, Wind, BookOpen, Eye, Target, Calendar, CheckCircle2, Activity, ArrowUpRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fetchJourneyOverview, fetchJourneyTimeline, fetchRecurringThemes } from '../services/journeyService';
import type { JourneyOverview, TimelineSession, ThemeItem } from '../services/journeyService';
import CheckinModal from '../components/journey/CheckinModal';
import BreathingExerciseModal from '../components/journey/BreathingExerciseModal';
import SessionDetailModal from '../components/journey/SessionDetailModal';
import JournalingModal from '../components/journey/JournalingModal';
import GroundingExerciseModal from '../components/journey/GroundingExerciseModal';

export default function JourneyPage() {
  const { lang, setLang } = useLanguage();
  const isAr = lang === 'ar';

  const [overview, setOverview] = useState<JourneyOverview | null>(null);
  const [timeline, setTimeline] = useState<TimelineSession[]>([]);
  const [themes, setThemes] = useState<ThemeItem[]>([]);

  // Modals
  const [selectedSession, setSelectedSession] = useState<TimelineSession | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [isJournalingOpen, setIsJournalingOpen] = useState(false);
  const [isGroundingOpen, setIsGroundingOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.6;
    }
  }, []);

  useEffect(() => {
    fetchJourneyOverview().then(setOverview).catch(console.error);
    fetchJourneyTimeline().then(setTimeline).catch(console.error);
    fetchRecurringThemes().then(setThemes).catch(console.error);
  }, []);

  const openSessionDetail = (session: TimelineSession) => {
    setSelectedSession(session);
    setIsSessionModalOpen(true);
  };

  // Derive condition based on themes or safety level
  const safetyLevel = overview?.safety_status?.level || 'NORMAL';
  let conditionTitle = isAr ? 'توتر وضغط يومي' : 'Daily Stress';
  let conditionDesc = isAr ? 'بتمر بفترة فيها ضغط شوية، محتاج تفصل وتهتم بنفسك.' : 'You are experiencing some pressure. Need to disconnect and care for yourself.';
  
  if (safetyLevel === 'CRISIS' || safetyLevel === 'ELEVATED') {
    conditionTitle = isAr ? 'إرهاق نفسي حاد وقلق' : 'Acute Emotional Exhaustion';
    conditionDesc = isAr ? 'الفترة دي صعبة ومريت بضغط كبير. إحنا هنا عشان نعدي المرحلة دي سوا بالتدريج.' : 'This is a difficult period with heavy pressure. We are here to get through this together gradually.';
  } else if (themes.some(t => t.theme.includes('قلق') || t.theme.includes('خوف'))) {
    conditionTitle = isAr ? 'قلق وتفكير مفرط' : 'Anxiety and Overthinking';
    conditionDesc = isAr ? 'أفكارك بتجري بسرعة ومسببة لك قلق. محتاجين نهدي السرعة دي ونرجع للحاضر.' : 'Your thoughts are racing. We need to slow down and return to the present.';
  } else if (themes.some(t => t.theme.includes('حزن') || t.theme.includes('اكتئاب'))) {
    conditionTitle = isAr ? 'إحباط وحزن عميق' : 'Depression and Deep Sadness';
    conditionDesc = isAr ? 'حاسس بثقل وإحباط. طبيعي تحس بكده، وهنمشي خطوات صغيرة عشان نستعيد طاقتك.' : 'Feeling heavy and frustrated. It is natural, we will take small steps to recover your energy.';
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className={`min-h-screen text-white ${isAr ? 'font-arabic' : 'font-sans'} overflow-x-hidden selection:bg-cyan-500/30`} style={{ backgroundColor: 'transparent' }}>
      {/* ================= 1. CINEMATIC BACKGROUND VIDEO ================= */}
      <video
        ref={videoRef}
        src="https://zxdefgavgwfxastwmmjm.supabase.co/storage/v1/object/public/assets/prisma.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          pointerEvents: 'none',
          backgroundColor: '#0d0b09'
        }}
      />

      {/* ================= 2. DUAL LEGIBILITY LAYERS ================= */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(13, 11, 9, 0.05) 25%, rgba(13, 11, 9, 0.55) 100%), linear-gradient(to bottom, rgba(13, 11, 9, 0.7) 0%, rgba(13, 11, 9, 0.2) 30%, rgba(13, 11, 9, 0.25) 70%, rgba(13, 11, 9, 0.85) 100%)'
        }}
      />
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          boxShadow: 'inset 0 0 220px 70px #0d0b09'
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8 lg:gap-12 pb-24">
        
        {/* HEADER */}
        <header className="flex items-center justify-between">
          <Link to="/chat" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
            <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            <span className="text-sm font-medium">{isAr ? 'شات سكينة' : 'Sakina Chat'}</span>
          </Link>
          <div className="flex gap-2 bg-white/5 p-1 rounded-full border border-white/10">
            <button onClick={() => setLang('ar')} className={`px-4 py-1 text-xs rounded-full transition-all ${isAr ? 'bg-cyan-500 text-black font-semibold' : 'text-white/60 hover:text-white'}`}>عربي</button>
            <button onClick={() => setLang('en')} className={`px-4 py-1 text-xs rounded-full transition-all ${!isAr ? 'bg-cyan-500 text-black font-semibold' : 'text-white/60 hover:text-white'}`}>English</button>
          </div>
        </header>

        {/* HERO / CONDITION PROFILE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col justify-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light mb-4">
              {isAr ? 'رحلتك للتعافي' : 'Your Journey'}
            </h1>
            <p className="text-white/60 text-lg max-w-2xl leading-relaxed">
              {isAr ? 'هنا بنجمع كل تفاصيل جلساتك عشان نفهمك أحسن، ونوفر لك خطة تدريبات وتمارين مخصصة تساعدك تتخطى المرحلة دي بسلام.' : 'A structured roadmap built from your sessions to guide your emotional recovery through personalized exercises.'}
            </p>
          </div>
          <div className="lg:col-span-4 p-6 rounded-3xl bg-gradient-to-br from-cyan-900/30 to-indigo-900/30 border border-cyan-500/20 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                {isAr ? 'حالتك الحالية' : 'Current State'}
              </h3>
            </div>
            <h2 className="text-2xl sm:text-3xl font-medium text-white mb-2">{conditionTitle}</h2>
            <p className="text-white/70 text-sm leading-relaxed">{conditionDesc}</p>
          </div>
        </section>

        {/* ROADMAP & EXERCISES */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-12 mt-4">
          
          {/* THE 3 STAGES OF RECOVERY */}
          <section className="xl:col-span-1 flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Target className="w-6 h-6 text-indigo-400" />
              <h2 className="text-xl sm:text-2xl font-medium">{isAr ? 'مراحل التعافي' : 'Recovery Roadmap'}</h2>
            </div>
            
            <div className="flex flex-col gap-4 relative">
              <div className="absolute top-6 bottom-6 left-5 border-l-2 border-white/10" style={isAr ? { left: 'auto', right: '1.25rem' } : {}} />
              
              {/* Stage 1 */}
              <div className="flex gap-4 relative">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center shrink-0 z-10">
                  <span className="text-cyan-400 font-bold">1</span>
                </div>
                <div className="pt-2 pb-4">
                  <h3 className="text-lg font-medium text-white mb-1">{isAr ? 'التهدئة والوعي بالمشاعر' : 'Stabilization & Awareness'}</h3>
                  <p className="text-sm text-white/50">{isAr ? 'إيقاف نوبات القلق والتعرف على المشاعر بدون حكم عليها.' : 'Stopping panic cycles and observing emotions without judgment.'}</p>
                </div>
              </div>

              {/* Stage 2 */}
              <div className="flex gap-4 relative">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border-2 border-indigo-500/40 flex items-center justify-center shrink-0 z-10">
                  <span className="text-indigo-400/80 font-bold">2</span>
                </div>
                <div className="pt-2 pb-4">
                  <h3 className="text-lg font-medium text-white/80 mb-1">{isAr ? 'تفكيك الأفكار السلبية' : 'Cognitive Reframing'}</h3>
                  <p className="text-sm text-white/40">{isAr ? 'تحديد الأفكار الكارثية واستبدالها بنظرة أكثر واقعية.' : 'Identifying catastrophic thoughts and replacing them.'}</p>
                </div>
              </div>

              {/* Stage 3 */}
              <div className="flex gap-4 relative">
                <div className="w-10 h-10 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center shrink-0 z-10">
                  <span className="text-white/40 font-bold">3</span>
                </div>
                <div className="pt-2 pb-4">
                  <h3 className="text-lg font-medium text-white/60 mb-1">{isAr ? 'المرونة النفسية والتعافي' : 'Resilience & Renewal'}</h3>
                  <p className="text-sm text-white/40">{isAr ? 'بناء عادات يومية داعمة تمنع الانتكاسة وتزيد التوازن.' : 'Building daily habits to prevent relapse and increase balance.'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* THERAPEUTIC TOOLKIT */}
          <section className="xl:col-span-2 flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Heart className="w-6 h-6 text-rose-400" />
              <h2 className="text-xl sm:text-2xl font-medium">{isAr ? 'التمارين العلاجية العملية' : 'Therapeutic Toolkit'}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => setIsBreathingOpen(true)}
                className="group flex flex-col items-start p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all text-start"
              >
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Wind className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{isAr ? 'تمرين التنفس 4-7-8' : '4-7-8 Breathing'}</h3>
                <p className="text-sm text-white/60 mb-4">{isAr ? 'فعّال جداً في حالات التوتر العالي ونوبات الهلع لتهدئة ضربات القلب.' : 'Highly effective for high stress and panic attacks to calm heart rate.'}</p>
                <span className="text-xs font-medium text-cyan-400 mt-auto flex items-center gap-1">
                  {isAr ? 'ابدأ التمرين' : 'Start Exercise'} <ArrowUpRight className="w-3 h-3" />
                </span>
              </button>

              <button 
                onClick={() => setIsGroundingOpen(true)}
                className="group flex flex-col items-start p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 transition-all text-start"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{isAr ? 'تمرين التأريض 5-4-3-2-1' : 'Grounding 5-4-3-2-1'}</h3>
                <p className="text-sm text-white/60 mb-4">{isAr ? 'بيساعدك تفصل عن زحمة الأفكار وترجع للحاضر والواقع بالتدريج.' : 'Helps you disconnect from racing thoughts and return to the present.'}</p>
                <span className="text-xs font-medium text-indigo-400 mt-auto flex items-center gap-1">
                  {isAr ? 'ابدأ التمرين' : 'Start Exercise'} <ArrowUpRight className="w-3 h-3" />
                </span>
              </button>

              <button 
                onClick={() => setIsJournalingOpen(true)}
                className="group flex flex-col items-start p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-rose-500/30 transition-all text-start"
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{isAr ? 'تفريغ المشاعر' : 'Therapeutic Journaling'}</h3>
                <p className="text-sm text-white/60 mb-4">{isAr ? 'مساحة حرة تكتب فيها كل اللي حاسس بيه عشان يخف الضغط من دماغك.' : 'A free space to write everything you feel to relieve mental pressure.'}</p>
                <span className="text-xs font-medium text-rose-400 mt-auto flex items-center gap-1">
                  {isAr ? 'افتح الدفتر' : 'Open Journal'} <ArrowUpRight className="w-3 h-3" />
                </span>
              </button>

              <button 
                onClick={() => setIsCheckinOpen(true)}
                className="group flex flex-col items-start p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all text-start"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{isAr ? 'مقياس المزاج اليومي' : 'Daily Mood Check-in'}</h3>
                <p className="text-sm text-white/60 mb-4">{isAr ? 'سجل حالتك النهارده عشان نتابع مستوى تحسنك على مدار الرحلة.' : 'Log your state today so we can track your improvement over the journey.'}</p>
                <span className="text-xs font-medium text-emerald-400 mt-auto flex items-center gap-1">
                  {isAr ? 'سجل حالتك' : 'Log Mood'} <ArrowUpRight className="w-3 h-3" />
                </span>
              </button>
            </div>
          </section>
        </div>

        {/* SESSION TIMELINE (DAY-BY-DAY JOURNEY) */}
        <section className="mt-8 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-cyan-400" />
              <div>
                <h2 className="text-xl sm:text-2xl font-medium">{isAr ? 'سجل الرحلة اليومي' : 'Daily Journey Timeline'}</h2>
                <p className="text-xs text-white/50 mt-0.5">
                  {isAr ? 'متابعة مسجلة يوماً بيوم لمشاعرك وتطور حالتك' : 'A day-by-day record tracking your emotions and progress'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-400/80 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              {timeline.length} {isAr ? 'جلسة مسجلة' : 'Sessions'}
            </span>
          </div>

          {timeline.length > 0 ? (
            <div className="flex flex-col gap-8">
              {(() => {
                const todayStr = new Date().toDateString();
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toDateString();

                const groupsMap = new Map<string, TimelineSession[]>();
                timeline.forEach((session) => {
                  const d = new Date(session.date);
                  let label = session.date;
                  if (!isNaN(d.getTime())) {
                    if (d.toDateString() === todayStr) {
                      label = isAr ? 'اليوم (النهاردة)' : 'Today';
                    } else if (d.toDateString() === yesterdayStr) {
                      label = isAr ? 'أمس (إمبارح)' : 'Yesterday';
                    } else {
                      label = session.date;
                    }
                  }
                  if (!groupsMap.has(label)) groupsMap.set(label, []);
                  groupsMap.get(label)!.push(session);
                });

                return Array.from(groupsMap.entries()).map(([dayLabel, daySessions], gIdx) => (
                  <div key={gIdx} className="flex flex-col gap-3 relative">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
                        {dayLabel}
                      </h3>
                      <span className="text-[11px] text-white/40 font-mono">
                        ({daySessions.length} {isAr ? 'جلسات' : 'sessions'})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-4 sm:pl-5 border-l-2 border-white/10" style={isAr ? { borderLeft: 'none', borderRight: '2px solid rgba(255,255,255,0.1)', paddingLeft: 0, paddingRight: '1rem' } : {}}>
                      {daySessions.map((session, i) => (
                        <div 
                          key={session.id || i}
                          onClick={() => openSessionDetail(session)}
                          className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all flex flex-col gap-3 group hover:border-cyan-500/30 backdrop-blur-md"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-white/50">{session.time}</span>
                            <span className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-medium ${session.session_type === 'talk' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>
                              {session.session_type === 'talk' ? (isAr ? 'مكالمة صوتية' : 'Voice Call') : (isAr ? 'محادثة نصية' : 'Chat')}
                            </span>
                          </div>
                          <p className="text-sm text-white/80 line-clamp-3 leading-relaxed">
                            {isAr ? (session.summary_ar || session.summary) : (session.summary_en || session.summary)}
                          </p>
                          {session.themes && session.themes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                              {session.themes.slice(0, 3).map((t, idx) => (
                                <span key={idx} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md text-white/70">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-white/40 border border-white/5 rounded-2xl border-dashed">
              <Calendar className="w-10 h-10 mb-2 opacity-30" />
              <p>{isAr ? 'لسه مفيش جلسات مسجلة في الرحلة. ابدأ محادثة في الشات لتسجيل يومك.' : 'No sessions recorded yet. Start a chat to begin logging your journey.'}</p>
            </div>
          )}
        </section>

      </div>

      {/* Modals */}
      <CheckinModal isOpen={isCheckinOpen} onClose={() => setIsCheckinOpen(false)} onSuccess={() => setIsCheckinOpen(false)} lang={lang} />
      <BreathingExerciseModal isOpen={isBreathingOpen} onClose={() => setIsBreathingOpen(false)} onComplete={() => setIsBreathingOpen(false)} lang={lang} />
      <JournalingModal isOpen={isJournalingOpen} onClose={() => setIsJournalingOpen(false)} onComplete={() => setIsJournalingOpen(false)} lang={lang} />
      <GroundingExerciseModal isOpen={isGroundingOpen} onClose={() => setIsGroundingOpen(false)} onComplete={() => setIsGroundingOpen(false)} lang={lang} />
      {selectedSession && (
        <SessionDetailModal isOpen={isSessionModalOpen} onClose={() => setIsSessionModalOpen(false)} session={selectedSession} lang={lang} />
      )}
    </div>
  );
}
