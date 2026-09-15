import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import type { EvidenceSource, RetrievalMetadata, SafetyMetadata } from '../../services/aiService';

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sources: EvidenceSource[];
  retrieval?: RetrievalMetadata;
  safety?: SafetyMetadata;
  lang?: 'en' | 'ar';
}

export default function EvidenceDrawer({
  isOpen,
  onClose,
  sources = [],
  retrieval,
  safety,
  lang = 'ar'
}: EvidenceDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', close);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', close); document.body.style.overflow = previous; };
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  const strengthColor = () => {
    switch (retrieval?.evidence_strength) {
      case 'HIGH':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'MODERATE':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'LOW':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      default:
        return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/30';
    }
  };

  const qualitativeBadge = (qual?: string) => {
    switch (qual) {
      case 'VERY HIGH':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'HIGH':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
        />

        {/* Slide-over Drawer */}
        <motion.aside role="dialog" aria-modal="true" aria-label={lang === 'ar' ? 'مصادر الرد' : 'Response sources'} dir={lang === 'ar' ? 'rtl' : 'ltr'}
          initial={{ x: lang === 'ar' ? '-100%' : '100%' }}
          animate={{ x: 0 }}
          exit={{ x: lang === 'ar' ? '-100%' : '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className={`relative z-10 w-full max-w-md md:max-w-lg bg-neutral-950/95 border-l border-white/10 shadow-2xl h-full overflow-y-auto flex flex-col backdrop-blur-2xl text-white ${
            lang === 'ar' ? 'border-r border-l-0 text-right' : 'text-left'
          }`}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{lang === 'ar' ? 'مصادر الرد' : 'Evidence & Safety Engine'}</span>
                </h2>
                <p className="text-xs text-white/50 font-mono">
                  {lang === 'ar' ? 'شوف المصادر اللي الرد استند ليها' : 'Sources cited in this response'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Assessment Summary Cards */}
          <div className="p-6 space-y-4 border-b border-white/5 bg-black/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Retrieval similarity */}
              <div className="liquid-glass rounded-2xl p-4 border border-white/10 bg-white/[0.02]">
                <span className="text-[11px] uppercase tracking-wider font-mono text-white/40 block mb-1">
                  {lang === 'ar' ? 'درجة تشابه النصوص' : 'Retrieval similarity'}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full border ${strengthColor()}`}>
                    {retrieval?.evidence_strength || 'UNKNOWN'}
                  </span>
                  {retrieval?.evidence_score !== undefined && (
                    <span className="text-xs text-white/60 font-mono">
                      {retrieval.evidence_score}/100
                    </span>
                  )}
                </div>
              </div>

              {/* Safety Level */}
              <div className="liquid-glass rounded-2xl p-4 border border-white/10 bg-white/[0.02]">
                <span className="text-[11px] uppercase tracking-wider font-mono text-white/40 block mb-1">
                  {lang === 'ar' ? 'فحص الأمان النفسي' : 'Safety Check'}
                </span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-300 font-mono">
                    {safety?.level || (lang === 'ar' ? 'مش متاح' : 'Not available')}
                  </span>
                </div>
              </div>
            </div>

            {/* Retrieval Reason */}
            {retrieval?.reason && (
              <p className="text-xs text-white/60 leading-relaxed font-sans bg-white/[0.02] p-3 rounded-xl border border-white/5">
                <span className="text-cyan-400 font-semibold">{lang === 'ar' ? 'ملاحظة الفحص: ' : 'Verification: '}</span>
                {retrieval.reason}
              </p>
            )}
          </div>

          {/* Sources List */}
          <div className="p-6 space-y-4 custom-scrollbar">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-mono text-white/40">
                {lang === 'ar' ? `المصادر المسترجعة (${sources.length})` : `Retrieved Sources (${sources.length})`}
              </span>
              <span className="text-[10px] text-white/30 font-mono"></span>
            </div>

            {sources.length === 0 ? (
              <div className="text-center py-12 text-white/40 text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <span>{lang === 'ar' ? 'مفيش مصادر للرسالة دي' : 'No sources attached to this message'}</span>
              </div>
            ) : (
              sources.map((src, idx) => {
                const pdfUrl = `${import.meta.env.VITE_API_URL || ""}/pdfs/${encodeURIComponent(src.document || src.source || "")}`;
                return (
                  <motion.div
                    key={src.chunk_id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="liquid-glass rounded-2xl p-4 border border-white/10 bg-white/[0.02] hover:border-cyan-500/30 transition-all group"
                  >
                    {/* Source Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                          #{src.rank || idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                            {src.document_title || src.document || src.source}
                          </h4>
                          <span className="text-[11px] font-mono text-white/40 block">
                            {src.document || src.source} &bull; {lang === 'ar' ? `صفحة ${src.page}` : `Page ${src.page}`}
                          </span>
                        </div>
                      </div>

                      {/* Relevance Badge */}
                      {src.qualitative_relevance && (
                        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border shrink-0 ${qualitativeBadge(src.qualitative_relevance)}`}>
                          {src.qualitative_relevance}
                          {src.normalized_relevance !== undefined ? ` (${src.normalized_relevance}%)` : ''}
                        </span>
                      )}
                    </div>

                    {/* Excerpt */}
                    {src.excerpt && (
                      <div className="my-2.5 p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-white/70 leading-relaxed italic">
                        "{src.excerpt}"
                      </div>
                    )}

                    {/* Footer with Raw Metrics & Document Link */}
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/40">
                      <span>
                        Cosine Sim: <span className="text-white/70 font-semibold">{src.raw_score?.toFixed(4) ?? 'N/A'}</span>
                      </span>

                      <a
                        href={`${pdfUrl}#page=${src.page}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors font-sans font-medium"
                      >
                        <span>{lang === 'ar' ? 'عرض الوثيقة الأصلية' : 'View Source PDF'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer Notice */}
          <div className="p-4 border-t border-white/10 bg-black/40 text-center">
            <p className="text-[10px] text-white/40 font-mono leading-tight">
              {lang === 'ar' 
                ? 'درجة التشابه مش ضمان لصحة المعلومة. سكينة مش بديل للدكتور.'
                : 'Similarity scores measure text relevance, not medical accuracy. Sakina does not replace a clinician.'}
            </p>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>, document.body
  );
}
