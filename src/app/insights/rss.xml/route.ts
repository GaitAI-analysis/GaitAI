import { readPublicationStories } from "@/lib/publication-store";

export const dynamic = "force-static";
const SITE_URL = "https://gaitai.in";

function xml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
  })[character] ?? character);
}

export async function GET() {
  const stories = (await readPublicationStories()).slice(0, 50);
  const items = stories.map((story) => {
    const link = `${SITE_URL}${story.href}/`.replace(/\/{2,}$/, "/");
    return `<item><title>${xml(story.title)}</title><link>${xml(link)}</link><guid isPermaLink="true">${xml(link)}</guid><pubDate>${new Date(story.date).toUTCString()}</pubDate><dc:creator>${xml(story.author)}</dc:creator><description>${xml(story.description)}</description>${story.topics.map((topic) => `<category>${xml(topic)}</category>`).join("")}</item>`;
  }).join("");
  const latest = stories[0]?.date ? new Date(stories[0].date).toUTCString() : new Date(0).toUTCString();
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>GaitAI Blog &amp; Updates</title><link>${SITE_URL}/insights/</link><description>Ideas, research, product stories and the latest from GaitAI.</description><language>en</language><lastBuildDate>${latest}</lastBuildDate><atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${SITE_URL}/insights/rss.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}

