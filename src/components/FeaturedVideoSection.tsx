import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import BackgroundVideo from './BackgroundVideo';
import { useLanguage } from '../context/LanguageContext';

export default function FeaturedVideoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  return (
    <section className="bg-black pt-6 md:pt-10 pb-20 md:pb-32 px-6 overflow-hidden flex justify-center">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
        transition={{ duration: 0.9 }}
        className="w-full max-w-6xl rounded-3xl overflow-hidden aspect-video relative [perspective:1000px]"
      >
        <BackgroundVideo
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4"
          wrapperClassName="absolute inset-0"
          className="w-full h-full object-cover"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

        {/* Bottom overlay content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="liquid-glass rounded-2xl p-6 md:p-8 max-w-md w-full md:w-auto">
            <div className="text-white/50 text-xs tracking-widest uppercase mb-3">{t('howWorks')}</div>
            <p className="text-white text-sm md:text-base leading-relaxed">
              {t('ragDesc')}
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
