/**
 * GaitAI mobile design system: tokens only, no components.
 *
 * Deep navy, muted royal blue, restrained cyan, a violet accent where it
 * means something, off-white paper, graphite and cool grey, one warm gold.
 * No electric blue, no neon. Each product carries its own accent: teal for
 * MobilityCare, royal for SecureVision, both from the website's registry.
 */

export type ProductId = "mobilitycare" | "securevision";

export const palette = {
  navy900: "#070B14",
  navy800: "#0B1426",
  navy700: "#0F1C3A",
  navy600: "#18213F",
  royal: "#5B8CFF",
  royalDeep: "#3B5BD6",
  cyan: "#4FD1FF",
  cyanDeep: "#0E7490",
  teal: "#0FA3B1",
  tealSoft: "#2DD4BF",
  violet: "#9C64F1",
  gold: "#C9A55D",
  goldDeep: "#A9803F",
  paper: "#F6F8FC",
  paper2: "#EEF2F8",
  white: "#FFFFFF",
  graphite: "#1F2937",
  grey700: "#4A5468",
  grey500: "#6B7489",
  grey400: "#94A3B8",
  grey300: "#CBD5E1",
  softWhite: "#F3F6FB",
  danger: "#E5484D",
  warning: "#D9A441",
  success: "#2FA36B",
} as const;

export interface Theme {
  scheme: "light" | "dark";
  product: ProductId;
  /** Page ground. */
  bg: string;
  /** Raised surface (cards, sheets). */
  surface: string;
  surface2: string;
  /** Hairline. */
  line: string;
  lineStrong: string;
  ink: string;
  body: string;
  mute: string;
  /** Product accent and a soft wash of it. */
  accent: string;
  accentSoft: string;
  accentInk: string;
  /** Secondary accent for premium / locked states. */
  premium: string;
  premiumSoft: string;
  gold: string;
  danger: string;
  warning: string;
  success: string;
  /** Chart series in order of importance. */
  series: [string, string, string, string];
  shadow: string;
}

const ACCENT: Record<ProductId, { light: string; dark: string; softL: string; softD: string; inkL: string; inkD: string }> = {
  mobilitycare: {
    light: palette.cyanDeep, dark: palette.tealSoft,
    softL: "rgba(14,116,144,0.10)", softD: "rgba(45,212,191,0.14)",
    inkL: palette.white, inkD: palette.navy900,
  },
  securevision: {
    light: palette.royalDeep, dark: palette.royal,
    softL: "rgba(59,91,214,0.10)", softD: "rgba(91,140,255,0.16)",
    inkL: palette.white, inkD: palette.navy900,
  },
};

export function makeTheme(product: ProductId, scheme: "light" | "dark"): Theme {
  const a = ACCENT[product];
  if (scheme === "dark") {
    return {
      scheme, product,
      bg: palette.navy900,
      surface: "#0E1628",
      surface2: "#131D33",
      line: "rgba(148,163,184,0.14)",
      lineStrong: "rgba(148,163,184,0.26)",
      ink: palette.softWhite,
      body: "#B3BDD0",
      mute: "#8C97AD",
      accent: a.dark, accentSoft: a.softD, accentInk: a.inkD,
      premium: palette.violet, premiumSoft: "rgba(156,100,241,0.16)",
      gold: palette.gold,
      danger: "#F0656A", warning: palette.warning, success: "#4CC38A",
      series: [a.dark, palette.royal, palette.violet, palette.gold],
      shadow: "rgba(0,0,0,0.6)",
    };
  }
  return {
    scheme, product,
    bg: palette.paper,
    surface: palette.white,
    surface2: palette.paper2,
    line: "rgba(15,28,58,0.10)",
    lineStrong: "rgba(15,28,58,0.20)",
    ink: palette.navy700,
    body: palette.grey700,
    mute: palette.grey500,
    accent: a.light, accentSoft: a.softL, accentInk: a.inkL,
    premium: "#6D3FD1", premiumSoft: "rgba(109,63,209,0.10)",
    gold: palette.goldDeep,
    danger: palette.danger, warning: "#B7831E", success: palette.success,
    series: [a.light, palette.royalDeep, "#6D3FD1", palette.goldDeep],
    shadow: "rgba(15,28,58,0.18)",
  };
}

/** 4pt spacing scale. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

/** Type scale, in points. Body 16, lead 18, titles 22/28/34. */
export const type = {
  hero: { fontSize: 34, lineHeight: 38, fontWeight: "700" as const, letterSpacing: -0.8 },
  title: { fontSize: 28, lineHeight: 33, fontWeight: "700" as const, letterSpacing: -0.6 },
  heading: { fontSize: 22, lineHeight: 27, fontWeight: "600" as const, letterSpacing: -0.3 },
  lead: { fontSize: 18, lineHeight: 26, fontWeight: "400" as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  small: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "600" as const, letterSpacing: 0.6 },
  metric: { fontSize: 32, lineHeight: 36, fontWeight: "700" as const, letterSpacing: -0.8 },
} as const;

/** Minimum touch target, per platform guidance. */
export const hit = 48;

export const productMeta: Record<ProductId, { name: string; short: string; tagline: string; packageId: string; scheme: string }> = {
  mobilitycare: {
    name: "GaitAI MobilityCare",
    short: "MobilityCare",
    tagline: "Understand your movement.",
    packageId: "in.gaitai.mobilitycare",
    scheme: "gaitai-mobilitycare",
  },
  securevision: {
    name: "GaitAI SecureVision",
    short: "SecureVision",
    tagline: "Understand movement. Protect privacy.",
    packageId: "in.gaitai.securevision",
    scheme: "gaitai-securevision",
  },
};
