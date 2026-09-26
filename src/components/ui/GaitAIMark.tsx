import type { SVGProps } from "react";

export function GaitAIMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
      shapeRendering="geometricPrecision"
      {...props}
    >
      <defs>
        <linearGradient
          id="gaitai-motion-path"
          x1="4.5"
          y1="22.5"
          x2="27.5"
          y2="9.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#51D6FF" />
          <stop offset="1" stopColor="#7187FF" />
        </linearGradient>
      </defs>
      <path
        d="M4.5 22.5C8.2 22.3 9 13.5 13 12C16.2 10.8 18.2 17.2 21 14C23.7 10.9 24.1 7.5 27.5 9.5"
        stroke="url(#gaitai-motion-path)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="4.5" cy="22.5" r="2" fill="#51D6FF" />
      <circle cx="13" cy="12" r="1.85" fill="#62C3FF" />
      <circle cx="21" cy="14" r="1.85" fill="#699FFF" />
      <circle cx="27.5" cy="9.5" r="2" fill="#7187FF" />
    </svg>
  );
}
