import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { productDetails, productDetailBySlug, productValueProp } from "@/data/product-details";
import { productById } from "@/data/products";
import { ProductDetailView } from "@/components/products/ProductDetailView";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL, SOCIAL_IMAGES, searchTitle, socialCard } from "@/lib/seo";

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
  /* The headline ends a sentence on the page; in a <title> that full stop
     would land before " | GaitAI". */
  const title = `${product.name} — ${searchTitle(productValueProp(product.id))}`;
  const path = `/mobilitycare/${detail.slug}/`;
  return {
    title,
    description: detail.overview,
    alternates: { canonical: path },
    ...socialCard({ title, description: detail.overview, path, image: SOCIAL_IMAGES.mobilitycare }),
  };
}

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const detail = productDetailBySlug(params.slug);
  const product = productById(params.slug);
  if (!detail || !product) notFound();

  /* Structured data from the same two records the page renders — the
     SecureVision detail route has carried this since the Product markup was
     introduced; the MobilityCare route did not, so half the catalogue was
     described to crawlers and half was not. Name, one-line value,
     description, brand and the documented outputs as features; nothing the
     records do not carry — no ratings, prices, reviews or availability.
     The BreadcrumbList comes from the location trail in the root layout,
     which already states this route's trail once for every page. */
  const url = `${SITE_URL}/mobilitycare/${detail.slug}/`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    alternateName: product.short,
    description: detail.overview,
    url,
    brand: { "@type": "Brand", name: "GaitAI" },
    category: "Movement intelligence software · MobilityCare",
    additionalProperty: product.outputs.map((output) => ({
      "@type": "PropertyValue",
      name: "Output",
      value: output,
    })),
  };

  // Product content (including its icon component) is looked up inside the
  // client component — component references cannot cross the RSC boundary.
  return (
    <>
      <JsonLd data={jsonLd} />
      <ProductDetailView slug={params.slug} />
    </>
  );
}
