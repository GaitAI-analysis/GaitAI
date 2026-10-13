/**
 * One JSON-LD block. Server component: it renders a <script> and nothing
 * else, so a page can state its structured data next to the markup that
 * backs it instead of hand-assembling `dangerouslySetInnerHTML` each time.
 *
 * `</script` is escaped so a value that happens to contain it (a title, a
 * description) cannot close the block early.
 */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
