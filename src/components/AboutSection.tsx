import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t, lang } = useLanguage();

  return (
    <section ref={ref} className="bg-black pt-32 md:pt-44 pb-10 md:pb-14 px-6 overflow-hidden relative">
      {/* Subtle radial gradient overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center">
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-white/40 text-sm tracking-widest uppercase mb-8 md:mb-12"
        >
          {t('aboutLabel')}
        </motion.span>
        
        <motion.h2 
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className={`text-4xl md:text-6xl lg:text-7xl text-white leading-[1.1] tracking-tight mb-8 ${lang === 'en' ? '' : 'font-semibold'}`}
        >
          {t('aboutTitle1')} <br className="hidden md:block" />
          <em className={`${lang === 'en' ? 'font-instrument' : ''} italic text-white/60 ml-2`}>{t('aboutTitle2')}</em>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-white/60 max-w-2xl text-center text-lg leading-relaxed"
        >
          {t('aboutDesc')}
        </motion.p>
      </div>
    </section>
  );
}
