import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { secureProductDetails } from "@/data/product-details-secure";
import { productDetailBySlug, productValueProp } from "@/data/product-details";
import { productById } from "@/data/products";
import { ProductDetailView } from "@/components/products/ProductDetailView";

export const dynamicParams = false;

export function generateStaticParams() {
  return secureProductDetails.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const detail = productDetailBySlug(params.slug);
  const product = productById(params.slug);
  if (!detail || !product || product.vertical !== "securevision") {
    return { title: "Product not found" };
  }
  return {
    title: `${product.name} — ${productValueProp(product.id)}`,
    description: detail.overview,
    alternates: { canonical: `/securevision/${detail.slug}/` },
    openGraph: {
      title: `${product.name} — ${productValueProp(product.id)}`,
      description: detail.overview,
      type: "website",
    },
  };
}

export default function SecureProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const detail = secureProductDetails.find((d) => d.slug === params.slug);
  if (!detail) notFound();

  // Product content (including its icon component) is looked up inside the
  // client component — component references cannot cross the RSC boundary.
  return <ProductDetailView slug={params.slug} />;
}
