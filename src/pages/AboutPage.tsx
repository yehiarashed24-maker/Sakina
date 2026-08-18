import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Hls from 'hls.js';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const translations = {
  en: {
    back: "Back to Home",
    type: "Type",
    platform: "Platform",
    mission: "Mission",
    technology: "Technology",
    aboutUs: "About Us",
    sakinaAI: "Sakina AI",
    mentalWellness: "Mental Wellness",
    ai: "Artificial Intelligence",
    safeSpace1: "Sakina AI",
    safeSpace2: "Your Safe Space",
    challenge: "The Challenge",
    challengeDesc: "In today's fast-paced world, many face silent struggles with anxiety, stress, and a lack of accessible emotional support.",
    stat1Val: "70%",
    stat1Label: "Experience daily stress",
    stat2Val: "60%",
    stat2Label: "Lack access to therapy",
    stat3Val: "40%",
    stat3Label: "Feel unheard or isolated",
    solution: "The Sakina Solution",
    solutionTitle: "Sakina provides an empathetic, private, and always-available AI companion tailored for your emotional well-being.",
    solutionDesc: "By combining advanced AI models with deep psychological understanding and secure cloud architecture, we offer a sanctuary for expression.",
    secure: "Secure & Intelligent",
    secureTitle: "Powered by cutting-edge RAG architecture and secured by enterprise-grade MongoDB Atlas encryption.",
    secureDesc: "Your conversations are completely private. Our advanced vector search ensures Sakina remembers your context, providing deeply personalized and continuous emotional support.",
    vision: "Our Vision",
    visionTitle: "Accessible mental wellness for everyone, everywhere.",
    visionDesc: "We envision a world where emotional support is just a tap away. Breaking stigmas and barriers, Sakina is your companion in the journey toward inner peace."
  },
  ar: {
    back: "العودة للرئيسية",
    type: "النوع",
    platform: "المنصة",
    mission: "المهمة",
    technology: "التكنولوجيا",
    aboutUs: "من نحن",
    sakinaAI: "سكينة",
    mentalWellness: "الصحة النفسية",
    ai: "الذكاء الاصطناعي",
    safeSpace1: "سكينة",
    safeSpace2: "مساحتك الآمنة",
    challenge: "التحدي",
    challengeDesc: "في عالمنا السريع اليوم، يواجه الكثيرون صراعات صامتة مع القلق والتوتر، ويفتقرون إلى الدعم النفسي الذي يسهل الوصول إليه.",
    stat1Val: "٧٠٪",
    stat1Label: "يعانون من التوتر اليومي",
    stat2Val: "٦٠٪",
    stat2Label: "يفتقرون للوصول للعلاج",
    stat3Val: "٤٠٪",
    stat3Label: "يشعرون بالعزلة أو التهميش",
    solution: "حل سكينة",
    solutionTitle: "توفر سكينة رفيقاً يعتمد على الذكاء الاصطناعي، متعاطفاً وخاصاً ومتوفراً دائماً لتعزيز صحتك النفسية.",
    solutionDesc: "من خلال الجمع بين نماذج الذكاء الاصطناعي المتقدمة والفهم النفسي العميق، نقدم ملاذاً آمناً للتعبير عن الذات.",
    secure: "آمن وذكي",
    secureTitle: "مدعوم بأحدث تقنيات RAG ومؤمن بتشفير MongoDB Atlas على مستوى الشركات.",
    secureDesc: "محادثاتك خاصة تماماً. يضمن نظامنا المتقدم أن سكينة تتذكر سياق حديثك لتوفير دعم نفسي مستمر ومخصص.",
    vision: "رؤيتنا",
    visionTitle: "دعم نفسي في متناول الجميع، في أي مكان.",
    visionDesc: "نتخيل عالماً يكون فيه الدعم العاطفي متاحاً بضغطة زر. سكينة هي رفيقك في رحلتك نحو السلام الداخلي، لكسر الحواجز النفسية."
  }
};

function useActivation(isActive: boolean) {
  const [activationCount, setActivationCount] = useState(0);
  useEffect(() => {
    if (isActive) setActivationCount(c => c + 1);
  }, [isActive]);
  return activationCount;
}

const Logo = () => (
  <svg width="116" height="36" viewBox="0 0 116 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 18C10 22.4183 13.5817 26 18 26C22.4183 26 26 22.4183 26 18C26 13.5817 22.4183 10 18 10C13.5817 10 10 13.5817 10 18Z" fill="white" fillOpacity="0.2"/>
    <path d="M18 14C15.7909 14 14 15.7909 14 18C14 20.2091 15.7909 22 18 22C20.2091 22 22 20.2091 22 18C22 15.7909 20.2091 14 18 14Z" fill="white"/>
    <text x="36" y="22" fill="white" fontFamily="sans-serif" fontSize="16" fontWeight="bold">Sakina AI</text>
  </svg>
);

