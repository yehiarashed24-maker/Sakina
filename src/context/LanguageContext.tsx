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
    heroSubtitle: "مساحة آمنة لفهم مشاعرك والتعبير عن أفكارك", // kept as requested or translate? Prompt said "Arabic subtitle" so I'll keep it arabic in EN or translate to EN? I'll translate to EN for EN mode.
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
    philTitle2: "Intelligence",
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
    heroSubtitle: "مساحة آمنة لفهم مشاعرك والتعبير عن أفكارك",
    heroSubtitleEn: "مساحة آمنة لفهم مشاعرك والتعبير عن أفكارك",
    heroDesc: "رفيق ذكي يستمع إليك، يتفهم مشاعرك، ويساعدك على التأمل باستخدام معرفة نفسية موثوقة.",
    startConv: "ابدأ المحادثة",
    exploreSakina: "استكشف سَكِينَة",
    
    // About
    aboutLabel: "عن سَكِينَة",
    aboutTitle1: "حيث تلتقي التكنولوجيا",
    aboutTitle2: "بالفهم العاطفي",
    aboutDesc: "تجمع سَكِينَة بين الذكاء الاصطناعي والمعرفة النفسية لخلق محادثات داعمة وهادفة.",
    
    // Featured
    howWorks: "كيف تعمل سَكِينَة",
    ragDesc: "باستخدام تقنية RAG، تسترجع سَكِينَة معلومات نفسية موثوقة قبل توليد ردود داعمة بالذكاء الاصطناعي.",
    
    // Philosophy
    philTitle1: "التعاطف",
    philTitle2: "الذكاء",
    emoUnder: "الفهم العاطفي",
    emoDesc: "تتفهم سَكِينَة أفكارك ومشاعرك وسياق المحادثة لخلق تفاعلات ذات معنى.",
    knowAi: "ذكاء اصطناعي مبني على المعرفة",
    knowDesc: "تسترجع سَكِينَة المعلومات من مصادر الصحة النفسية الموثوقة قبل توليد الردود.",
    
    // Services
    whatSakinaDoes: "ماذا تقدم سَكِينَة",
    featuresLabel: "المميزات",
    reflection: "تأمل",
    journaling: "مذكرات ذكية",
    journalDesc: "عبر عن أفكارك واكتشف أنماطك العاطفية من خلال محادثات ذكية.",
    support: "دعم",
    wellnessComp: "رفيق الصحة النفسية",
    wellnessDesc: "مساحة ذكية وخاصة حيث يمكنك التحدث والتأمل وفهم نفسك بشكل أفضل.",
    
    // Chat
    online: "متصل",
    typeMsg: "اكتب ما بداخلك...",
    home: "الرئيسية",
    recentChats: "محادثات سابقة",
    moodTracker: "متتبع المزاج",
    currentState: "الحالة الحالية",
    stable: "مستقر",
    ragActive: "نظام RAG يعمل",
    
    // RAG Steps
    step1: "تحليل مشاعر المستخدم...",
    step2: "البحث في قاعدة المعرفة النفسية...",
    step3: "استرجاع السياق المناسب...",
    step4: "توليد رد داعم...",
    
    // CTA Section
    ctaTitle1: "هل أنت مستعد",
    ctaTitle2: "لبدء جلستك؟",
    ctaDesc: "جرب رفيقاً نفسياً خاصاً يعمل بالذكاء الاصطناعي، مُصمم خصيصاً لفهم ودعم صحتك النفسية بأمان وسرية.",
    beginSession: "ابدأ الجلسة العلاجية",
    
    // Footer
    privacy: "سياسة الخصوصية",
    terms: "شروط الخدمة",
    contact: "اتصل بنا",
    copyright: "© 2026 سَكِينَة للذكاء الاصطناعي. جميع الحقوق محفوظة.",
    tagline: "رفيقك النفسي بالذكاء الاصطناعي."
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
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
