import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { secureProductDetails } from "@/data/product-details-secure";
import { productDetailBySlug, productValueProp } from "@/data/product-details";
import { productById } from "@/data/products";
import { ProductDetailView } from "@/components/products/ProductDetailView";

export const dynamicParams = false;

const SITE = "https://gaitai.in";

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
  const title = `${product.name} — ${productValueProp(product.id)}`;
  return {
    title,
    description: detail.overview,
    alternates: { canonical: `/securevision/${detail.slug}/` },
    openGraph: {
      title,
      description: detail.overview,
      type: "website",
      url: `/securevision/${detail.slug}/`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: detail.overview,
    },
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

  /* Structured data, from the same two records the page renders: the product
     (name, one-line value, description, brand, its documented outputs as
     features) and the breadcrumb the location trail already shows. Nothing is
     asserted that the records do not carry — no ratings, prices, reviews or
     availability. */
  const url = `${SITE}/securevision/${detail.slug}/`;
  const jsonLd = [
    {
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
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "GaitAI", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Products", item: `${SITE}/products/` },
        { "@type": "ListItem", position: 3, name: "SecureVision", item: `${SITE}/securevision/` },
        { "@type": "ListItem", position: 4, name: product.short, item: url },
      ],
    },
  ];

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
