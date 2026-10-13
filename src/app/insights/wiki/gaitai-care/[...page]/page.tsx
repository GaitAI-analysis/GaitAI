import { notFound } from "next/navigation";
import { WikiAccessGate } from "@/components/WikiAccessGate";
import routes from "@/data/wiki-legacy-routes.json";

const prefix = "/insights/wiki/gaitai-care/";
const legacy = routes.filter((route) => route.startsWith(prefix) && route !== prefix);
export const dynamicParams = false;
export function generateStaticParams() {
  return legacy.map((route) => ({ page: route.slice(prefix.length).replace(/\/$/, "").split("/") }));
}
export default function LegacyWikiEntryPage({ params }: { params: { page: string[] } }) {
  const path = `${prefix}${params.page.join("/")}/`;
  if (!legacy.includes(path)) notFound();
  return <WikiAccessGate path={path} />;
}
