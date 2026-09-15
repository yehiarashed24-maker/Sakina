import { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';
import type { EvidenceSource, RetrievalMetadata, SafetyMetadata } from '../../services/aiService';
import EvidenceDrawer from './EvidenceDrawer';

interface MessageProps {
  text: string;
  isAi: boolean;
  lang?: 'en' | 'ar';
  sources?: EvidenceSource[];
  retrieval?: RetrievalMetadata;
  safety?: SafetyMetadata;
}

export default function MessageBubble({
  text,
  isAi,
  lang = 'ar',
  sources = [],
  retrieval,
  safety
}: MessageProps) {
  const { speak, stopSpeaking, isSpeaking } = useVoice();
  const [isPlayingThis, setIsPlayingThis] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleToggleSpeak = () => {
    if (isPlayingThis && isSpeaking) {
      stopSpeaking();
      setIsPlayingThis(false);
    } else {
      setIsPlayingThis(true);
      // Clean bracket citations [1] from speech audio
      const speechText = text.replace(/\[\d+\]/g, '').replace(/📚.*$/s, '').trim();
      speak(speechText, lang, () => setIsPlayingThis(false));
    }
  };

  const hasEvidence = isAi && !retrieval?.is_conversational && retrieval?.sufficient === true && sources.length > 0 && sources.some(source => text.includes(`[${source.rank}]`));

  const renderFormattedText = (rawText?: string) => {
    if (!rawText) return null;

    // Parse markdown headers, bold, links, and bracket citations [1]
    const html = rawText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/###\s+(.*)/g, '<strong class="text-lg font-bold text-white mt-4 mb-2 block">$1</strong>')
      .replace(/##\s+(.*)/g, '<strong class="text-xl font-bold text-white mt-4 mb-2 block">$1</strong>')
      .replace(/#\s+(.*)/g, '<strong class="text-2xl font-bold text-white mt-4 mb-2 block">$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.*?)\]\((https?:\/\/[^\s]*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-white/30 hover:decoration-cyan-400/50 transition-all font-semibold">$1</a>')
      .replace(/\n/g, '<br />');

    const cleanHtml = html.replace(/\[\d+\]/g, '').replace(/ +/g, ' ');
    return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} className="leading-relaxed" />;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex w-full ${isAi ? 'justify-start' : 'justify-end'}`}
      >
        <div
          className={`relative group min-w-0 break-words p-5 px-7 text-[16px] leading-relaxed shadow-2xl backdrop-blur-md max-w-[85%] md:max-w-[75%] ${
            isAi
              ? 'liquid-glass text-white/90 rounded-3xl rounded-tl-sm border border-white/10'
              : 'bg-white text-black font-medium rounded-3xl rounded-tr-sm'
          }`}
        >
          {renderFormattedText(text)}

          {/* SAKINA Evidence & Grounding Status Row */}
          {hasEvidence && (
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'رد فيه مصادر' : 'Sources cited'}</span>
                </span>

                {retrieval?.evidence_strength && (
                  <span className="text-white/60 text-[11px] font-mono hidden sm:inline">
                    {lang === 'ar' ? 'القوة:' : 'Evidence:'}{' '}
                    <strong className="text-cyan-300">{retrieval.evidence_strength}</strong>
                  </span>
                )}

                <span className="text-white/40 text-[11px] font-mono hidden md:inline">
                  &bull; {sources.length} {lang === 'ar' ? 'مصادر' : 'sources'}
                </span>
              </div>

              {/* View Evidence Trigger */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="group/btn inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 border border-cyan-500/30 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                title={lang === 'ar' ? 'عرض الأدلة والمصادر الطبية بالتفصيل' : 'View verified evidence details'}
              >
                <FileText className="w-3 h-3" />
                <span>{lang === 'ar' ? 'عرض الأدلة' : 'View Evidence'}</span>
                <ChevronRight className={`w-3 h-3 transition-transform ${lang === 'ar' ? 'rotate-180 group-hover/btn:-translate-x-0.5' : 'group-hover/btn:translate-x-0.5'}`} />
              </button>
            </div>
          )}

          {/* Voice Speak Audio Toggle */}
          {isAi && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleToggleSpeak}
                title={isPlayingThis ? "Stop Voice" : "Listen to Response"}
                className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full transition-all border ${
                  isPlayingThis
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/40 animate-pulse'
                    : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border-white/5'
                }`}
              >
                {isPlayingThis ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-purple-400" />
                    <span>Stop Speaking</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'استمع للرد 🔊' : 'Listen 🔊'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Slide-over Evidence Panel */}
      {hasEvidence && (
        <EvidenceDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          sources={sources}
          retrieval={retrieval}
          safety={safety}
          lang={lang}
        />
      )}
    </>
  );
}
