import { PricingSection, type PricingPlan } from "../components/ui/pricing";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// Demo data for the pricing plans
const demoPlansEn: PricingPlan[] = [
  {
    name: "Free Companion",
    price: "0",
    yearlyPrice: "0",
    period: "month",
    features: [
      "Secure Google Sign-in",
      "Unlimited text messages",
      "Basic mood tracking",
      "End-to-end encryption",
      "Standard response time",
    ],
    description: "Perfect for everyday emotional check-ins.",
    buttonText: "Start Free",
    href: "/chat",
  },
  {
    name: "Sakina Pro",
    price: "15",
    yearlyPrice: "12",
    period: "month",
    features: [
      "Everything in Free",
      "Real-time Voice Mode",
      "Advanced psychological insights",
      "Priority response time",
      "Early access to new features",
    ],
    description: "Ideal for deeper, more interactive support.",
    buttonText: "Upgrade to Pro",
    href: "/chat",
    isPopular: true,
  },
  {
    name: "Therapist Tools",
    price: "99",
    yearlyPrice: "79",
    period: "month",
    features: [
      "Dashboard for patient insights",
      "Custom RAG knowledge base",
      "Export session summaries",
      "Priority API access",
    ],
    description: "For professionals and clinics.",
    buttonText: "Contact Us",
    href: "#",
  },
];

const demoPlansAr: PricingPlan[] = [
  {
    name: "الباقة المجانية",
    price: "0",
    yearlyPrice: "0",
    period: "شهر",
    features: [
      "تسجيل دخول آمن بجوجل",
      "رسائل نصية غير محدودة",
      "تتبع أساسي للحالة المزاجية",
      "تشفير كامل للبيانات",
      "وقت استجابة قياسي",
    ],
    description: "مثالية للاستخدام اليومي والفضفضة السريعة.",
    buttonText: "ابدأ مجاناً",
    href: "/chat",
  },
  {
    name: "سكينة برو",
    price: "15",
    yearlyPrice: "12",
    period: "شهر",
    features: [
      "كل مميزات الباقة المجانية",
      "ميزة التحدث الصوتي المباشر",
      "تحليلات نفسية متقدمة",
      "أولوية قصوى في الاستجابة",
      "دخول مبكر للميزات الجديدة",
    ],
    description: "مثالية لدعم نفسي أعمق وأكثر تفاعلية.",
    buttonText: "ترقية لنسخة برو",
    href: "/chat",
    isPopular: true,
  },
  {
    name: "أدوات المعالجين",
    price: "99",
    yearlyPrice: "79",
    period: "شهر",
    features: [
      "لوحة تحكم لمتابعة المرضى",
      "قاعدة بيانات RAG مخصصة",
      "تصدير ملخصات الجلسات",
      "دعم فني على مدار الساعة",
    ],
    description: "للمعالجين النفسيين والعيادات المتخصصة.",
    buttonText: "تواصل معنا",
    href: "#",
  },
];

export default function PricingPage() {
  const { lang, t } = useLanguage();

  const translationsAr = {
    monthly: "شهري",
    annual: "سنوي",
    save: "(وفر ٢٠٪)",
    mostPopular: "الأكثر شيوعاً",
    billedMonthly: "تدفع شهرياً",
    billedAnnually: "تدفع سنوياً",
  };

  const translationsEn = {
    monthly: "Monthly",
    annual: "Annual",
    save: "(Save 20%)",
    mostPopular: "Most Popular",
    billedMonthly: "Billed Monthly",
    billedAnnually: "Billed Annually",
  };

  return (
    <div className={`relative min-h-screen bg-black ${lang === 'ar' ? 'font-arabic' : 'font-sans'}`}>
      <Link 
        to="/" 
        className="absolute top-8 left-8 z-50 text-white/50 hover:text-white transition-colors flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-sm font-medium"
      >
        <ArrowLeft className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} /> 
        {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
      </Link>

      <PricingSection
        plans={lang === 'ar' ? demoPlansAr : demoPlansEn}
        title={lang === 'ar' ? "خطط وأسعار بسيطة" : "Simple, Transparent Pricing"}
        description={lang === 'ar' ? "اختر الباقة المناسبة لك. الخصوصية والأمان متوفران في كل الباقات." : "Choose the plan that's right for you. All plans include our core privacy features."}
        translations={lang === 'ar' ? translationsAr : translationsEn}
      />
    </div>
  );
}
