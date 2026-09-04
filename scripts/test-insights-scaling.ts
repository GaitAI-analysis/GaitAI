import assert from "node:assert/strict";
import {
  HOME_LATEST_SIZE,
  PUBLICATION_PAGE_SIZE,
  VISIBLE_TOPIC_COUNT,
  buildArchiveGroups,
  filterPublicationStories,
  progressivePage,
  progressivePageCount,
  publicationTopics,
  relatedStories,
  selectCoverStory,
  seriesNeighbors,
  type PublicationStory,
} from "../src/lib/publication";

function fixture(count: number): PublicationStory[] {
  return Array.from({ length: count }, (_, index) => {
    const topic = `topic-${index % Math.max(4, Math.ceil(count / 20))}`;
    const date = new Date(Date.UTC(2026 + Math.floor(index / 365), index % 12, (index % 27) + 1));
    const title = `Synthetic story ${String(index + 1).padStart(3, "0")}`;
    return {
      id: `fixture:${index}`,
      slug: `synthetic-story-${index}`,
      href: `/insights/synthetic-story-${index}`,
      source: "editorial",
      title,
      description: `A compact description for ${title}.`,
      date: date.toISOString(),
      updated: date.toISOString(),
      type: index % 4 === 0 ? "research" : "essay",
      topics: [topic, index % 7 === 0 ? "research" : "movement-intelligence"],
      author: index % 2 ? "GaitAI Research" : "GaitAI",
      featured: index === Math.min(2, count - 1),
      coverArtwork: { kind: "none" },
      tags: ["synthetic", topic],
      relatedProducts: [`product-${index % 3}`],
      relatedResearch: [`research-${index % 5}`],
      relatedSlugs: [],
      series: index < 5 ? "Fixture Foundations" : undefined,
      seriesOrder: index < 5 ? index + 1 : undefined,
    };
  });
}

for (const count of [5, 12, 30, 100, 500]) {
  const started = performance.now();
  const stories = fixture(count);
  const cover = selectCoverStory(stories, new Date("2035-01-01"));
  assert.equal(cover?.featured, true, `${count}: metadata drives the cover`);
  const feed = stories.filter((story) => story.id !== cover?.id);
  const pages = progressivePageCount(feed.length, HOME_LATEST_SIZE);
  const rendered = Array.from({ length: pages }, (_, index) =>
    progressivePage(feed, index + 1, HOME_LATEST_SIZE, PUBLICATION_PAGE_SIZE),
  );
  assert.ok(rendered[0].length <= HOME_LATEST_SIZE, `${count}: front page remains bounded`);
  assert.ok(rendered.slice(1).every((page) => page.length <= PUBLICATION_PAGE_SIZE), `${count}: later pages remain bounded`);
  assert.deepEqual(new Set(rendered.flat().map((story) => story.id)).size, feed.length, `${count}: pagination loses or duplicates no stories`);

  const search = filterPublicationStories(stories, { query: `synthetic story ${String(count).padStart(3, "0")}` });
  assert.equal(search.length, 1, `${count}: search sees beyond the rendered slice`);
  const topics = publicationTopics(stories);
  assert.ok(topics.slice(0, VISIBLE_TOPIC_COUNT).length <= 4, `${count}: visible topic chips stay capped`);
  const archived = buildArchiveGroups(stories).flatMap((year) => year.months.flatMap((month) => month.stories));
  assert.equal(archived.length, count, `${count}: archive indexes every story`);
  assert.deepEqual(relatedStories(stories[0], stories, 3), relatedStories(stories[0], stories, 3), `${count}: recommendations are deterministic`);
  assert.ok(relatedStories(stories[0], stories, 3).every((story) => story.id !== stories[0].id), `${count}: recommendations exclude the current story`);
  const neighbors = seriesNeighbors(stories[2], stories);
  assert.equal(neighbors.previous?.seriesOrder, 2, `${count}: previous series item resolves`);
  assert.equal(neighbors.next?.seriesOrder, 4, `${count}: next series item resolves`);
  assert.ok(performance.now() - started < 250, `${count}: metadata indexing stays lightweight`);
  console.log(`✓ ${count} stories · ${pages} page${pages === 1 ? "" : "s"} · ${topics.length} topics · bounded DOM`);
}

console.log("Insights scaling fixtures passed.");
