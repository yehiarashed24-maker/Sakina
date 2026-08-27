import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { Lock, ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import NeuralBackground from './chat/NeuralBackground';
import ChatSidebar from './chat/ChatSidebar';
import ChatWindow from './chat/ChatWindow';
import SakinaTalkView from './talk/SakinaTalkView';

interface ChatPageProps {
  initialMode?: 'chat' | 'talk';
}

export default function ChatPage({ initialMode = 'chat' }: ChatPageProps) {
  const { lang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem('sakina_token'));
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Sync token on login events
  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem('sakina_token'));
    };
    window.addEventListener('sakina:login', handleAuthChange);
    return () => window.removeEventListener('sakina:login', handleAuthChange);
  }, []);

  // Determine mode directly from location pathname or initialMode
  const isTalkRoute = location.pathname === '/talk' || initialMode === 'talk';
  const [mode, setMode] = useState<'chat' | 'talk'>(isTalkRoute ? 'talk' : 'chat');

  // Keep mode in sync whenever route changes
  useEffect(() => {
    if (location.pathname === '/talk') {
      setMode('talk');
    } else if (location.pathname === '/chat') {
      setMode('chat');
    }
  }, [location.pathname]);

  const handleSwitchToTalk = () => {
    setMode('talk');
    navigate('/talk');
  };

  const handleSwitchToChat = () => {
    setMode('chat');
    navigate('/chat');
  };

  // Google Login Hook for the Auth Gate
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoggingIn(true);
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
          setToken(data.access_token);
          window.dispatchEvent(new Event('sakina:login'));
        } else {
          console.error("Backend auth failed");
        }
      } catch (err) {
        console.error("Error connecting to auth API", err);
      } finally {
        setIsLoggingIn(false);
      }
    },
    onError: () => {
      console.error('Google Login Failed');
      setIsLoggingIn(false);
    }
  });

  // ================= STRICT AUTH GATE =================
  // If user is not signed in, do not let them enter therapy session
  if (!token) {
    return (
      <div className={`bg-black min-h-screen text-white font-sans selection:bg-white/30 relative flex items-center justify-center p-4 overflow-hidden ${lang === 'ar' ? 'font-arabic' : ''}`}>
        <NeuralBackground />

        {/* Ambient Glows */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-cyan-900/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-indigo-950/25 rounded-full blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 max-w-md w-full liquid-glass rounded-[36px] border border-white/10 p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl backdrop-blur-3xl bg-neutral-950/80"
        >
          {/* Logo & Lock Badge */}
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border border-white/20 bg-white/5 p-1 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.15)]">
              <img src="/sakina-logo.png" alt="Sakina AI" className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 border-2 border-black flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.8)]">
              <Lock className="w-3 h-3 text-black stroke-[3]" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] uppercase tracking-widest mb-4">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>{lang === 'ar' ? 'جلسة محمية وخاصة' : 'PROTECTED SESSION'}</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-3">
            {lang === 'ar' ? 'دخول الجلسة العلاجية' : 'Enter Therapy Session'}
          </h2>

          {/* Subtitle */}
          <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-8 max-w-sm">
            {lang === 'ar'
              ? 'للحفاظ على خصوصية مشاعرك وحفظ تاريخ جلساتك ومحادثاتك بأمان، يرجى تسجيل الدخول بحساب Google للمتابعة.'
              : 'To protect your privacy and securely maintain your mental wellness sessions, please sign in with Google to continue.'}
          </p>

          {/* Google Sign In Button */}
          <button
            onClick={() => handleGoogleLogin()}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-black font-semibold text-sm py-4 px-6 rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>{isLoggingIn ? (lang === 'ar' ? 'جاري التحقق...' : 'Signing in...') : (lang === 'ar' ? 'الدخول بحساب Google' : 'Sign in with Google')}</span>
          </button>

          {/* Back to Home Link */}
          <Link
            to="/"
            className="mt-6 text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1.5 font-mono"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <span>{lang === 'ar' ? 'العودة للصفحة الرئيسية' : 'Return to Home'}</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  // ================= AUTHENTICATED THERAPY SESSION =================
  return (
    <div className={`bg-black min-h-screen text-white font-sans selection:bg-white/30 relative overflow-hidden ${lang === 'ar' ? 'font-arabic' : ''}`}>
      <AnimatePresence mode="wait">
        {mode === 'talk' ? (
          <motion.div
            key="talk-mode"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full min-h-screen"
          >
            <SakinaTalkView onSwitchToChat={handleSwitchToChat} />
          </motion.div>
        ) : (
          <motion.div
            key="chat-mode"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full min-h-screen flex relative"
          >
            <NeuralBackground />
            <ChatSidebar onSwitchToTalk={handleSwitchToTalk} />
            <ChatWindow onSwitchToTalk={handleSwitchToTalk} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
