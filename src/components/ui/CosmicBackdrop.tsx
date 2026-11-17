import React from 'react';

interface CosmicBackdropProps {
  glassIntensity: 'subtle' | 'balanced' | 'deep';
}

export const CosmicBackdrop: React.FC<CosmicBackdropProps> = ({ glassIntensity }) => {
  const glowOpacity =
    glassIntensity === 'deep' ? 'opacity-90' : glassIntensity === 'subtle' ? 'opacity-45' : 'opacity-70';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#070B16]"
    >
      {/* Deep radial atmospheric depth matching cosmic reference */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${glowOpacity}`}
        style={{
          background:
            'radial-gradient(62% 52% at 18% 14%, rgba(34, 211, 238, 0.14) 0%, rgba(7, 11, 22, 0) 68%), ' +
            'radial-gradient(56% 50% at 84% 20%, rgba(139, 124, 255, 0.13) 0%, rgba(7, 11, 22, 0) 70%), ' +
            'radial-gradient(50% 45% at 55% 88%, rgba(96, 165, 250, 0.11) 0%, rgba(7, 11, 22, 0) 72%)',
        }}
      />

      {/* Luminous orbital arc inspired by reference visual halo */}
      <svg
        className="absolute -top-24 -left-16 h-[120vh] w-[115vw] opacity-35"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="ksOrbitalArc" x1="120" y1="780" x2="1320" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.05" />
            <stop offset="35%" stopColor="#22D3EE" stopOpacity="0.65" />
            <stop offset="68%" stopColor="#60A5FA" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#8B7CFF" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <ellipse
          cx="730"
          cy="470"
          rx="620"
          ry="270"
          transform="rotate(-14 730 470)"
          stroke="url(#ksOrbitalArc)"
          strokeWidth="2.2"
        />
        <ellipse
          cx="710"
          cy="490"
          rx="540"
          ry="210"
          transform="rotate(9 710 490)"
          stroke="rgba(96, 165, 250, 0.14)"
          strokeWidth="1"
        />
      </svg>

      {/* Subtle layered geometric depth panels peeking behind workspace */}
      <div className="absolute top-12 left-6 h-48 w-64 -rotate-3 rounded-3xl border border-cyan-300/10 bg-[#0D1A30]/40" />
      <div className="absolute right-8 bottom-10 h-52 w-72 rotate-2 rounded-3xl border border-indigo-300/10 bg-[#0D162B]/45" />

      {/* Subtle atmospheric micro-noise texture */}
      <div
        className="absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(226, 232, 240, 0.9) 0.7px, transparent 0.7px)',
          backgroundSize: '36px 36px',
        }}
      />
    </div>
  );
};
