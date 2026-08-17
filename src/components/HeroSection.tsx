import { Globe, ArrowRight, Mail, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import BackgroundVideo from './BackgroundVideo';
import { useLanguage } from '../context/LanguageContext';

export default function HeroSection() {
  const { t, lang, setLang } = useLanguage();

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
              <a href="#" className="text-white/80 hover:text-white text-sm font-medium transition-colors">{t('pricing')}</a>
              <a href="#" className="text-white/80 hover:text-white text-sm font-medium transition-colors">{t('about')}</a>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="text-white/60 hover:text-white text-sm font-medium transition-colors"
            >
              {lang === 'en' ? 'عربي' : 'EN'}
            </button>
            <button className="text-white text-sm font-medium hover:text-white/80 transition-colors ml-4">{t('signUp')}</button>
            <button className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium hover:bg-white/5 transition-colors">
              {t('login')}
            </button>
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

      {/* Social Icons Footer */}
      <div className="relative z-10 flex justify-center gap-4 pb-12 mt-auto">
        <a href="#" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all">
          <Mail className="w-5 h-5" />
        </a>
        <a href="#" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all">
          <MessageSquare className="w-5 h-5" />
        </a>
        <a href="#" className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all">
          <Globe className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
}
