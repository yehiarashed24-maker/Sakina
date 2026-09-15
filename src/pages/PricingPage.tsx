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
    name: "الباقة الأساسية (ببلاش)",
    price: "0",
    yearlyPrice: "0",
    period: "شهر",
    features: [
      "دخول آمن بحساب جوجل",
      "شات براحتك من غير حدود",
      "تسجيل وتتبع لمزاجك",
      "تشفير كامل وحماية لبياناتك",
      "سرعة رد عادية",
    ],
    description: "حلوة للفضفضة والكلام اليومي.",
    buttonText: "ابدأ ببلاش",
    href: "/chat",
  },
  {
    name: "سكينة برو",
    price: "15",
    yearlyPrice: "12",
    period: "شهر",
    features: [
      "كل اللي في الباقة الأساسية",
      "اتكلم مع سكينة بصوتك",
      "متابعة وتحليل لمشاعرك مع الوقت",
      "أولوية وسرعة في الرد",
      "جرّب المميزات الجديدة قبل أي حد",
    ],
    description: "لو عايز تتفاعل وتتكلم مع سكينة أكتر.",
    buttonText: "خليك برو",
    href: "/chat",
    isPopular: true,
  },
  {
    name: "للدكاترة والمعالجين",
    price: "99",
    yearlyPrice: "79",
    period: "شهر",
    features: [
      "لوحة تحكم لمتابعة حالات مرضاك",
      "قاعدة بيانات طبية مخصصة",
      "تصدير ملخصات للجلسات",
      "دعم فني طول الوقت",
    ],
    description: "للمتخصصين والعيادات النفسية.",
    buttonText: "كلمنا",
    href: "#",
  },
];

export default function PricingPage() {
  const { lang } = useLanguage();

  const translationsAr = {
    monthly: "شهري",
    annual: "سنوي",
    save: "(وفر ٢٠٪)",
    mostPopular: "الأكثر اختيارًا",
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
        {lang === 'ar' ? 'ارجع للرئيسية' : 'Back to Home'}
      </Link>

      <PricingSection
        plans={lang === 'ar' ? demoPlansAr : demoPlansEn}
        title={lang === 'ar' ? "باقات وأسعار واضحة" : "Simple, Transparent Pricing"}
        description={lang === 'ar' ? "اختار الباقة اللي تريحك وتناسب احتياجك." : "Choose the plan that's right for you. All plans include our core privacy features."}
        translations={lang === 'ar' ? translationsAr : translationsEn}
      />
    </div>
  );
}
