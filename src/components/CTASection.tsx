import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import BackgroundVideo from './BackgroundVideo';
import { useLanguage } from '../context/LanguageContext';

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t, lang } = useLanguage();

  return (
    <section ref={ref} className="bg-black py-32 md:py-48 px-6 overflow-hidden relative flex flex-col items-center justify-center min-h-[70vh]">
      <BackgroundVideo
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        <motion.h2 
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className={`text-5xl md:text-7xl lg:text-8xl text-white tracking-tight mb-8 ${lang === 'en' ? 'font-instrument' : 'font-semibold'}`}
        >
          {t('ctaTitle1')} <br />
          <em className={`italic text-white/80 ${lang === 'en' ? 'font-instrument' : ''}`}>{t('ctaTitle2')}</em>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          {t('ctaDesc')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link 
            to="/chat" 
            className="group relative inline-flex items-center gap-4 bg-white rounded-full px-10 py-5 text-black text-lg font-semibold hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            {t('beginSession')}
            <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${lang === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
