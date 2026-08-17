import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import MoodTracker from './MoodTracker';
import { useLanguage } from '../../context/LanguageContext';
import { useChatContext } from '../../context/ChatContext';

export default function ChatSidebar() {
  const { t, lang } = useLanguage();
  const { conversations, activeConvId, startNewConversation, switchConversation, deleteConversation } = useChatContext();

  return (
    <aside className="w-[340px] hidden lg:flex flex-col border-r border-white/5 relative z-10 liquid-glass m-6 mr-3 rounded-[40px] shadow-2xl backdrop-blur-xl bg-white/[0.01]">
      <div className="p-8 pb-6 border-b border-white/5 flex flex-col gap-8">
        <Link
          to="/"
          className="text-white/50 hover:text-white transition-colors flex items-center gap-3 text-sm font-medium w-fit group"
        >
          <ArrowLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-1 ${lang === 'ar' ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
          {t('home') || 'Home'}
        </Link>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={startNewConversation}
          className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl py-4 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium text-sm">
            {lang === 'ar' ? 'محادثة جديدة' : 'New Conversation'}
          </span>
        </motion.button>
      </div>

      <div className="p-8 pt-6 flex-1 overflow-y-auto hide-scrollbar flex flex-col">
        <h4 className="text-white/30 text-xs tracking-widest uppercase mb-6 font-mono">
          {lang === 'ar' ? 'سجل المحادثات' : 'Conversation History'}
        </h4>
        <div className="space-y-2">
          {conversations.map((conv) => (
            <motion.div
              key={conv.id}
              whileHover={{ x: 4 }}
              onClick={() => switchConversation(conv.id)}
              className={`p-4 rounded-2xl transition-colors cursor-pointer border flex items-center justify-between group ${
                conv.id === activeConvId
                  ? 'bg-white/10 border-white/10'
                  : 'hover:bg-white/5 border-transparent hover:border-white/5'
              }`}
            >
              <div className="flex flex-col gap-1.5 overflow-hidden pr-2">
                <p className={`text-sm font-medium transition-colors truncate ${
                  conv.id === activeConvId ? 'text-white' : 'text-white/70 group-hover:text-white'
                }`}>
                  {lang === 'ar' && conv.titleAr ? conv.titleAr : conv.title}
                </p>
                <p className="text-xs text-white/30">{conv.time}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 text-white/40 hover:text-red-400 ${
                  conv.id === activeConvId ? 'opacity-100' : ''
                }`}
                title={lang === 'ar' ? 'حذف المحادثة' : 'Delete Chat'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <MoodTracker />
        </div>
      </div>
    </aside>
  );
}
