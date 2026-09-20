import generated from "./product-images.generated.json";

export interface ProductImageVariant {
  src: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
}

export interface ProductImageAsset {
  width: number;
  height: number;
  variants: ProductImageVariant[];
}

export interface ProductImages {
  heroDark: string;
  heroLight: string;
  card: string;
  alt: string;
  heroPosition: string;
  /** Broader framing when context spans both sides of the photograph. */
  heroWide?: boolean;
  cardPosition: string;
  assets: Record<"heroDark" | "heroLight" | "card", ProductImageAsset>;
}

const productImages: Readonly<Record<string, ProductImages>> = generated;

/** Source ownership and any closest-fit sharing are reviewed in the manifest. */
export function imagesForProduct(id: string): ProductImages | null {
  return productImages[id] ?? null;
}
