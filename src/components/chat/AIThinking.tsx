import { motion } from 'framer-motion';

export default function AIThinking({ activeStep }: { activeStep?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-3 px-5 py-3.5 liquid-glass rounded-3xl rounded-tl-sm w-fit border border-white/5 shadow-xl"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="w-4 h-4 rounded-full border-2 border-purple-500/30 border-t-purple-400 shrink-0"
      />
      <span className="text-sm font-medium text-white/80">
        Sakina AI is thinking
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          ...
        </motion.span>
      </span>
    </motion.div>
  );
}

