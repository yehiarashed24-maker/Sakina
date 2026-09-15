import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

export const translations = {
  en: {
    // Nav
    features: "Features",
    pricing: "Pricing",
    about: "About",
    signUp: "Sign Up",
    login: "Login",
    
    // Hero
    heroTitle1: "Understand your mind",
    heroTitle2: "with Sakina",
    heroSubtitle: "مساحة تحكي فيها براحتك وتفهم مشاعرك", // kept as requested or translate? Prompt said "Arabic subtitle" so I'll keep it arabic in EN or translate to EN? I'll translate to EN for EN mode.
    heroSubtitleEn: "A safe space to understand your feelings and express your thoughts",
    heroDesc: "An intelligent AI companion that listens, understands emotions, and helps you reflect using trusted psychological knowledge.",
    startConv: "Start Conversation",
    exploreSakina: "Explore Sakina",
    
    // About
    aboutLabel: "ABOUT SAKINA",
    aboutTitle1: "Where technology meets",
    aboutTitle2: "emotional understanding",
    aboutDesc: "Sakina combines artificial intelligence and psychological knowledge to create meaningful and supportive conversations.",
    
    // Featured
    howWorks: "HOW SAKINA WORKS",
    ragDesc: "Using RAG technology, Sakina retrieves trusted psychological information before generating supportive AI responses.",
    
    // Philosophy
    philTitle1: "Empathy",
    philTitle2: "Artificial Intelligence",
    emoUnder: "Emotional Understanding",
    emoDesc: "Sakina understands your thoughts, emotions, and conversation context to create meaningful interactions.",
    knowAi: "Knowledge Powered AI",
    knowDesc: "Sakina retrieves information from trusted mental health resources before generating responses.",
    
    // Services
    whatSakinaDoes: "What Sakina does",
    featuresLabel: "FEATURES",
    reflection: "Reflection",
    journaling: "AI Journaling",
    journalDesc: "Express your thoughts and discover emotional patterns through intelligent conversations.",
    support: "Support",
    wellnessComp: "Mental Wellness Companion",
    wellnessDesc: "A private AI space where you can talk, reflect, and better understand yourself.",
    
    // Chat
    online: "Online",
    typeMsg: "Share what's on your mind...",
    home: "Home",
    recentChats: "Recent Chats",
    moodTracker: "Mood Tracker",
    currentState: "Current State",
    stable: "Stable",
    ragActive: "RAG Pipeline Active",
    
    // RAG Steps
    step1: "Understanding user emotion",
    step2: "Searching psychological knowledge base",
    step3: "Retrieving relevant context",
    step4: "Generating supportive response",
    
    // CTA Section
    ctaTitle1: "Ready to start",
    ctaTitle2: "your session?",
    ctaDesc: "Experience a private, AI-powered psychological companion tailored to understand and support your mental well-being.",
    beginSession: "Begin Therapy Session",
    
    // Footer
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    contact: "Contact Us",
    copyright: "© 2026 Sakina AI. All rights reserved.",
    tagline: "Your AI Psychological Companion."
  },
  ar: {
    // Nav
    features: "المميزات",
    pricing: "الأسعار",
    about: "عن سَكِينَة",
    signUp: "تسجيل",
    login: "دخول",
    
    // Hero
    heroTitle1: "افهم مشاعرك",
    heroTitle2: "مع سَكِينَة",
    heroSubtitle: "مساحة تحكي فيها براحتك وتفهم مشاعرك",
    heroSubtitleEn: "مساحة تحكي فيها براحتك وتفهم مشاعرك",
    heroDesc: "سكينة بتسمعك وبتساعدك تفهم مشاعرك، وبتستند لمصادر نفسية في ردودها.",
    startConv: "ابدأ المحادثة",
    exploreSakina: "استكشف سَكِينَة",
    
    // About
    aboutLabel: "عن سَكِينَة",
    aboutTitle1: "تكنولوجيا بتساعدك",
    aboutTitle2: "تفهم مشاعرك",
    aboutDesc: "سَكِينَة بتجمع بين الذكاء الاصطناعي والمعرفة النفسية عشان تسمعك وتساعدك تفكر في اللي حاسس بيه.",
    
    // Featured
    howWorks: "سَكِينَة بتشتغل إزاي",
    ragDesc: "سَكِينَة بتدور في المصادر النفسية قبل ما ترد، ولو الدليل مش كفاية بتقولك.",
    
    // Philosophy
    philTitle1: "التعاطف",
    philTitle2: "الذكاء الاصطناعي",
    emoUnder: "الفهم العاطفي",
    emoDesc: "سَكِينَة بتتابع كلامك واللي بتشاركه عن مشاعرك عشان ردها يبقى مرتبط بيك.",
    knowAi: "ذكاء اصطناعي مبني على المعرفة",
    knowDesc: "سَكِينَة بتراجع مصادر الصحة النفسية قبل ما تجاوبك.",
    
    // Services
    whatSakinaDoes: "سَكِينَة بتقدملك إيه",
    featuresLabel: "المميزات",
    reflection: "تأمل",
    journaling: "مذكرات ذكية",
    journalDesc: "احكي اللي في بالك، وخد بالك من المشاعر اللي بتتكرر معاك.",
    support: "دعم",
    wellnessComp: "رفيق الصحة النفسية",
    wellnessDesc: "مساحة ليك تحكي وتفكر فيها وتفهم نفسك أكتر.",
    
    // Chat
    online: "متصل",
    typeMsg: "احكي اللي في بالك...",
    home: "الرئيسية",
    recentChats: "محادثات سابقة",
    moodTracker: "متابعة مشاعرك",
    currentState: "إحساسك دلوقتي",
    stable: "مستقر",
    ragActive: "نظام RAG يعمل",
    
    // RAG Steps
    step1: "براجع اللي شاركته...",
    step2: "بدوّر في المصادر النفسية...",
    step3: "براجع المصادر المناسبة...",
    step4: "بجهز الرد...",
    
    // CTA Section
    ctaTitle1: "جاهز",
    ctaTitle2: "نبدأ كلامنا؟",
    ctaDesc: "جرّب تحكي مع سَكِينَة، مساعدتك بالذكاء الاصطناعي عشان تفكر في مشاعرك وتاخد خطوة تناسبك.",
    beginSession: "ابدأ الكلام",
    
    // Footer
    privacy: "سياسة الخصوصية",
    terms: "شروط الخدمة",
    contact: "كلمنا",
    copyright: "© 2026 سَكِينَة للذكاء الاصطناعي. جميع الحقوق محفوظة.",
    tagline: "رفيقك النفسي بالذكاء الاصطناعي."
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => localStorage.getItem('sakina_language') === 'ar' ? 'ar' : 'en');

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang === 'ar' ? 'ar-EG' : 'en';
    localStorage.setItem('sakina_language', lang);
  }, [lang]);

  const t = (key: keyof typeof translations.en) => {
    return translations[lang][key];
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
