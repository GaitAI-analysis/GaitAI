import {
  Accessibility,
  Activity,
  Brain,
  Building2,
  ClipboardCheck,
  Dumbbell,
  Factory,
  FlaskConical,
  GraduationCap,
  HeartHandshake,
  Home,
  Hospital,
  Landmark,
  MapPin,
  Plane,
  Shield,
  Store,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * ONE ICON PER ENVIRONMENT — a real icon family, used as one.
 * =============================================================================
 * These were hand-drawn 44×32 scenes: a ground plane, a piece of the setting
 * (parallel bars, a ward bed, a sawtooth roof, a stadium bowl) and a small
 * movement figure standing in it. The intent was good and the result was not
 * product-grade. Eighteen bespoke drawings cannot hold one visual weight: each
 * had its own density, its own implied perspective and its own amount of
 * interior detail, so a column of them read as a set of tiny illustrations
 * rather than as a system — and at 44×32 inside a rounded container, most of
 * that detail was noise a reader never resolved.
 *
 * They are now Lucide glyphs, which is the icon family the rest of the site
 * already uses. That buys the consistency the drawings could not: one stroke
 * width, one corner treatment, one optical weight, one grid. The glyph is
 * chosen for meaning only — a hospital is a hospital, a factory is a factory —
 * and carries no scene, no figure and no ground plane.
 *
 * WHAT DID NOT CHANGE. The container is still the section's own: a rounded
 * square with the family accent, cyan/teal down the MobilityCare column and
 * royal/violet down SecureVision, from `--env-accent` in globals.css. The
 * glyph inherits `currentColor` exactly as the drawings did, so the accent,
 * the hover brightening and both themes keep working untouched.
 *
 * And no photography, here or anywhere near it: no stock image stands in for
 * a deployment this platform has not made.
 *
 * THE SIGNATURE IS UNCHANGED on purpose — `<EnvironmentScene id={...} />` —
 * so every caller keeps working without an edit.
 */

/**
 * Environment id → glyph.
 *
 * Keyed by `industryUseCases` id. Each icon is the plainest true statement of
 * the setting rather than the cleverest: the reader is scanning a column of
 * eighteen and needs to identify one, which is a job for the obvious glyph.
 * No two environments share an icon, because two identical icons in one
 * column read as a bug.
 */
const ICONS: Record<string, LucideIcon> = {
  /* ── MobilityCare ── */
  physio: Activity,
  hospitals: Hospital,
  sports: Trophy,
  elderly: HeartHandshake,
  neuro: Brain,
  homecare: Home,
  fitness: Dumbbell,
  schools: GraduationCap,
  prosthetics: Accessibility,
  insurance: ClipboardCheck,
  trials: FlaskConical,

  /* ── SecureVision ── */
  airports: Plane,
  smartcities: Building2,
  campuses: Landmark,
  factories: Factory,
  retail: Store,
  events: Users,
  defence: Shield,
};

/**
 * The icon for an environment id.
 *
 * `size` and `strokeWidth` are set here rather than left to the call site, so
 * every environment in every column is drawn at one weight — that uniformity
 * is the whole reason for the change. A new environment with no icon yet
 * falls back to a map pin: still a place, visibly a placeholder.
 */
export function EnvironmentScene({ id }: { id: string }) {
  const Icon = ICONS[id] ?? MapPin;
  return (
    <Icon
      aria-hidden="true"
      className="env-scene-art"
      size={20}
      strokeWidth={1.6}
      absoluteStrokeWidth
    />
  );
}
