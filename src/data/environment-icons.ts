/**
 * THE LIGHT-THEME ENVIRONMENT ICON FAMILY
 * =============================================================================
 * One rendered picture per environment (`industryUseCases` id), for the light
 * theme only. The dark theme keeps its approved Lucide glyphs; in light the
 * same tile shows this family instead — pearl-white glass bodies with graphite
 * detail, one cyan/teal/sapphire movement cue each, a restrained violet or
 * champagne accent where the setting earns it, and one soft blue-grey ground
 * shadow. Authored as SVG masters, rendered by Chromium to 512×512 transparent
 * WebP with a 128 px rung for the tiles they actually sit in (40–56 px).
 *
 * Files: public/assets/icons/light/environments/<id>.webp and <id>-128.webp.
 * A theme picks the file through `ThemePicture`, which has no dark candidate
 * here, so a dark visitor never downloads one.
 */

export const ENVIRONMENT_ICON_IDS = [
  /* MobilityCare */
  "physio",
  "hospitals",
  "sports",
  "elderly",
  "neuro",
  "homecare",
  "fitness",
  "schools",
  "prosthetics",
  "insurance",
  "trials",
  /* SecureVision */
  "airports",
  "smartcities",
  "campuses",
  "factories",
  "retail",
  "events",
  "defence",
] as const;

export type EnvironmentIconId = (typeof ENVIRONMENT_ICON_IDS)[number];

const ROOT = "/assets/icons/light/environments";

export interface EnvironmentIcon {
  /** 512×512 master. */
  readonly src: string;
  /** 128×128 rung for 40–56 px tiles. */
  readonly src128: string;
  /** `srcset` with both rungs, ready for ThemePicture's light candidates. */
  readonly srcSet: string;
}

/** The light icon for an environment id, or null for an id without one. */
export function environmentIcon(id: string): EnvironmentIcon | null {
  if (!(ENVIRONMENT_ICON_IDS as readonly string[]).includes(id)) return null;
  const src = `${ROOT}/${id}.webp`;
  const src128 = `${ROOT}/${id}-128.webp`;
  return { src, src128, srcSet: `${src128} 128w, ${src} 512w` };
}