const SlideUpLine = ({ children, delay = 0, duration = 0.7 }: any) => (
  <span className="overflow-hidden inline-block align-bottom">
    <motion.span
      initial={{ y: "100%" }}
      animate={{ y: "0%" }}
      transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1] }}
      className="inline-block"
    >
      {children}
    </motion.span>
  </span>
);

const WordByWordReveal = ({ text, baseDelay = 0.25, stagger = 0.035, duration = 0.55, className = "", style, lang }: any) => {
  const words = text.split(" ");
  const marginClass = lang === 'ar' ? 'ml-[0.27em]' : 'mr-[0.27em]';
  return (
    <div className={className} style={style}>
      {words.map((word: string, i: number) => (
        <span key={i} className={`overflow-hidden inline-block ${marginClass} align-bottom`}>
          <motion.span
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            transition={{ delay: baseDelay + i * stagger, duration, ease: [0.25, 0.1, 0.25, 1] }}
            className="inline-block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </div>
  );
};

const BlurReveal = ({ children, delay = 0, duration = 0.9, className = "", style }: any) => (
  <motion.div
    initial={{ opacity: 0, filter: "blur(8px)" }}
    animate={{ opacity: 1, filter: "blur(0px)" }}
    transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1] }}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);

const HlsVideo = ({ src, style, className }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: Hls;

    if (Hls.isSupported()) {
      hls = new Hls({ autoStartLoad: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.log("Auto-play prevented", e));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.log("Auto-play prevented", e));
      });
    }
    return () => { if (hls) hls.destroy(); };
  }, [src]);

  return <video ref={videoRef} className={className} style={style} autoPlay muted loop playsInline />;
};

const Slide1 = ({ isActive, t, lang }: any) => {
  const count = useActivation(isActive);
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col overflow-hidden"
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      style={{ zIndex: isActive ? 10 : 0, pointerEvents: isActive ? "auto" : "none" }}
    >
      <HlsVideo src="https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8" className="absolute inset-0 w-full h-full object-cover" />
      <div key={count} className="relative z-10 w-full h-full flex flex-col">
        <BlurReveal delay={0.1} className="px-[5%] pt-[3.5%] flex justify-between items-start">
          <Logo />
          <div className="flex gap-8">
            <div className="flex flex-col gap-[2px]"><span className="text-[#80838e] text-[13px]">{t.type}</span><span className="text-white text-[13px]">{t.aboutUs}</span></div>
            <div className="flex flex-col gap-[2px]"><span className="text-[#80838e] text-[13px]">{t.platform}</span><span className="text-white text-[13px]">{t.sakinaAI}</span></div>
            <div className="flex flex-col gap-[2px]"><span className="text-[#80838e] text-[13px]">{t.mission}</span><span className="text-white text-[13px]">{t.mentalWellness}</span></div>
            <div className="flex flex-col gap-[2px]"><span className="text-[#80838e] text-[13px]">{t.technology}</span><span className="text-white text-[13px]">{t.ai}</span></div>
          </div>
        </BlurReveal>
        <div className="px-[5%] mt-6"><div className="bg-white/15 h-px w-full" /></div>
        <div className="flex-1 flex items-end px-[5%] pb-[8%]">
          <h1 className="text-white leading-[0.9] tracking-tight" style={{ fontSize: 'clamp(48px, 10vw, 140px)' }}>
            <SlideUpLine delay={0.3} duration={0.7}>{t.safeSpace1}</SlideUpLine><br/>
            <SlideUpLine delay={0.4} duration={0.7}>{t.safeSpace2}</SlideUpLine>
          </h1>
        </div>
      </div>
    </motion.div>
  );
};

