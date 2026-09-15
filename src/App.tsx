import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HeroSection from './components/HeroSection';
import FeaturedVideoSection from './components/FeaturedVideoSection';
import PhilosophySection from './components/PhilosophySection';
import ServicesSection from './components/ServicesSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ChatProvider } from './context/ChatContext';

// Route-level dynamic code-splitting: loads heavy pages on-demand
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const ChatPage = React.lazy(() => import('./components/ChatPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const RAGInspectorPage = React.lazy(() => import('./pages/RAGInspectorPage'));
const JourneyPage = React.lazy(() => import('./pages/JourneyPage'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
    </div>
  );
}

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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/chat" element={<ChatPage initialMode="chat" />} />
              <Route path="/talk" element={<ChatPage initialMode="talk" />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/rag-inspector" element={<RAGInspectorPage />} />
              <Route path="/journey" element={<JourneyPage />} />
            </Routes>
          </Suspense>
        </Router>
      </ChatProvider>
    </LanguageProvider>
  );
}

export default App;
