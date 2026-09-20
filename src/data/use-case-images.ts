import generated from "./use-case-images.generated.json";

/**
 * Environment photography, one reviewed dark/light pair per use case.
 *
 * The shape deliberately echoes `product-images.ts`: a generated registry
 * written only by `scripts/import-use-case-images.py`, a hand-written accessor,
 * and nothing in a component that knows a file path. The difference is that a
 * use case carries two roles rather than three — there is no separate card
 * photograph, because the card band and the detail band show the same
 * environment and a second crop of the same scene would be a different picture
 * of the same thing.
 *
 * `null` is a real answer. Defence & Armed Forces ships without a photograph
 * (see `missingDedicatedAssets` in the manifest), so every consumer has to
 * render correctly with no imagery rather than assume a pair exists.
 */

export interface UseCaseImageVariant {
  src: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
}

export interface UseCaseImageAsset {
  width: number;
  height: number;
  variants: UseCaseImageVariant[];
}

export interface UseCaseImages {
  /** The night/cinematic frame. A dedicated source, never a filtered light one. */
  dark: string;
  /** The daylight frame. A dedicated source, never a dimmed dark one. */
  light: string;
  alt: string;
  /**
   * `object-position` for the 4:3 band, per theme. The two frames of a pair
   * are separate photographs and their subjects stand in different places —
   * neuro's clinician is at the right edge of the night frame and the left edge
   * of the daylight one — so one position cannot keep both in the crop.
   */
  objectPosition: Record<"dark" | "light", string>;
  assets: Record<"dark" | "light", UseCaseImageAsset>;
}

const useCaseImages: Readonly<Record<string, UseCaseImages>> = generated;

/** Source ownership and every rejected candidate are recorded in the manifest. */
export function imagesForUseCase(id: string): UseCaseImages | null {
  return useCaseImages[id] ?? null;
}
