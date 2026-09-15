import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Cpu, 
  FileText, 
  ArrowLeft, 
  Sparkles, 
  BarChart3, 
  Layers, 
  ExternalLink,
  Clock,
  Send,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface PipelineData {
  query: string;
  embedding: {
    model: string;
    dimension: number;
    vector_sample: number[];
  };
  safety: {
    level: string;
    signals: string[];
    action_required: string;
    is_crisis: boolean;
    latency_ms: number;
  };
  retrieval: {
    top_k: number;
    evidence_assessment: {
      evidence_strength: string;
      evidence_score: number;
      sufficient: boolean;
      top_score: number;
      avg_score: number;
      chunk_count: number;
      source_count: number;
      is_conversational: boolean;
      reason: string;
    };
    candidates: any[];
    latency_ms: number;
    reranking_enabled: boolean;
    reranking_status: string;
  };
  evidence_gate: {
    passed: boolean;
    strength: string;
    calibrated_score: number;
    reason: string;
    decision: string;
  };
  generation: {
    type: string;
    answer: string;
    cited_ranks: number[];
    latency_ms: number;
  };
  total_latency_ms: number;
}

interface EvalMetrics {
  evaluation_name: string;
  timestamp: string;
  dataset_size: number;
  embedding_model: string;
  vector_database: string;
  reranking_enabled: boolean;
  reranking_status: string;
  metrics: {
    mrr: number;
    recall_at_3: number;
    precision_at_3: number;
    recall_at_5: number;
    precision_at_5: number;
    recall_at_10: number;
    precision_at_10: number;
    avg_retrieval_latency_ms: number;
  };
  metric_definitions: Record<string, string>;
  per_query_results?: any[];
}

