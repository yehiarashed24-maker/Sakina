import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PrismaHero } from '../components/ui/prisma-hero';
import { useLanguage } from '../context/LanguageContext';
import Footer from '../components/Footer';

export default function ContactPage() {
  const { lang } = useLanguage();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    
    const form = e.currentTarget;
    const data = new FormData(form);
    
    try {
      const response = await fetch('https://formspree.io/f/xgawrkqr', {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        setStatus('success');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className={`min-h-screen bg-black text-white ${lang === 'ar' ? 'font-arabic' : 'font-sans'}`}>
      <PrismaHero>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full mt-4 liquid-glass rounded-2xl p-6 border border-white/10"
        >
          <form onSubmit={handleSubmit} className="space-y-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="space-y-1">
              <input
                type="text"
                name="name"
                required
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                placeholder={lang === 'ar' ? 'الاسم' : 'Name'}
              />
            </div>
            
            <div className="space-y-1">
              <input
                type="email"
                name="email"
                required
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              />
            </div>
            
            <div className="space-y-1">
              <textarea
                name="message"
                required
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all resize-none"
                placeholder={lang === 'ar' ? 'الرسالة' : 'Message'}
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-white text-black font-semibold rounded-lg px-3 py-2 text-sm hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : 
               status === 'success' ? (lang === 'ar' ? 'تم الإرسال بنجاح!' : 'Sent Successfully!') :
               status === 'error' ? (lang === 'ar' ? 'حدث خطأ، حاول مرة أخرى' : 'Error sending. Try again.') :
               (lang === 'ar' ? 'إرسال الرسالة' : 'Send Message')}
            </button>
          </form>
        </motion.div>
      </PrismaHero>
      
      <Footer />
    </div>
  );
}
