import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useCaseDetails, getUseCaseDetail } from "@/data/usecase-details";
import { industryUseCases } from "@/data/products";
import { UseCaseDetailView } from "@/components/usecases/UseCaseDetailView";

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
  return {
    title: `${base.industry} — ${detail.valueProp}`,
    description: detail.overview,
    alternates: { canonical: `/use-cases/${detail.slug}/` },
    openGraph: {
      title: `${base.industry} — GaitAI deployment`,
      description: detail.overview,
      type: "website",
    },
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
