import React from 'react';

interface UsdtIconProps {
  className?: string;
  colored?: boolean;
}

export function UsdtIcon({ className = 'h-4 w-4', colored = true }: UsdtIconProps) {
  if (colored) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="USDT Tether"
      >
        <circle cx="12" cy="12" r="11" fill="#26A17B" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.2 8.4V7h3.6V5.4H7.2V7h3.6v1.4C7.7 8.6 5.5 9.3 5.5 10.2c0 .9 2.2 1.6 5.3 1.8v5.5h2.4V12c3.1-.2 5.3-.9 5.3-1.8 0-.9-2.2-1.6-5.3-1.8zm-1.2 2.6c-2.3 0-4.2-.4-4.2-.9s1.9-.9 4.2-.9 4.2.4 4.2.9-1.9.9-4.2.9z"
          fill="white"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="USDT Tether"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.2 8.4V7h3.6V5.4H7.2V7h3.6v1.4C7.7 8.6 5.5 9.3 5.5 10.2c0 .9 2.2 1.6 5.3 1.8v5.5h2.4V12c3.1-.2 5.3-.9 5.3-1.8 0-.9-2.2-1.6-5.3-1.8zm-1.2 2.6c-2.3 0-4.2-.4-4.2-.9s1.9-.9 4.2-.9 4.2.4 4.2.9-1.9.9-4.2.9z"
      />
    </svg>
  );
}
