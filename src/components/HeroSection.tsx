import { useState } from 'react';
import { Globe, ArrowRight, Mail, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import BackgroundVideo from './BackgroundVideo';
import { useLanguage } from '../context/LanguageContext';

export default function HeroSection() {
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('sakina_token'));

  const storedUser = localStorage.getItem('sakina_user');
  const user = storedUser ? JSON.parse(storedUser) : null;

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
          setIsLoggedIn(true);
          // Notify ChatContext to reload conversations
          window.dispatchEvent(new Event('sakina:login'));
        } else {
          console.error("Backend auth failed");
        }
      } catch (err) {
        console.error("Error connecting to auth API", err);
      }
    },
    onError: () => {
      console.error('Google Login Failed');
    }
  });

  return (
    <section className="min-h-screen overflow-hidden relative flex flex-col">
      <BackgroundVideo
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4"
        className="absolute inset-0 w-full h-full object-cover object-bottom"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/80 z-0"></div>

      {/* Navbar */}
      <nav className="relative z-20 px-6 py-6">
        <div className="liquid-glass rounded-full max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/sakina-logo.png" alt="Sakina AI" className="w-8 h-8 rounded-full object-cover mr-2 border border-white/20" />
            <span className="text-white font-semibold text-lg">Sakina AI</span>

            <div className="hidden md:flex items-center gap-8 ml-8">
              <Link to="/pricing" className="text-white/80 hover:text-white text-sm font-medium transition-colors">{t('pricing')}</Link>
              <Link to="/about" className="text-white/80 hover:text-white text-sm font-medium transition-colors">{t('about')}</Link>
              <Link to="/contact" className="text-white/80 hover:text-white text-sm font-medium transition-colors">{t('contact')}</Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="text-white/60 hover:text-white text-sm font-medium transition-colors"
            >
              {lang === 'en' ? 'عربي' : 'EN'}
            </button>
            {isLoggedIn ? (
              <div className="flex items-center gap-4 ml-4">
                <Link to="/chat" className="flex items-center gap-2 liquid-glass rounded-full pl-2 pr-4 py-1.5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:bg-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer">
                  {user?.picture ? (
                    <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full border border-white/20 object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-xs font-bold shadow-inner">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="flex flex-col text-left">
                    <span className="text-white text-[13px] font-semibold tracking-wide">{lang === 'ar' ? 'حسابي' : 'My Account'}</span>
                    <span className="text-emerald-400 text-[9px] uppercase font-bold tracking-widest">{lang === 'ar' ? 'باقة فري' : 'Free Plan'}</span>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem('sakina_token');
                    localStorage.removeItem('sakina_user');
                    localStorage.removeItem('sakina_active_id_v3');
                    window.location.reload();
                  }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-white/60 hover:text-white text-xs font-medium transition-all"
                >
                  {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleGoogleLogin()}
                className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium hover:bg-white/5 transition-colors flex items-center gap-2 ml-4"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {lang === 'ar' ? 'الدخول بحساب جوجل' : 'Sign in with Google'}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center mt-12 md:mt-0">
        <h1 className={`text-7xl md:text-8xl lg:text-9xl text-white tracking-tight whitespace-nowrap mb-4 ${lang === 'en' ? 'font-instrument' : ''}`}>
          {t('heroTitle1')} <br className="hidden md:block" />
          <em className={`italic text-white/90 ${lang === 'en' ? 'font-instrument' : ''}`}>{t('heroTitle2')}</em>
        </h1>

        <p className="text-white/80 text-lg md:text-xl leading-relaxed px-4 max-w-lg mx-auto mb-8 font-medium">
          {lang === 'en' ? t('heroSubtitleEn') : t('heroSubtitle')}
        </p>

        <p className="text-white/60 text-sm md:text-base leading-relaxed px-4 max-w-2xl mx-auto mb-10">
          {t('heroDesc')}
        </p>

        <div className="flex justify-center mt-2">
          <Link
            to="/chat"
            className="group relative inline-flex items-center gap-3 bg-white rounded-full px-8 py-4 text-black text-base font-semibold hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            {t('beginSession')}
            <ArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${lang === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
          </Link>
        </div>
      </div>


    </section>
  );
}
