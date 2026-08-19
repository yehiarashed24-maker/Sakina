import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import TiltCard from './TiltCard';
import BackgroundVideo from './BackgroundVideo';
import { useLanguage } from '../context/LanguageContext';

const philosophyVideo = '/videos/philosophy-compressed.mp4';

export default function PhilosophySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t, lang } = useLanguage();

  return (
    <section ref={ref} className="bg-black py-28 md:py-40 px-6 overflow-hidden flex justify-center">
      <div className="w-full max-w-6xl">
        <motion.h2 
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className={`flex items-center justify-center md:justify-start gap-3 md:gap-4 text-4xl md:text-5xl lg:text-6xl text-white tracking-tight mb-16 md:mb-24 ${lang === 'en' ? '' : 'font-semibold'}`}
        >
          <span>{t('philTitle1')}</span>
          <em className={`italic text-white/40 leading-none -translate-y-1 md:-translate-y-2 ${lang === 'en' ? 'font-instrument' : ''}`}>x</em>
          <span>{t('philTitle2')}</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 lg:gap-32 items-center">
          {/* Left: Video */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="rounded-3xl overflow-hidden aspect-[4/3] scale-95 md:scale-100"
          >
            <TiltCard className="w-full h-full">
              <div className="w-full h-full relative overflow-hidden rounded-3xl">
                <BackgroundVideo
                  src={philosophyVideo}
                  wrapperClassName="w-full h-full"
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
            </TiltCard>
          </motion.div>

          {/* Right: Text blocks */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col"
          >
            {/* Block 1 */}
            <div className="pb-6">
              <div className="text-white/40 text-xs tracking-widest uppercase mb-3">{t('emoUnder')}</div>
              <p className="text-white/70 text-base md:text-lg leading-relaxed">
                {t('emoDesc')}
              </p>
            </div>
            
            <div className="w-full h-px bg-white/10 my-2"></div>
            
            {/* Block 2 */}
            <div className="pt-6">
              <div className="text-white/40 text-xs tracking-widest uppercase mb-3">{t('knowAi')}</div>
              <p className="text-white/70 text-base md:text-lg leading-relaxed">
                {t('knowDesc')}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
