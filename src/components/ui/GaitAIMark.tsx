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
      <path
        d="M4.75 21.25C6.1 12.2 11.15 7.25 17.45 7.4C23.55 7.55 26.85 11.55 25.15 16.05C23.8 19.55 19.5 20.75 15.8 18.55C12.6 16.65 10.75 18.85 12.35 22.25C14.35 26.45 20.55 26.65 26.3 22.8"
        stroke="#51D6FF"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="4.75" cy="21.25" r="1.9" fill="#51D6FF" />
      <circle cx="17.45" cy="7.4" r="1.8" fill="#68B9FF" />
      <circle cx="25.15" cy="16.05" r="1.85" fill="#7187FF" />
      <circle cx="12.35" cy="22.25" r="1.65" fill="#51D6FF" />
      <circle cx="26.3" cy="22.8" r="1.9" fill="#7187FF" />
    </svg>
  );
}
