import React from 'react';

interface BrandLogoProps {
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 34 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="ksShieldGrad" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="55%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#8B7CFF" />
        </linearGradient>
        <linearGradient id="ksShieldInner" x1="20" y1="9" x2="20" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(34,211,238,0.34)" />
          <stop offset="100%" stopColor="rgba(15,23,42,0.75)" />
        </linearGradient>
      </defs>
      <path
        d="M20 3.5L33 8.8V19.2C33 27.3 27.4 33.8 20 36.5C12.6 33.8 7 27.3 7 19.2V8.8L20 3.5Z"
        fill="url(#ksShieldInner)"
        stroke="url(#ksShieldGrad)"
        strokeWidth="1.8"
      />
      <path
        d="M20 9.5L27.5 12.6V19.1C27.5 24 24.3 28 20 29.8C15.7 28 12.5 24 12.5 19.1V12.6L20 9.5Z"
        stroke="rgba(186, 230, 253, 0.55)"
        strokeWidth="1.1"
      />
      <circle cx="20" cy="18.5" r="2.6" fill="#22D3EE" />
      <path d="M20 21.1V24.8" stroke="#E0F2FE" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
};
