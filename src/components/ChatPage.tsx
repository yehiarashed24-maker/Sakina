import { useLanguage } from '../context/LanguageContext';
import NeuralBackground from './chat/NeuralBackground';
import ChatSidebar from './chat/ChatSidebar';
import ChatWindow from './chat/ChatWindow';

export default function ChatPage() {
  const { lang } = useLanguage();

  return (
    <main className={`bg-black min-h-screen text-white font-sans selection:bg-white/30 relative flex overflow-hidden ${lang === 'ar' ? 'font-arabic' : ''}`}>
      <NeuralBackground />
      <ChatSidebar />
      <ChatWindow />
    </main>
  );
}
