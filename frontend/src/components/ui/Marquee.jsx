import { useRef, useState } from 'react';

/**
 * Editorial logo/text marquee.
 * Uses CSS animation — pauseOnHover now actually works.
 */
const Marquee = ({
  children,
  speed = 30,
  pauseOnHover = true,
  className = '',
  gradientWidth = 64,
}) => {
  const duration = Math.max(20, 300 / speed); // longer duration for slower speed

  return (
    <div className={`relative overflow-hidden marquee-wrap ${className}`}>
      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll ${duration}s linear infinite;
        }
        ${pauseOnHover ? '.marquee-wrap:hover .marquee-track { animation-play-state: paused; }' : ''}
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; flex-wrap: wrap; justify-content: center; }
        }
      `}</style>

      {gradientWidth > 0 && (
        <>
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, var(--paper), transparent)',
              width: gradientWidth,
            }}
          />
          <div
            aria-hidden
            className="absolute inset-y-0 right-0 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(to left, var(--paper), transparent)',
              width: gradientWidth,
            }}
          />
        </>
      )}

      <div className="marquee-track flex gap-6 sm:gap-8 md:gap-14 w-max items-center">
        <div className="flex gap-6 sm:gap-8 md:gap-14 shrink-0 items-center">{children}</div>
        <div className="flex gap-6 sm:gap-8 md:gap-14 shrink-0 items-center" aria-hidden="true">{children}</div>
        {/* Third copy for narrow mobile so the loop never runs out */}
        <div className="flex gap-6 sm:gap-8 md:gap-14 shrink-0 items-center md:hidden" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
};

export const MarqueeItem = ({ children, className = '' }) => (
  <div className={`flex items-center justify-center shrink-0 ${className}`}>
    {children}
  </div>
);

export default Marquee;
