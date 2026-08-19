import { useEffect, useRef } from 'react';

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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = true;

    const tryPlay = () => {
      video.play().catch(() => {
        pendingVideos.add(video);
      });
    };

    tryPlay();
    setupGlobalUnlock();

    return () => {
      pendingVideos.delete(video);
    };
  }, [src]);

  const isAbsolute = className.includes('absolute') || className.includes('inset-0');

  return (
    <div className={wrapperClassName || (isAbsolute ? 'absolute inset-0' : 'relative w-full h-full')} style={{ overflow: 'hidden' }}>
      <video
        ref={videoRef}
        src={src}
        className={`w-full h-full object-cover pointer-events-none ${className}`}
        controls={false}
        muted
        autoPlay
        playsInline
        loop
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
      />
    </div>
  );
}