const DEFAULT_QUERY = 'ما هي أعراض الاكتئاب السريري وعلاجه؟';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function RAGInspectorPage() {
  const [activeTab, setActiveTab] = useState<'inspector' | 'evaluation'>('inspector');
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [evalMetrics, setEvalMetrics] = useState<EvalMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Curated Hackathon Demo Presets
  const demoPresets = [
    {
      label: 'Clinical Grounded (Depression)',
      query: 'ما هي أعراض الاكتئاب السريري وعلاجه المعتمد؟',
      type: 'grounded'
    },
    {
      label: 'Cross-Lingual (Arabic -> English PTSD)',
      query: 'كيف تؤثر الصدمة النفسية وفلاش باك الذكريات على النوم؟',
      type: 'cross-lingual'
    },
    {
      label: 'ADHD in Adults (English)',
      query: 'What are the main warning signs and coping strategies for adult ADHD?',
      type: 'english'
    },
    {
      label: 'Evidence Gate Refusal (Out of Scope)',
      query: 'كيف أقوم ببرمجة تطبيق جوال وإصلاح عطل محرك السيارة؟',
      type: 'refusal'
    },
    {
      label: 'Safety Crisis Override (Urgent)',
      query: 'حاسس باليأس الشديد ومش قادر أكمل وعايز انتحر',
      type: 'crisis'
    },
    {
      label: 'Conversational Greeting',
      query: 'ازيك يا سكينة، عاملة ايه النهاردة؟',
      type: 'greeting'
    }
  ];

  const runInspection = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryText })
      });

      if (!res.ok) throw new Error(`Inspector failed with status ${res.status}`);
      const data: PipelineData = await res.json();
      setPipelineData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to inspect pipeline');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadEvaluationMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rag/eval-metrics`);
      if (res.ok) {
        const data: EvalMetrics = await res.json();
        setEvalMetrics(data);
      }
    } catch (e) {
      console.error('Failed to load eval metrics:', e);
    }
  }, []);

  useEffect(() => {
    runInspection(DEFAULT_QUERY);
    loadEvaluationMetrics();
  }, [loadEvaluationMetrics, runInspection]);

  const getSafetyBadgeColor = (level: string) => {
    switch (level) {
      case 'CRISIS':
        return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
      case 'ELEVATED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'SUPPORTIVE_ATTENTION':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  const getEvidenceStrengthBadge = (strength: string) => {
    switch (strength) {
      case 'HIGH':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'LOW':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      default:
        return 'bg-red-500/20 text-red-300 border-red-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-950/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-indigo-950/15 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/chat"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all flex items-center gap-2 text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Chat</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white flex items-center gap-2">
                  <span>SAKINA EVIDENCE & SAFETY ENGINE</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    DEV / DEMO INSPECTOR
                  </span>
                </h1>
                <p className="text-xs text-white/50 font-mono">
                  Transparent, measurable runtime verification & clinical guardrails
                </p>
              </div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="liquid-glass rounded-full p-1 flex items-center border border-white/10">
            <button
              onClick={() => setActiveTab('inspector')}
              className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'inspector'
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Runtime Pipeline</span>
            </button>
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'evaluation'
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Benchmark Evaluation</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        {activeTab === 'inspector' ? (
          <>
            {/* Interactive Query Bar */}
            <section className="liquid-glass rounded-3xl p-6 border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-mono text-white/50 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Live Pipeline Tester</span>
                  </span>
                  {pipelineData && (
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>Total Latency: {pipelineData.total_latency_ms} ms</span>
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runInspection(query)}
                    placeholder="Ask any mental wellness question to inspect pipeline execution..."
                    className="flex-1 bg-black/50 border border-white/15 focus:border-cyan-400/60 rounded-2xl px-5 py-3 text-sm text-white placeholder-white/30 outline-none transition-all font-sans"
                  />
                  <button
                    onClick={() => runInspection(query)}
                    disabled={isLoading}
                    className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                  <span className="text-[11px] font-mono text-white/40 self-center mr-1">Demo Presets:</span>
                  {demoPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuery(preset.query);
                        runInspection(preset.query);
                      }}
                      className="px-3 py-1 rounded-full text-[11px] font-mono bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                {error}
              </div>
            )}

            {/* Pipeline Step-by-Step Flow */}
            {pipelineData && (
              <div className="space-y-6">
                {/* 7-Stage Visual Workflow Header */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs font-mono">
                  <div className={`liquid-glass rounded-xl p-3 border ${
                    pipelineData.safety.is_crisis ? 'border-red-500/50 bg-red-500/10' : 'border-emerald-500/30 bg-emerald-500/5'
                  }`}>
                    <span className="text-[10px] text-white/40 block">STAGE 1</span>
                    <span className={`font-semibold ${pipelineData.safety.is_crisis ? 'text-red-400' : 'text-emerald-300'}`}>
                      Safety Engine
                    </span>
                    <span className="text-[10px] text-white/50 block mt-1">
                      {pipelineData.safety.level}
                    </span>
                  </div>

                  <div className="liquid-glass rounded-xl p-3 border border-pink-500/30 bg-pink-500/5">
                    <span className="text-[10px] text-white/40 block">STAGE 2</span>
                    <span className="font-semibold text-pink-300">User Context</span>
                    <span className="text-[10px] text-white/50 block mt-1">Longitudinal Memory</span>
                  </div>

                  <div className="liquid-glass rounded-xl p-3 border border-white/10 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">STAGE 3</span>
                    <span className="font-semibold text-white">Retrieval</span>
                    <span className="text-[10px] text-white/50 block mt-1">
                      {pipelineData.retrieval.candidates.length} Chunks
                    </span>
                  </div>

                  <div className={`liquid-glass rounded-xl p-3 border ${
                    pipelineData.evidence_gate.passed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
                  }`}>
                    <span className="text-[10px] text-white/40 block">STAGE 4</span>
                    <span className={`font-semibold ${pipelineData.evidence_gate.passed ? 'text-emerald-300' : 'text-red-400'}`}>
                      Evidence Gate
                    </span>
                    <span className="text-[10px] text-white/50 block mt-1">
                      {pipelineData.evidence_gate.strength} ({pipelineData.evidence_gate.calibrated_score}/100)
                    </span>
                  </div>

                  <div className="liquid-glass rounded-xl p-3 border border-white/10 bg-white/[0.02]">
                    <span className="text-[10px] text-white/40 block">STAGE 5</span>
                    <span className="font-semibold text-white">Generation</span>
                    <span className="text-[10px] text-white/50 block mt-1">
                      {pipelineData.generation.latency_ms}ms
                    </span>
                  </div>

                  <div className="liquid-glass rounded-xl p-3 border border-cyan-500/30 bg-cyan-500/5">
                    <span className="text-[10px] text-white/40 block">STAGE 6</span>
                    <span className="font-semibold text-cyan-300">Citations</span>
                    <span className="text-[10px] text-white/50 block mt-1">
                      {pipelineData.generation.cited_ranks.length} Verified
                    </span>
                  </div>

                  <div className="liquid-glass rounded-xl p-3 border border-emerald-500/30 bg-emerald-500/5">
                    <span className="text-[10px] text-white/40 block">STAGE 7</span>
                    <span className="font-semibold text-emerald-400">Journey Sync</span>
                    <span className="text-[10px] text-white/50 block mt-1">
                      Pattern Reflection
                    </span>
                  </div>
                </div>

                {/* Stage Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Safety & Evidence Gate */}
                  <div className="space-y-6">
                    {/* Safety Engine Card */}
                    <div className="liquid-glass rounded-3xl p-6 border border-white/10 bg-white/[0.02] space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          <span>Safety Engine Status</span>
                        </h3>
                        <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getSafetyBadgeColor(pipelineData.safety.level)}`}>
                          {pipelineData.safety.level}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs font-mono text-white/70 bg-black/40 p-3.5 rounded-2xl border border-white/5">
                        <div className="flex justify-between">
                          <span className="text-white/40">Action Required:</span>
                          <span className="text-white font-semibold">{pipelineData.safety.action_required}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/40">Crisis Override:</span>
                          <span className={pipelineData.safety.is_crisis ? 'text-red-400 font-bold' : 'text-emerald-400 font-semibold'}>
                            {pipelineData.safety.is_crisis ? 'ACTIVE (Priority 1)' : 'False (Safe)'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/40">Check Latency:</span>
                          <span className="text-cyan-400">{pipelineData.safety.latency_ms} ms</span>
                        </div>
                      </div>

                      {pipelineData.safety.signals.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-mono text-white/40 block">Detected Signals:</span>
                          {pipelineData.safety.signals.map((sig, sIdx) => (
                            <div key={sIdx} className="text-[11px] font-mono text-red-300 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                              {sig}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Evidence Gate Card */}
                    <div className="liquid-glass rounded-3xl p-6 border border-white/10 bg-white/[0.02] space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          <span>Evidence Gate</span>
                        </h3>
                        <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getEvidenceStrengthBadge(pipelineData.evidence_gate.strength)}`}>
                          {pipelineData.evidence_gate.strength}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-white/40">Confidence Score:</span>
                          <span className="text-base font-bold text-white">
                            {pipelineData.evidence_gate.calibrated_score}/100
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
                          <div
                            className={`h-full transition-all duration-500 ${
                              pipelineData.evidence_gate.calibrated_score >= 60
                                ? 'bg-emerald-400'
                                : pipelineData.evidence_gate.calibrated_score >= 38
                                ? 'bg-amber-400'
                                : 'bg-red-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, pipelineData.evidence_gate.calibrated_score))}%` }}
                          />
                        </div>

                        <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-1.5 text-xs">
                          <div className="flex justify-between font-mono text-[11px]">
                            <span className="text-white/40">Decision:</span>
                            <span className={`font-semibold ${pipelineData.evidence_gate.passed ? 'text-emerald-300' : 'text-red-400'}`}>
                              {pipelineData.evidence_gate.decision}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                            {pipelineData.evidence_gate.reason}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Embedding Metadata Card */}
                    <div className="liquid-glass rounded-3xl p-6 border border-white/10 bg-white/[0.02] space-y-3 text-xs font-mono">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Database className="w-4 h-4 text-cyan-400" />
                        <span>Semantic Embedding</span>
                      </h3>
                      <div className="text-white/70 space-y-1.5 bg-black/40 p-3 rounded-2xl border border-white/5 text-[11px]">
                        <div>Model: <span className="text-cyan-300">{pipelineData.embedding.model}</span></div>
                        <div>Dimension: <span className="text-white font-semibold">{pipelineData.embedding.dimension}d</span></div>
                        <div>Reranking: <span className="text-amber-300">{pipelineData.retrieval.reranking_status}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Top-K Retrieved Evidence Candidates */}
                  <div className="space-y-4 lg:col-span-2">
                    <div className="liquid-glass rounded-3xl p-6 border border-white/10 bg-white/[0.02] space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <span>Retrieved Evidence Chunks ({pipelineData.retrieval.candidates.length})</span>
                        </h3>
                        <span className="text-xs font-mono text-white/40">
                          Latency: {pipelineData.retrieval.latency_ms} ms
                        </span>
                      </div>

                      {pipelineData.retrieval.candidates.length === 0 ? (
                        <div className="py-12 text-center text-white/40 text-xs font-mono">
                          No relevant candidate chunks passed the retrieval threshold.
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {pipelineData.retrieval.candidates.map((c, cIdx) => (
                            <div
                              key={c.chunk_id || cIdx}
                              className="liquid-glass rounded-2xl p-4 border border-white/10 bg-black/30 hover:border-cyan-500/30 transition-all space-y-2.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                                    #{c.rank}
                                  </span>
                                  <span className="font-semibold text-white">{c.document_title || c.document}</span>
                                  <span className="text-white/40 font-mono text-[11px]">Page {c.page}</span>
                                </div>

                                <div className="flex items-center gap-2 font-mono text-xs">
                                  <span className="text-white/40">Cosine:</span>
                                  <span className="text-cyan-300 font-bold">{c.raw_score}</span>
                                  <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
                                    {c.qualitative_relevance} ({c.normalized_relevance}%)
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-white/70 leading-relaxed italic bg-black/50 p-3 rounded-xl border border-white/5">
                                "{c.excerpt || c.text?.slice(0, 180)}..."
                              </p>

                              <div className="flex items-center justify-between text-[11px] font-mono text-white/40 pt-1">
                                <span>Chunk ID: {c.chunk_id?.slice(0, 18)}...</span>
                                <a
                                  href={`/pdfs/${c.document}#page=${c.page}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-sans"
                                >
                                  <span>View PDF Page</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Final Output Preview */}
                    <div className="liquid-glass rounded-3xl p-6 border border-white/10 bg-white/[0.02] space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span>Final Grounded Response & Verified Citations</span>
                        </h3>
                        <span className="text-xs font-mono text-white/40">
                          Gen: {pipelineData.generation.latency_ms} ms
                        </span>
                      </div>

                      <div className="p-5 rounded-2xl bg-black/50 border border-white/10 text-sm leading-relaxed text-white/90 whitespace-pre-line font-sans">
                        {pipelineData.generation.answer}
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono text-white/50 pt-1">
                        <span>Generation Type: <strong className="text-cyan-300">{pipelineData.generation.type}</strong></span>
                        <span>Validated Citations: <strong className="text-emerald-400">{pipelineData.generation.cited_ranks.join(', ') || 'None required'}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ================= BENCHMARK EVALUATION VIEW ================= */
          <section className="space-y-8">
            <div className="liquid-glass rounded-3xl p-6 md:p-8 border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    <span>Clinical Retrieval Benchmark Results</span>
                  </h2>
                  <p className="text-xs text-white/50 font-mono mt-1">
                    Evaluated against curated ground-truth queries across all 11 NIH/NIMH clinical documents
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs font-mono">
                    <span className="text-white/40 block">Dataset Size:</span>
                    <span className="text-white font-bold">{evalMetrics?.dataset_size || 20} Questions</span>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div className="text-right text-xs font-mono">
                    <span className="text-white/40 block">Vector Chunks:</span>
                    <span className="text-cyan-300 font-bold">267 Clinical Chunks</span>
                  </div>
                </div>
              </div>

              {evalMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* MRR */}
                  <div className="liquid-glass rounded-2xl p-5 border border-cyan-500/30 bg-cyan-500/5 space-y-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block">
                      Mean Reciprocal Rank (MRR)
                    </span>
                    <div className="text-2xl font-bold font-mono text-cyan-300">
                      {evalMetrics.metrics.mrr.toFixed(4)}
                    </div>
                    <span className="text-[10px] text-white/50 font-mono">Average 1/rank score</span>
                  </div>

                  {/* Recall@3 */}
                  <div className="liquid-glass rounded-2xl p-5 border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block">
                      Recall@3
                    </span>
                    <div className="text-2xl font-bold font-mono text-emerald-400">
                      {(evalMetrics.metrics.recall_at_3 * 100).toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-white/50 font-mono">Hit in Top-3 candidates</span>
                  </div>

                  {/* Precision@3 */}
                  <div className="liquid-glass rounded-2xl p-5 border border-white/10 bg-white/[0.02] space-y-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block">
                      Precision@3
                    </span>
                    <div className="text-2xl font-bold font-mono text-white">
                      {(evalMetrics.metrics.precision_at_3 * 100).toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-white/50 font-mono">Top-3 topic purity</span>
                  </div>

                  {/* Latency */}
                  <div className="liquid-glass rounded-2xl p-5 border border-white/10 bg-white/[0.02] space-y-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block">
                      Avg Retrieval Latency
                    </span>
                    <div className="text-2xl font-bold font-mono text-white">
                      {evalMetrics.metrics.avg_retrieval_latency_ms} ms
                    </div>
                    <span className="text-[10px] text-white/50 font-mono">End-to-end vector search</span>
                  </div>
                </div>
              )}

              {/* Extended Metrics Table */}
              {evalMetrics && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Evaluation Matrix Across Candidates (K)
                  </h3>

                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="border-b border-white/10 bg-white/5 text-white/50">
                        <tr>
                          <th className="p-3.5">Candidate Depth (K)</th>
                          <th className="p-3.5">Recall@K</th>
                          <th className="p-3.5">Precision@K</th>
                          <th className="p-3.5">Clinical Relevance</th>
                          <th className="p-3.5">Reranking State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr className="hover:bg-white/[0.02]">
                          <td className="p-3.5 font-bold text-cyan-300">K = 3</td>
                          <td className="p-3.5 text-emerald-400 font-bold">{(evalMetrics.metrics.recall_at_3 * 100).toFixed(1)}%</td>
                          <td className="p-3.5 text-white font-semibold">{(evalMetrics.metrics.precision_at_3 * 100).toFixed(1)}%</td>
                          <td className="p-3.5 text-white/70">Top Diagnostic Fit</td>
                          <td className="p-3.5 text-amber-300">{evalMetrics.reranking_status}</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="p-3.5 font-bold text-cyan-300">K = 5</td>
                          <td className="p-3.5 text-emerald-400 font-bold">{(evalMetrics.metrics.recall_at_5 * 100).toFixed(1)}%</td>
                          <td className="p-3.5 text-white font-semibold">{(evalMetrics.metrics.precision_at_5 * 100).toFixed(1)}%</td>
                          <td className="p-3.5 text-white/70">Broad Guideline Coverage</td>
                          <td className="p-3.5 text-amber-300">{evalMetrics.reranking_status}</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="p-3.5 font-bold text-cyan-300">K = 10</td>
                          <td className="p-3.5 text-emerald-400 font-bold">{(evalMetrics.metrics.recall_at_10 * 100).toFixed(1)}%</td>
                          <td className="p-3.5 text-white font-semibold">{(evalMetrics.metrics.precision_at_10 * 100).toFixed(1)}%</td>
                          <td className="p-3.5 text-white/70">Candidate Ingestion Pool</td>
                          <td className="p-3.5 text-amber-300">{evalMetrics.reranking_status}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Per-Query Breakdown */}
              {evalMetrics?.per_query_results && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Per-Query Ground-Truth Verification ({evalMetrics.per_query_results.length})
                  </h3>

                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                    {evalMetrics.per_query_results.map((qItem: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-mono hover:border-white/20 transition-all"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <span className="text-white/30 text-[11px]">#{idx + 1}</span>
                          <span className="text-white font-sans truncate max-w-[320px] md:max-w-[480px]">
                            {qItem.query}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 text-[11px]">
                          <span className="text-cyan-400 font-semibold">{qItem.expected_document}</span>
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Rank #{qItem.first_rank ?? 'Miss'}
                          </span>
                          <span className="text-white/40 hidden sm:inline">{qItem.latency_ms}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
