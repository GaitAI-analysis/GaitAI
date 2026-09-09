import { allProducts } from "@/data/products";
import { allPublications } from "@/data/publications";
import { researchAreas } from "@/data/evidence";
import { gaitscapeNodes, gaitscapeRelationships, nodeById } from "@/data/gaitscape/graph";
import type { GaitscapeNode } from "@/data/gaitscape/types";

function publicUrl(value: string): URL | null {
  try {
    const url = new URL(value, "https://gaitai.in");
    return url.origin === "https://gaitai.in" ? url : null;
  } catch { return null; }
}
const route = (url: URL) => url.pathname.replace(/\/$/, "") || "/";

/** Resolve only returned canonical source URLs. Generated answer prose is never input. */
export function answerConnections(sources: readonly { url: string }[]) {
  const seeds = new Map<string, GaitscapeNode>();
  for (const source of sources) {
    const url = publicUrl(source.url);
    if (!url) continue;
    const path = route(url);
    for (const node of gaitscapeNodes) {
      if ((node.type === "product" || node.type === "domain" || node.type === "vertical") && node.href &&
        path === node.href.replace(/\/$/, "")) seeds.set(node.id, node);
    }
    // Module sources point at the module's own page (/family/module/), while the
    // graph node's href is its anchor on the family page — match both.
    for (const product of allProducts) {
      const node = nodeById.get(product.id);
      if (node && path === `/${product.vertical}/${product.id}`) seeds.set(node.id, node);
    }
    if (path === "/gaitscape") {
      const focused = nodeById.get(url.searchParams.get("focus") ?? "");
      if (focused) seeds.set(focused.id, focused);
    }
    const publication = allPublications.find((paper) => path === `/publications/${paper.id}`);
    if (publication) {
      for (const area of researchAreas) {
        if (area.publications.some((paper) => paper.id === publication.id)) {
          const node = nodeById.get(area.id);
          if (node) seeds.set(node.id, node);
        }
      }
    }
  }

  const productIds = new Set([...seeds.values()].filter((node) => node.type === "product").map((node) => node.id));
  for (const seed of seeds.values()) {
    if (seed.type === "research") {
      // Broad second-hop graph neighbours would overstate the publication's scope.
      for (const product of researchAreas.find((area) => area.id === seed.id)?.directProducts ?? []) productIds.add(product.id);
    } else if (seed.type !== "product") {
      for (const relationship of gaitscapeRelationships) {
        if (relationship.target === seed.id && nodeById.get(relationship.source)?.type === "product") {
          productIds.add(relationship.source);
        }
      }
    }
  }

  const connectedNodes = (id: string, type: "senses" | "powered-by" | "captured-by") =>
    gaitscapeRelationships.filter((relationship) => relationship.source === id && relationship.type === type)
      .flatMap((relationship) => { const node = nodeById.get(relationship.target); return node ? [node] : []; });

  return {
    context: [...seeds.values()].filter((node) => node.type !== "product").slice(0, 2),
    products: [...productIds].slice(0, 3).flatMap((id) => {
      const product = allProducts.find((item) => item.id === id);
      const node = nodeById.get(id);
      if (!product || !node) return [];
      return [{
        product,
        href: `/${product.vertical}/${product.id}/`,
        inputs: connectedNodes(id, "captured-by"),
        signals: connectedNodes(id, "senses"),
        capabilities: connectedNodes(id, "powered-by"),
        evidence: researchAreas.filter((area) => area.directProducts.some((item) => item.id === id)),
      }];
    }),
  };
}
