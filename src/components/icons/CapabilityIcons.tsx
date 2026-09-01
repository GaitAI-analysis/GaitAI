import type { SVGProps } from "react";

/**
 * Custom motion-analysis pictograms for the homepage "Featured capabilities"
 * lists (Verticals.tsx). Each icon is a compact 24×24 line-art figure drawn
 * with currentColor so it inherits the vertical's teal/cyan (MobilityCare) or
 * blue/violet (SecureVision) accent from its container.
 *
 * The `group-hover/capability:` classes hook into the `group/capability`
 * wrapper on each capability row — hover/focus produces an extremely subtle
 * micro-animation (a dash progression, a brightening boundary); nothing
 * animates continuously.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Side-view walking figure with joint markers and a heel-strike gait arc. */
export function WalkScanIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12.2" cy="3.6" r="1.7" />
      <path d="M12 5.5 L11.4 11.6" />
      <path d="M11.9 6.8 L14.6 9.6 M11.9 6.8 L9.2 9.4" />
      <path d="M11.4 11.6 L14.4 14.8 L15.6 19.2" />
      <path d="M11.4 11.6 L9 15 L6.4 18.6" />
      <circle cx="11.4" cy="11.6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14.4" cy="14.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15" r="0.9" fill="currentColor" stroke="none" />
      <path
        d="M5.5 21.2 C8.5 17.8, 13 17.8, 16.4 21.2"
        strokeWidth={1.2}
        strokeDasharray="1.6 2.2"
        className="opacity-60 transition-all duration-500 [stroke-dashoffset:7.6] group-hover/capability:opacity-90 group-hover/capability:[stroke-dashoffset:0]"
      />
      <circle
        cx="16.4"
        cy="21.2"
        r="0.8"
        fill="currentColor"
        stroke="none"
        className="opacity-70 transition-opacity duration-500 group-hover/capability:opacity-100"
      />
    </svg>
  );
}

/** Figure leaning past a dashed vertical balance reference above ground. */
export function FallRiskIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M9.2 3.2 V20.6"
        strokeWidth={1.1}
        strokeDasharray="1.6 2.2"
        className="opacity-60 transition-opacity duration-500 group-hover/capability:opacity-90"
      />
      <circle cx="15.9" cy="5.8" r="1.7" />
      <path d="M15.3 7.4 L12 13.1" />
      <path d="M14.4 9 L17.9 11.3 M14.4 9 L11.2 7.9" />
      <path d="M12 13.1 L11.1 16.9 L10.9 20.4" />
      <path d="M12 13.1 L15.3 15.4 L17.7 18.4" />
      <circle cx="12" cy="13.1" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="11.1" cy="16.9" r="0.9" fill="currentColor" stroke="none" />
      <path d="M4.5 20.9 H19.5" className="opacity-50" />
    </svg>
  );
}

/** Walking figure with an ascending session-to-session progress trace. */
export function RehabTrackIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="16.6" cy="5" r="1.7" />
      <path d="M16.4 6.8 L16 12" />
      <path d="M16.2 8.1 L18.5 10.4 M16.2 8.1 L13.9 10.2" />
      <path d="M16 12 L18 15.3 L18.7 19" />
      <path d="M16 12 L14.1 15.2 L12.5 18.3" />
      <circle cx="16" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <path
        d="M3 19.8 C6.6 19.4, 8.6 16.4, 10.9 12.9"
        strokeWidth={1.2}
        strokeDasharray="1.6 2.2"
        className="opacity-70 transition-all duration-500 [stroke-dashoffset:7.6] group-hover/capability:opacity-95 group-hover/capability:[stroke-dashoffset:0]"
      />
      <path d="M10.9 12.9 L9.5 13 M10.9 12.9 L10.9 14.3" strokeWidth={1.2} className="opacity-85" />
      <circle cx="3.4" cy="19.7" r="0.8" fill="currentColor" stroke="none" className="opacity-60" />
      <circle cx="7.2" cy="17.8" r="0.8" fill="currentColor" stroke="none" className="opacity-75" />
    </svg>
  );
}

/** Sprinting figure with joint markers, speed dashes and a stride arc. */
export function SportsMotionIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="15.8" cy="4.2" r="1.7" />
      <path d="M15.3 5.9 L12.6 11" />
      <path d="M14.6 7.5 L17.8 9.7 M14.6 7.5 L11.2 8.1" />
      <path d="M12.6 11 L16.6 13.1 L18.8 17.3" />
      <path d="M12.6 11 L9.3 12.5 L7.5 16.1" />
      <circle cx="12.6" cy="11" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16.6" cy="13.1" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9.3" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
      <path
        d="M6.4 19.4 C9.6 20.8, 14.6 20.6, 18.2 18.2"
        strokeWidth={1.2}
        strokeDasharray="1.6 2.2"
        className="opacity-60 transition-all duration-500 [stroke-dashoffset:7.6] group-hover/capability:opacity-90 group-hover/capability:[stroke-dashoffset:0]"
      />
      <path d="M4.2 7.4 H7.6 M3.2 10.2 H6.2" strokeWidth={1.1} className="opacity-55" />
    </svg>
  );
}

