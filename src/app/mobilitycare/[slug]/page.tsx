import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { productDetails, productDetailBySlug } from "@/data/product-details";
import { productById } from "@/data/products";
import { ProductDetailView } from "@/components/products/ProductDetailView";

export const dynamicParams = false;

export function generateStaticParams() {
  return productDetails.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const detail = productDetailBySlug(params.slug);
  const product = productById(params.slug);
  if (!detail || !product) return { title: "Product not found" };
  return {
    title: `${product.name} — ${detail.valueProp}`,
    description: detail.overview,
    alternates: { canonical: `/mobilitycare/${detail.slug}/` },
    openGraph: {
      title: `${product.name} — ${detail.valueProp}`,
      description: detail.overview,
      type: "website",
    },
  };
}

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const detail = productDetailBySlug(params.slug);
  if (!detail) notFound();

  // Product content (including its icon component) is looked up inside the
  // client component — component references cannot cross the RSC boundary.
  return <ProductDetailView slug={params.slug} />;
}
