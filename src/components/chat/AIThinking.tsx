import { motion } from 'framer-motion';

const steps = [
  "Understanding emotions...",
  "Searching psychological knowledge...",
  "Retrieving trusted context...",
  "Generating supportive response..."
];

export default function AIThinking({ activeStep }: { activeStep: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="liquid-glass rounded-3xl rounded-tl-sm p-6 border border-white/5 max-w-[85%] shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 rounded-full border-2 border-purple-500/30 border-t-purple-400"
        />
        <span className="text-xs tracking-widest uppercase text-purple-400 font-mono">
          RAG Process Active
        </span>
      </div>
      
      <div className="flex flex-col gap-4">
        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          const isPast = idx < activeStep;
          
          return (
            <div key={idx} className="flex items-center gap-4">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-500 ${
                isActive ? 'bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(192,132,252,0.8)]' : 
                isPast ? 'bg-white/40' : 'bg-white/10'
              }`} />
              <span className={`text-sm font-medium transition-colors duration-500 ${
                isActive ? 'text-white' : 
                isPast ? 'text-white/40' : 'text-white/20'
              }`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
