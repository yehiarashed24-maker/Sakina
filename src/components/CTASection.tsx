import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { ArrowRight } from 'lucide-react';
import BackgroundVideo from './BackgroundVideo';
import { useLanguage } from '../context/LanguageContext';

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "";
        const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: tokenResponse.access_token })
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('sakina_token', data.access_token);
          if (data.user) {
            localStorage.setItem('sakina_user', JSON.stringify(data.user));
          }
          window.dispatchEvent(new Event('sakina:login'));
          navigate('/chat');
        }
      } catch (err) {
        console.error("Error connecting to auth API", err);
      }
    },
    onError: () => {
      console.error('Google Login Failed');
    }
  });

  const handleEnterSession = (targetPath: string) => {
    if (localStorage.getItem('sakina_token')) {
      navigate(targetPath);
    } else {
      handleGoogleLogin();
    }
  };

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
          className="flex justify-center"
        >
          {/* Primary Therapy Session Button */}
          <button 
            onClick={() => handleEnterSession('/chat')}
            className="group relative inline-flex items-center gap-3 bg-white rounded-full px-8 sm:px-10 py-4 sm:py-5 text-black text-base sm:text-lg font-semibold hover:bg-neutral-100 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)] cursor-pointer"
          >
            <span>{lang === 'ar' ? 'احكي مع سكينة' : 'Enter Therapy Session'}</span>
            <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${lang === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
