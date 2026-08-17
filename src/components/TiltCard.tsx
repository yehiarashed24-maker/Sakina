import React from 'react';
import { motion } from 'framer-motion';

export default function TiltCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  // Randomize start values slightly for organic feel when multiple cards are present
  const randomDelay = Math.random() * 2;
  
  return (
    <motion.div
      animate={{
        rotateX: [3, -3, 3],
        rotateY: [-3, 3, -3],
        y: [0, -10, 0]
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: randomDelay
      }}
      style={{
        transformStyle: "preserve-3d",
      }}
      className={`relative [perspective:1000px] ${className}`}
    >
      <div style={{ transform: "translateZ(30px)", width: "100%", height: "100%" }}>
        {children}
      </div>
    </motion.div>
  );
}
