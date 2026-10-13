import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useCaseDetails, getUseCaseDetail } from "@/data/usecase-details";
import { industryUseCases } from "@/data/products";
import { UseCaseDetailView } from "@/components/usecases/UseCaseDetailView";
import { SOCIAL_IMAGES, searchTitle, socialCard } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return useCaseDetails.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const detail = getUseCaseDetail(params.slug);
  const base = industryUseCases.find((c) => c.id === detail?.caseId);
  if (!detail || !base) return { title: "Use case not found" };
  /* "Physiotherapy clinics — Objective movement evidence for every therapy
     plan" reads as a page about physiotherapy clinics; the family name tells
     a searcher which kind of GaitAI deployment it is. The value proposition
     ends a sentence on the page, so its full stop is dropped from the
     <title>. */
  const family = detail.family === "mobilitycare" ? "MobilityCare" : "SecureVision";
  const title = `${base.industry} — ${searchTitle(detail.valueProp)} · ${family}`;
  const path = `/use-cases/${detail.slug}/`;
  return {
    title,
    description: detail.overview,
    alternates: { canonical: path },
    ...socialCard({
      title: `${base.industry} — GaitAI ${family} deployment`,
      description: detail.overview,
      path,
      image: detail.family === "mobilitycare" ? SOCIAL_IMAGES.mobilitycare : SOCIAL_IMAGES.securevision,
    }),
  };
}

export default function UseCaseDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const detail = getUseCaseDetail(params.slug);
  if (!detail) notFound();

  // Use-case content (icons included) is looked up inside the client
  // component — component references cannot cross the RSC boundary.
  return <UseCaseDetailView slug={params.slug} />;
}
