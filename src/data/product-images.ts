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
  cardPosition: string;
  assets: Record<"heroDark" | "heroLight" | "card", ProductImageAsset>;
}

const productImages: Readonly<Record<string, ProductImages>> = generated;

/** Missing source sets remain explicit; never substitute another product's image. */
export function imagesForProduct(id: string): ProductImages | null {
  return productImages[id] ?? null;
}