const Slide2 = ({ isActive, t, lang }: any) => {
  const count = useActivation(isActive);
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col overflow-hidden"
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      style={{ zIndex: isActive ? 10 : 0, pointerEvents: isActive ? "auto" : "none" }}
    >
      <HlsVideo src="https://stream.mux.com/s8pMcOvMQXc4GD6AX4e1o01xFogFxipmuKltNfSYza0200.m3u8" className="absolute inset-0 w-full h-full object-cover" />
      <div key={count} className="relative z-10 w-full h-full flex flex-col px-[5%]">
        <BlurReveal delay={0.05} className="pt-[3.5%] flex justify-between items-start">
          <Logo />
          <span className="text-[#80838e] text-[20px] leading-[1.4]">02</span>
        </BlurReveal>
        <div className="flex flex-col flex-1 justify-between pt-[4%] pb-[5%]">
          <div className="max-w-[85%]">
            <BlurReveal delay={0.15} className="text-[#80838e] mb-4" style={{ fontSize: 'clamp(12px, 1.2vw, 18px)' }}>{t.challenge}</BlurReveal>
            <WordByWordReveal text={t.challengeDesc} lang={lang} className="text-white leading-[1.04]" style={{ fontSize: 'clamp(22px, 3.5vw, 56px)' }} />
          </div>
          <div className="flex gap-4 w-full">
            {[
              { val: t.stat1Val, label: t.stat1Label },
              { val: t.stat2Val, label: t.stat2Label },
              { val: t.stat3Val, label: t.stat3Label }
            ].map((stat, i) => (
              <motion.div key={i} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 + i * 0.1, ease: [0.25, 0.1, 0.25, 1] }} className="flex flex-1 flex-col gap-3 min-w-0">
                <div className="text-white leading-[0.96] tracking-tight" style={{ fontSize: 'clamp(32px, 6vw, 96px)' }}>{stat.val}</div>
                <div className="text-white leading-[1.4]" style={{ fontSize: 'clamp(13px, 1.2vw, 20px)' }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Slide3 = ({ isActive, t, lang }: any) => {
  const count = useActivation(isActive);
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col overflow-hidden"
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      style={{ zIndex: isActive ? 10 : 0, pointerEvents: isActive ? "auto" : "none" }}
    >
      <HlsVideo src="https://stream.mux.com/Gs3wZfrtz6ZfqZqQ02c02Z7lugV00FGZvRpcqFTel66r3g.m3u8" className="absolute inset-0 w-full h-full object-cover opacity-50" style={{ transform: 'scale(-1, -1)' }} />
      <div key={count} className="relative z-10 w-full h-full flex flex-col">
        <BlurReveal delay={0.05} className="px-[5%] pt-[3.5%] flex justify-between items-start">
          <Logo />
          <span className="text-[#80838e] text-[20px] leading-[1.4]">03</span>
        </BlurReveal>
        <div className="max-w-[55%] px-[5%] pt-[3%] relative z-20">
          <BlurReveal delay={0.15} className="text-[#80838e] mb-4" style={{ fontSize: 'clamp(12px, 1.2vw, 18px)' }}>{t.solution}</BlurReveal>
          <WordByWordReveal text={t.solutionTitle} lang={lang} className="text-white leading-[1.04]" style={{ fontSize: 'clamp(20px, 3.2vw, 52px)' }} />
          <BlurReveal delay={0.8} className="text-[#80838e] max-w-[90%] mt-6" style={{ fontSize: 'clamp(12px, 1.1vw, 18px)' }}>
            {t.solutionDesc}
          </BlurReveal>
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7, ease: [0.25, 0.1, 0.25, 1] }} className="absolute bottom-[3%] left-0 right-0 top-[40%]">
          <div className="absolute bottom-0 right-0 w-[55%] h-[70%]" style={lang === 'ar' ? { right: 'auto', left: 0, transform: 'scaleX(-1)' } : {}}>
             <svg width="100%" height="100%" viewBox="0 0 1000 500" preserveAspectRatio="none">
               <defs>
                 <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="#8238DC" stopOpacity="0.4" />
                   <stop offset="100%" stopColor="#F75CB7" stopOpacity="0.0" />
                 </linearGradient>
                 <linearGradient id="chartStroke" x1="0" y1="0" x2="1" y2="0">
                   <stop offset="0%" stopColor="#8238DC" />
                   <stop offset="100%" stopColor="#F75CB7" />
                 </linearGradient>
               </defs>
               <path d="M0,500 L0,450 C200,450 300,350 500,250 C700,150 800,100 1000,50 L1000,500 Z" fill="url(#chartFill)" />
               <path d="M0,450 C200,450 300,350 500,250 C700,150 800,100 1000,50" fill="none" stroke="url(#chartStroke)" strokeWidth="4" />
               <path d="M0,450 C200,450 300,350 500,250 C700,150 800,100 1000,50" fill="none" stroke="white" strokeWidth="24" strokeOpacity="0.05" />
             </svg>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const Slide4 = ({ isActive, t, lang }: any) => {
  const count = useActivation(isActive);
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col overflow-hidden"
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      style={{ zIndex: isActive ? 10 : 0, pointerEvents: isActive ? "auto" : "none" }}
    >
      <HlsVideo src="https://stream.mux.com/PkFsoKeakRLgL01gjf02CRcSbsJ600Z00NvLr9eRZ92pLbA.m3u8" className="absolute top-0 bottom-0 h-full object-cover" style={lang === 'ar' ? { right: '400px' } : { left: '400px', right: 0 }} />
      <div key={count} className="absolute inset-0 z-10 w-full h-full flex flex-col">
        <div className="absolute top-0 left-0 right-0">
          <BlurReveal delay={0.05} className="pt-[3.5%] px-[5%] flex justify-between items-start">
            <Logo />
            <span className="text-[#80838e] text-[20px] leading-[1.4]">04</span>
          </BlurReveal>
          <div className="absolute top-[calc(3.5%+52px)] left-[5%] right-[5%] bg-white/15 h-px" />
        </div>
        <div className="flex flex-col w-full h-full justify-center px-[5%] max-w-[65%] mt-12">
          <BlurReveal delay={0.15} className="text-[#80838e] mb-4" style={{ fontSize: 'clamp(12px, 1.2vw, 26px)' }}>{t.secure}</BlurReveal>
          <WordByWordReveal text={t.secureTitle} lang={lang} className="text-white leading-[1.04]" style={{ fontSize: 'clamp(20px, 4vw, 80px)' }} />
          <BlurReveal delay={1.2} className="text-[#80838e] max-w-[784px] mt-6" style={{ fontSize: 'clamp(12px, 1.1vw, 26px)' }}>
            {t.secureDesc}
          </BlurReveal>
        </div>
      </div>
    </motion.div>
  );
};

const Slide5 = ({ isActive, t, lang }: any) => {
  const count = useActivation(isActive);
  return (
    <motion.div
      className="absolute inset-0 w-full h-full flex flex-col overflow-hidden bg-[#131318]"
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      style={{ zIndex: isActive ? 10 : 0, pointerEvents: isActive ? "auto" : "none" }}
    >
      <HlsVideo src="https://stream.mux.com/BuGGTsiXq1T00WUb8qfURrHkTCbhrkfFLSv4uAOZzdhw.m3u8" className="absolute object-cover" style={{ width: '200%', height: '200%', bottom: 0, left: 0 }} />
      <div key={count} className="relative z-10 w-full h-full flex flex-col">
        <BlurReveal delay={0.05} className="px-[5%] pt-[3.5%] flex justify-between items-start">
          <Logo />
          <span className="text-[#80838e] text-[20px] leading-[1.4]">05</span>
        </BlurReveal>
        <div className="px-[5%] mt-6"><div className="bg-white/15 h-px w-full" /></div>
        <div className="flex-1" />
        <div className="max-w-[55%] px-[5%] pb-[5%]">
          <BlurReveal delay={0.15} className="text-[#80838e] mb-4" style={{ fontSize: 'clamp(12px, 1.2vw, 26px)' }}>{t.vision}</BlurReveal>
          <WordByWordReveal text={t.visionTitle} lang={lang} className="text-white leading-[1.04]" style={{ fontSize: 'clamp(20px, 4vw, 80px)' }} />
          <BlurReveal delay={0.6} className="text-[#80838e] max-w-[680px] mt-6" style={{ fontSize: 'clamp(12px, 1.1vw, 26px)' }}>
            {t.visionDesc}
          </BlurReveal>
        </div>
      </div>
    </motion.div>
  );
};

export default function AboutPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const totalSlides = 5;
  const { lang } = useLanguage();
  const t = lang === 'ar' ? translations.ar : translations.en;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        setActiveSlide(s => Math.min(s + 1, totalSlides - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setActiveSlide(s => Math.max(s - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`w-screen h-screen bg-black overflow-hidden relative ${lang === 'ar' ? 'font-arabic' : 'font-sans'}`}>
      <Link to="/" className="absolute top-8 left-1/2 -translate-x-1/2 z-50 text-white/50 hover:text-white transition-colors flex items-center gap-2 px-6 py-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 text-sm font-medium" style={lang === 'ar' ? { flexDirection: 'row-reverse' } : {}}>
        <ArrowLeft className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} /> {t.back}
      </Link>

      <Slide1 isActive={activeSlide === 0} t={t} lang={lang} />
      <Slide2 isActive={activeSlide === 1} t={t} lang={lang} />
      <Slide3 isActive={activeSlide === 2} t={t} lang={lang} />
      <Slide4 isActive={activeSlide === 3} t={t} lang={lang} />
      <Slide5 isActive={activeSlide === 4} t={t} lang={lang} />

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2" style={lang === 'ar' ? { flexDirection: 'row-reverse' } : {}}>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            className={`transition-all duration-300 rounded-full ${i === activeSlide ? 'bg-white w-6 h-2' : 'bg-white/40 w-2 h-2'}`}
          />
        ))}
      </div>
    </div>
  );
}
