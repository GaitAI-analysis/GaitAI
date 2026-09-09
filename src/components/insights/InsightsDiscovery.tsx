import type { PublicationStory } from "@/lib/publication";
import { SubscribeForm } from "@/components/subscribe/SubscribeForm";
import { BrowseSignal, FooterSignal } from "./hub/BrowseSignal";
import styles from "./hub/discovery.module.css";

/**
 * The foot of /insights (and of every paginated feed page): what a reader
 * does once the stories have run out.
 *
 *   1. Browse the signal — subjects as rows whose trajectory is their share
 *      of the archive, and the archive itself drawn as movement through
 *      publication time. Type on the page ground, not boxes.
 *   2. Stay close to the signal — the subscription form, whose lane reacts
 *      to focus, to a valid address and to success.
 *   3. The signal flattens into the footer's rule: story → signal → platform.
 *
 * NO RSS HERE, ON PURPOSE. The feed at /insights/rss.xml is announced in this
 * page's <head>; a visible link would send ordinary visitors to raw XML.
 */
export function InsightsDiscovery({ stories }: { stories: PublicationStory[] }) {
  return (
    <>
      <BrowseSignal stories={stories} />
      <section className={styles.newsletter}>
        <div className="container-wide">
          <SubscribeForm variant="blog" />
        </div>
        <FooterSignal />
      </section>
    </>
  );
}
