import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HeroSection from './components/HeroSection';
import AboutPage from './pages/AboutPage';
import PricingPage from './pages/PricingPage';
import FeaturedVideoSection from './components/FeaturedVideoSection';
import PhilosophySection from './components/PhilosophySection';
import ServicesSection from './components/ServicesSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import ChatPage from './components/ChatPage';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ChatProvider } from './context/ChatContext';

function Home() {
  const { lang } = useLanguage();
  return (
    <main className={`bg-black min-h-screen text-white font-sans selection:bg-white/30 ${lang === 'ar' ? 'font-arabic' : ''}`}>
      <div className="relative z-10 bg-black">
        <HeroSection />
        <FeaturedVideoSection />
        <PhilosophySection />
        <ServicesSection />
        <CTASection />
      </div>
      <Footer />
    </main>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ChatProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
        </Router>
      </ChatProvider>
    </LanguageProvider>
  );
}

export default App;
