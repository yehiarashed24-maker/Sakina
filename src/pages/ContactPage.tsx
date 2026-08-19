import React, { useState } from 'react';
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
      <PrismaHero />
      
      <section className="py-24 px-6 relative z-10" id="contact-form">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              {lang === 'ar' ? 'تواصل معنا' : 'Get in Touch'}
            </h2>
            <p className="text-white/60 text-lg">
              {lang === 'ar' 
                ? 'نحن هنا للإجابة على استفساراتك ودعمك في رحلتك نحو الصحة النفسية.' 
                : 'We are here to answer your questions and support your mental wellness journey.'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 liquid-glass rounded-3xl p-8 md:p-12 border border-white/10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-white/80">
                  {lang === 'ar' ? 'الاسم' : 'Name'}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder={lang === 'ar' ? 'اكتب اسمك هنا...' : 'Enter your name...'}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-white/80">
                  {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder={lang === 'ar' ? 'example@email.com' : 'example@email.com'}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-white/80">
                {lang === 'ar' ? 'الرسالة' : 'Message'}
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                placeholder={lang === 'ar' ? 'كيف يمكننا مساعدتك؟' : 'How can we help you?'}
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-white text-black font-semibold rounded-xl px-4 py-4 hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : 
               status === 'success' ? (lang === 'ar' ? 'تم الإرسال بنجاح!' : 'Sent Successfully!') :
               status === 'error' ? (lang === 'ar' ? 'حدث خطأ، حاول مرة أخرى' : 'Error sending. Try again.') :
               (lang === 'ar' ? 'إرسال الرسالة' : 'Send Message')}
            </button>
          </form>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
