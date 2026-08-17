import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import TiltCard from './TiltCard';
import BackgroundVideo from './BackgroundVideo';
import { useLanguage } from '../context/LanguageContext';

export default function ServicesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  const cards = [
    {
      tag: t('reflection'),
      title: t('journaling'),
      description: t('journalDesc'),
      videoUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
    },
    {
      tag: t('support'),
      title: t('wellnessComp'),
      description: t('wellnessDesc'),
      videoUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4"
    }
  ];

  return (
    <section ref={ref} className="bg-black py-28 md:py-40 px-6 overflow-hidden flex justify-center relative">
      {/* Subtle radial gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[800px] bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02)_0%,_transparent_60%)] pointer-events-none"></div>

      <div className="w-full max-w-6xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7 }}
          className="flex justify-between items-end mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl text-white tracking-tight">{t('whatSakinaDoes')}</h2>
          <span className="text-white/40 text-sm hidden md:block uppercase tracking-widest">{t('featuresLabel')}</span>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {cards.map((card, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8, delay: 0.15 * (index + 1) }}
            >
              <TiltCard className="liquid-glass rounded-3xl overflow-hidden group flex flex-col h-full">
                <div className="aspect-video relative overflow-hidden">
                  <BackgroundVideo
                    src={card.videoUrl}
                    wrapperClassName="w-full h-full"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
                </div>
                
                <div className="p-6 md:p-8 flex-1 flex flex-col pointer-events-none">
                  <div className="flex justify-between items-start mb-6">
                    <span className="uppercase tracking-widest text-white/40 text-xs font-semibold">
                      {card.tag}
                    </span>
                    <div className="liquid-glass rounded-full p-2">
                      <ArrowUpRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-white text-xl md:text-2xl mb-3 tracking-tight mt-auto">
                    {card.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
