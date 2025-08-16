import React from 'react';

interface IconProps {
  className?: string;
}

const LogoIcon: React.FC<IconProps> = ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path>
      <path d="M12 16c-3.87 0-7-3.13-7-7 0-1.12.27-2.18.75-3.13C9.03 8.37 12 11 12 11s2.97-2.63 6.25-5.13c.48.95.75 2.01.75 3.13 0 3.87-3.13 7-7 7z"></path>
    </svg>
);

export default LogoIcon;
