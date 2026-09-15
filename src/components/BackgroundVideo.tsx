import { useEffect, useRef, useState } from 'react';

interface BackgroundVideoProps {
  src: string;
  className?: string;
  wrapperClassName?: string;
}

const pendingVideos = new Set<HTMLVideoElement>();
let globalUnlockSetup = false;

function setupGlobalUnlock() {
  if (globalUnlockSetup) return;
  globalUnlockSetup = true;
  const tryAll = () => {
    pendingVideos.forEach(v => {
      if (v.paused) {
        v.play().catch(() => { });
      }
    });
  };
  ['touchstart', 'click', 'scroll', 'mousemove', 'keydown'].forEach(ev => {
    window.addEventListener(ev, tryAll, { passive: true });
  });
}

export default function BackgroundVideo({ src, className = "", wrapperClassName = "" }: BackgroundVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);

  // Lazy-load videos using IntersectionObserver so offscreen videos don't consume bandwidth
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          setIsInView(entry.isIntersecting);
          const video = videoRef.current;
          if (!video) return;

          if (entry.isIntersecting) {
            video.play().catch(() => {
              pendingVideos.add(video);
            });
          } else {
            video.pause();
          }
        });
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(el);
    setupGlobalUnlock();
    const video = videoRef.current;

    return () => {
      observer.disconnect();
      if (video) {
        pendingVideos.delete(video);
      }
    };
  }, []);

  const isAbsolute = className.includes('absolute') || className.includes('inset-0');

  return (
    <div
      ref={containerRef}
      className={wrapperClassName || (isAbsolute ? 'absolute inset-0' : 'relative w-full h-full')}
      style={{ overflow: 'hidden' }}
    >
      <video
        ref={videoRef}
        src={isInView ? src : undefined}
        className={`w-full h-full object-cover pointer-events-none transition-opacity duration-700 ${isInView ? 'opacity-100' : 'opacity-0'} ${className}`}
        controls={false}
        muted
        autoPlay
        playsInline
        loop
        preload="metadata"
        disablePictureInPicture
        disableRemotePlayback
      />
    </div>
  );
}