/** Detection-frame corners, erratic dashed trajectory, tracked figure. */
export function SuspiciousMotionIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6 V3.6 H5.4 M21 18 V20.4 H18.6" strokeWidth={1.2} className="opacity-70" />
      <circle cx="16.6" cy="6.9" r="1.6" />
      <path d="M16.6 8.6 V12.5" />
      <path d="M16.6 9.6 L14.7 11.3 M16.6 9.6 L18.5 11.3" />
      <path d="M16.6 12.5 L14.9 16.6 M16.6 12.5 L18.3 16.6" />
      <path
        d="M3.8 17.6 L7.1 13.3 L6.1 9.1 L10.5 10.9 L13.4 9.3"
        strokeWidth={1.2}
        strokeDasharray="1.6 2"
        className="opacity-70 transition-opacity duration-500 group-hover/capability:opacity-100"
      />
      <circle cx="13.4" cy="9.3" r="0.85" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Five-person cluster with directional flow arrows. */
export function CrowdSenseIcon(props: IconProps) {
  return (
    <svg {...base} {...props} strokeWidth={1.3}>
      <circle cx="6.6" cy="4.6" r="1.25" />
      <path d="M4.5 8.7 c0.4-1.7 3.8-1.7 4.2 0" />
      <circle cx="12.6" cy="3.9" r="1.25" />
      <path d="M10.5 8 c0.4-1.7 3.8-1.7 4.2 0" />
      <circle cx="18.2" cy="5.9" r="1.25" />
      <path d="M16.1 10 c0.4-1.7 3.8-1.7 4.2 0" />
      <circle cx="7.4" cy="11.2" r="1.25" />
      <path d="M5.3 15.3 c0.4-1.7 3.8-1.7 4.2 0" />
      <circle cx="13.6" cy="11.6" r="1.25" />
      <path d="M11.5 15.7 c0.4-1.7 3.8-1.7 4.2 0" />
      <path
        d="M4.2 18.9 H11 M9.7 17.7 L11 18.9 L9.7 20.1"
        strokeWidth={1.2}
        className="opacity-75 transition-transform duration-500 group-hover/capability:translate-x-[1px]"
      />
      <path
        d="M13.8 20.9 H18.6 M17.4 19.8 L18.6 20.9 L17.4 22"
        strokeWidth={1.1}
        className="opacity-55 transition-transform duration-500 group-hover/capability:translate-x-[1.5px]"
      />
    </svg>
  );
}

/** Hard-hat worker beside a dashed restricted-zone boundary with marker. */
export function IndustrialSafetyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8.8" cy="5.1" r="1.6" />
      <path d="M6.7 4.1 H10.9" strokeWidth={1.2} />
      <path d="M8.8 6.8 V12.2" />
      <path d="M8.8 8 L6.4 10.3 M8.8 8 L11.2 10.4" />
      <path d="M8.8 12.2 L7.3 16.6 L7.1 20.2" />
      <path d="M8.8 12.2 L10.5 16.5 L10.8 20.2" />
      <circle cx="8.8" cy="12.2" r="0.9" fill="currentColor" stroke="none" />
      <path d="M3 20.8 H21" className="opacity-50" />
      <path
        d="M14.7 20.8 V14.9 H21"
        strokeWidth={1.2}
        strokeDasharray="1.8 2"
        className="opacity-70 transition-opacity duration-500 group-hover/capability:opacity-100"
      />
      <circle
        cx="14.7"
        cy="14.9"
        r="1"
        fill="currentColor"
        stroke="none"
        className="opacity-90"
      />
    </svg>
  );
}

/** Bust with privacy-blur bars over the face and a verification shield. */
export function PrivacyGuardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="6.9" r="2.6" />
      <path d="M7.8 6.3 H12.2 M8.6 7.7 H11.4" strokeWidth={1.3} className="opacity-90" />
      <path d="M4.6 14.9 C5.4 11.8, 8 10.8, 10 10.8 C11.4 10.8, 13 11.2, 14.2 12.3" />
      <path
        d="M17.6 11.7 L20.8 12.8 V15.3 C20.8 17.4, 19.4 18.7, 17.6 19.5 C15.8 18.7, 14.4 17.4, 14.4 15.3 V12.8 Z"
        strokeWidth={1.3}
        className="opacity-80 transition-opacity duration-500 group-hover/capability:opacity-100"
      />
      <path
        d="M16.3 15.2 L17.3 16.2 L19 14.4"
        strokeWidth={1.2}
        className="opacity-70 transition-opacity duration-500 group-hover/capability:opacity-100"
      />
    </svg>
  );
}

/** product.id → refined capability pictogram (homepage featured lists). */
export const capabilityIconById = {
  walkscan: WalkScanIcon,
  fallrisk: FallRiskIcon,
  rehabtrack: RehabTrackIcon,
  sportsmotion: SportsMotionIcon,
  suspiciousmotion: SuspiciousMotionIcon,
  crowdsense: CrowdSenseIcon,
  industrialsafety: IndustrialSafetyIcon,
  privacyguard: PrivacyGuardIcon,
} as const;
