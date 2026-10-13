import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { secureProductDetails } from "@/data/product-details-secure";
import { productDetailBySlug, productValueProp } from "@/data/product-details";
import { productById } from "@/data/products";
import { ProductDetailView } from "@/components/products/ProductDetailView";
import { SITE_URL, SOCIAL_IMAGES, searchTitle, socialCard } from "@/lib/seo";

export const dynamicParams = false;

const SITE = SITE_URL;

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
  /* The headline ends a sentence on the page; in a <title> that full stop
     would land before " | GaitAI". */
  const title = `${product.name} — ${searchTitle(productValueProp(product.id))}`;
  const path = `/securevision/${detail.slug}/`;
  return {
    title,
    description: detail.overview,
    alternates: { canonical: path },
    ...socialCard({ title, description: detail.overview, path, image: SOCIAL_IMAGES.securevision }),
  };
}

export default function SecureProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const detail = secureProductDetails.find((d) => d.slug === params.slug);
  const product = productById(params.slug);
  if (!detail || !product) notFound();

  /* Structured data, from the same record the page renders: the product
     (name, one-line value, description, brand, its documented outputs as
     features). Nothing is asserted that the record does not carry — no
     ratings, prices, reviews or availability. The BreadcrumbList this route
     used to add here duplicated the one the location trail in the root
     layout already emits for every page, so it is gone. */
  const url = `${SITE}/securevision/${detail.slug}/`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    alternateName: product.short,
    description: detail.overview,
    url,
    brand: { "@type": "Brand", name: "GaitAI" },
    category: "Movement intelligence software · SecureVision",
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView slug={params.slug} />
    </>
  );
}
