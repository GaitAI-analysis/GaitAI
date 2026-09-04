"use client";

import { usePathname } from "next/navigation";
import { SubscribeForm } from "./SubscribeForm";

/**
 * The blog's signup, in the site footer.
 *
 * WHY IT IS NOT ON EVERY PAGE. A footer signup used to sit here on all seventy
 * routes and was removed for a good reason: it appeared in the least
 * considered place on every one of them, and nobody subscribes to a mailing
 * list from the bottom of a legal page. That reasoning is still right, and
 * this does not undo it.
 *
 * WHY IT IS BACK, ON THE BLOG. A publication that grows has a problem a fixed
 * set of marketing pages does not: the newsletter block lives under the feed, and
 * under the feed is a place that moves further away with every post. At five
 * stories it is one screen down. At five hundred it is past a paginated feed,
 * a discovery panel and a footer. Putting the form in the footer of the blog
 * family means it is one End key away from any story, any topic page and any
 * article — reachable no matter how long the publication gets, and still
 * absent from the sixty pages that are not the blog.
 *
 * The route test is a prefix on /insights, which is the whole family: the
 * feed, its later pages, every article, Foundations, Topics, the topic pages,
 * the archive and the series routes. The one exclusion is the unsubscribe
 * page, where offering to subscribe is a joke at the reader's expense.
 */
export function FooterSubscribe() {
  const pathname = usePathname() ?? "";
  const inBlog = pathname === "/insights" || pathname.startsWith("/insights/");
  const unsubscribing = pathname.startsWith("/insights/unsubscribe");
  if (!inBlog || unsubscribing) return null;

  return (
    <div className="mt-16 border-t border-white/5 pt-8">
      <SubscribeForm variant="footer" className="max-w-md" />
    </div>
  );
}
