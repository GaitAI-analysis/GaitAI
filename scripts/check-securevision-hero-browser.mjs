import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { serve } from "./audit-server.mjs";

/**
 * /securevision/ hero, in a real browser: two films, one per theme, no filter.
 *
 * Asserts what the light-mode brief demands and what a screenshot cannot
 * prove on its own:
 *
 *   - the <video> playing in light is the DAYLIGHT file, in dark the NIGHT
 *     file; a light visit never requests the night file and vice versa
 *   - the theme's own still is on the wire BEFORE load (it is the LCP
 *     image) and the other theme's still never is — it is prefetched at
 *     idle afterwards, so that a theme toggle has a picture to show
 *   - the light film carries no CSS filter (it is its own grade); the night
 *     film keeps its lift
 *   - the daylight intelligence layer is present only in light; the night
 *     film's baked-label corrections are present only in dark
 *   - the four capability chips are gone in both themes
 *   - the headline is navy on the daylight film, white on the night film
 *   - the hero's copy, CTAs and eyebrow are the same in both themes
 *   - the video is actually playing (currentTime advances) and sized to the
 *     hero, and the hero keeps its tall treatment
 *   - the theme toggle swaps the film in place without a reload; the
 *     persisted-light reload paints the daylight poster/film first
 *
 * SINCE THE TWO-SLIDE HERO (components/ui/HeroSlider.tsx): in both themes
 * the founder's premium still for the theme is slide 0 and the theme's film
 * is slide 1, so every visit first asserts the theme's still is showing (and
 * the other theme's still was never requested) and the film is held, then
 * brings the film slide forward through its pagination dot before the film
 * assertions run.
 *
 *   QA_CHROMIUM=<chromium executable> GAITAI_AUDIT_OUT=out \
 *     npx tsx scripts/check-securevision-hero-browser.mjs
 *   SV_CHECK_BASE=https://gaitai.in … runs against the deployed site.
 */

const require = createRequire(import.meta.url);
const { chromium } = require("../tmp/qa/node_modules/playwright");
const live = process.env.SV_CHECK_BASE;
const { server, base } = live
  ? { server: { close() {} }, base: live.replace(/\/$/, "") }
  : await serve();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.QA_CHROMIUM,
});
const directory = "tmp/securevision-hero-audit";
fs.mkdirSync(directory, { recursive: true });

const NIGHT = "/assets/videos/securevision/securevision-hero.mp4";
const DAY = "/assets/videos/securevision/securevision-hero-light.mp4";
const errors = [];
let checks = 0;

async function themeIs(page, t) {
  return page.evaluate(
    (x) => document.documentElement.classList.contains(x),
    t,
  );
}
async function setTheme(page, target) {
  for (let i = 0; i < 3; i += 1) {
    if (await themeIs(page, target)) return;
    await page
      .getByRole("button", { name: /^Theme:/ })
      .first()
      .click();
    await page.waitForTimeout(350);
  }
  assert.ok(await themeIs(page, target), `could not reach theme ${target}`);
}

const STILLS = {
  light: "/images/hero/securevision-hero-light-premium.webp",
  dark: "/images/hero/securevision-hero-dark-premium.webp",
};

/* Both themes: the theme's still shows first (and is the LCP image), the
   film is held. Assert that, then choose the film slide by its dot and wait
   out the fade. */
async function showFilmSlide(page, label) {
  const theme = (await themeIs(page, "light")) ? "light" : "dark";
  const STILL = STILLS[theme];
  const dots = page.locator(".hero-slider__dots .hero-slider__dot");
  assert.equal(await dots.count(), 2, `${label}: two pagination dots`);
  const state = await page.evaluate(() => {
    const still = document.querySelector(".securevision-hero .hero-slider__slide--still");
    const img = still?.querySelector("img");
    const video = document.querySelector("video.securevision-hero-video");
    return {
      stillActive: still?.getAttribute("data-active"),
      stillSrc: img?.currentSrc || img?.getAttribute("src") || "",
      stillLoaded: !!img && img.complete && img.naturalWidth > 0,
      filmPaused: !!video && video.paused,
      dotsVisible: getComputedStyle(document.querySelector(".hero-slider__dots")).display !== "none",
    };
  });
  if (state.stillActive === "true") {
    assert.ok(state.stillSrc.endsWith(STILL.split("/").pop()), `${label}: still is ${state.stillSrc}`);
    assert.ok(state.stillLoaded, `${label}: the still has not loaded`);
    assert.ok(state.dotsVisible, `${label}: pagination hidden in ${theme}`);
  }
  await dots.nth(1).click();
  await page.waitForFunction(
    () => document.querySelector(".securevision-hero .hero-slider__slide--film")?.getAttribute("data-active") === "true",
    null,
    { timeout: 5000 },
  );
  await page.waitForTimeout(1600);
  checks += 1;
}

async function heroState(page) {
  return page.evaluate(() => {
    const hero = document.querySelector(".securevision-hero");
    const video = hero.querySelector("video.securevision-hero-video");
    const h1 = hero.querySelector("h1");
    const cs = getComputedStyle(video);
    const day = hero.querySelector(".securevision-daylight-layer");
    const labels = hero.querySelector(".securevision-hero-labels");
    const r = hero.getBoundingClientRect();
    return {
      src: video.getAttribute("src") || "",
      currentSrc: video.currentSrc,
      poster: video.getAttribute("poster") || "",
      playing: !video.paused && !video.ended && video.readyState >= 2,
      currentTime: video.currentTime,
      filter: cs.filter,
      objectFit: cs.objectFit,
      videoBox: video.getBoundingClientRect().height,
      heroHeight: r.height,
      dayLayer: day ? getComputedStyle(day).display : "missing",
      labels: labels ? getComputedStyle(labels).display : "missing",
      chips: hero.querySelectorAll(".securevision-capability-chip").length,
      h1Color: getComputedStyle(h1).color,
      eyebrow: hero.querySelector(".securevision-eyebrow")?.textContent?.trim(),
      h1Text: h1.textContent.replace(/\s+/g, " ").trim(),
      ctas: [...hero.querySelectorAll("a.btn-primary, a.btn-ghost")].map((a) =>
        a.textContent.replace(/\s+/g, " ").trim(),
      ),
    };
  });
}

function luma(rgb) {
  const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(rgb);
  return m ? (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255 : NaN;
}

async function expectHero(page, mode, label) {
  await showFilmSlide(page, label);
  await page.waitForFunction(
    (want) => {
      const v = document.querySelector("video.securevision-hero-video");
      return (
        v && (v.getAttribute("src") || "").includes(want) && v.readyState >= 2
      );
    },
    mode === "light" ? DAY : NIGHT,
    { timeout: 20000 },
  );
  const t0 = (await heroState(page)).currentTime;
  await page.waitForTimeout(700);
  const s = await heroState(page);
  assert.ok(
    s.src.includes(mode === "light" ? DAY : NIGHT),
    `${label}: film is ${s.src}`,
  );
  assert.ok(
    !s.src.includes(mode === "light" ? NIGHT : DAY),
    `${label}: other theme's film is set`,
  );
  assert.ok(
    s.poster.includes(mode === "light" ? "poster-light" : "hero-poster.jpg"),
    `${label}: poster ${s.poster}`,
  );
  assert.ok(
    s.playing && s.currentTime > t0,
    `${label}: film is not playing (t ${t0} → ${s.currentTime})`,
  );
  if (mode === "light")
    assert.equal(
      s.filter,
      "none",
      `${label}: the daylight film must not be filtered (got ${s.filter})`,
    );
  else
    assert.match(
      s.filter,
      /brightness/,
      `${label}: the night film keeps its lift`,
    );
  assert.equal(
    s.dayLayer,
    mode === "light" ? "block" : "none",
    `${label}: daylight layer ${s.dayLayer}`,
  );
  assert.equal(
    s.labels,
    mode === "light" ? "none" : "block",
    `${label}: night label overlay ${s.labels}`,
  );
  assert.equal(s.chips, 0, `${label}: capability chips still on the hero`);
  const l = luma(s.h1Color);
  if (mode === "light")
    assert.ok(
      l < 0.25,
      `${label}: headline should be navy on daylight, got ${s.h1Color}`,
    );
  else
    assert.ok(
      l > 0.85,
      `${label}: headline should be white on the night film, got ${s.h1Color}`,
    );
  assert.equal(
    s.objectFit,
    page.viewportSize().width >= 1024 ? "contain" : "cover",
  );
  assert.ok(s.videoBox > 400, `${label}: video box ${s.videoBox}px`);
  assert.ok(
    s.heroHeight >= 700,
    `${label}: hero height ${Math.round(s.heroHeight)}px — the tall treatment`,
  );
  assert.equal(s.eyebrow, "GaitAI SecureVision · Privacy-first");
  assert.match(
    s.h1Text,
    /^Privacy-aware movement intelligence for safer public spaces\.$/,
  );
  assert.deepEqual(
    s.ctas.map((c) => c.replace(/\d+/, "N")),
    ["See all N products", "Request enterprise consultation"],
  );
  checks += 1;
  return s;
}

try {
  for (const start of ["light", "dark"]) {
    const other = start === "light" ? "dark" : "light";
    const context = await browser.newContext({
      colorScheme: start,
      viewport: { width: 1440, height: 900 },
    });
    /* Seed the persisted theme once. The init script runs on EVERY navigation,
       so it must not overwrite a theme the test has since switched to — the
       reload step below relies on the toggled theme persisting. */
    await context.addInitScript((m) => {
      if (!localStorage.getItem("theme")) localStorage.setItem("theme", m);
    }, start);
    const page = await context.newPage();
    const requests = [];
    /* Whether the load event had fired when each request went out. The
       other theme's still is PREFETCHED at idle after load (HeroSlider,
       "THE OTHER THEME'S STILL"), so its presence is expected — what must
       never happen is that file competing with the LCP image before load. */
    let loaded = false;
    page.on("load", () => {
      loaded = true;
    });
    page.on("pageerror", (e) => errors.push(`${start}: ${e.message}`));
    page.on("console", (m) => {
      if (
        m.type() === "error" &&
        /hydrat|Extra attributes|did not match/i.test(m.text())
      )
        errors.push(`${start}: ${m.text()}`);
    });
    page.on("request", (r) => {
      if (r.url().includes("/assets/videos/securevision/") || r.url().includes("securevision-hero-") && r.url().includes("-premium"))
        requests.push({ path: new URL(r.url()).pathname, afterLoad: loaded });
    });
    page.on("response", (r) => {
      if (r.url().includes("/assets/videos/securevision/") && r.status() >= 400)
        errors.push(`${start}: ${r.status()} ${r.url()}`);
    });

    await page.goto(`${base}/securevision/`, { waitUntil: "networkidle" });
    await setTheme(page, start);
    const first = await expectHero(page, start, `${start} first visit`);
    const otherFile = start === "light" ? NIGHT : DAY;
    assert.ok(
      !requests.some((r) => r.path.endsWith(otherFile.split("/").pop())),
      `${start}: fetched the other theme's film: ${requests.map((r) => r.path).join(", ")}`,
    );
    const ownStill = STILLS[start].split("/").pop();
    const otherStill = STILLS[other].split("/").pop();
    assert.ok(
      requests.some((r) => r.path.endsWith(ownStill) && !r.afterLoad),
      `${start}: the ${start} still was not requested before load`,
    );
    assert.ok(
      !requests.some((r) => r.path.endsWith(otherStill) && !r.afterLoad),
      `${start}: the ${other} still was fetched BEFORE load, against the LCP image`,
    );
    await page.screenshot({
      path: `${directory}/securevision-hero-${start}-1440.png`,
      clip: { x: 0, y: 0, width: 1440, height: 900 },
      animations: "disabled",
    });
    console.log(
      `${start} @1440: ${first.src.split("/").pop()} playing, filter=${first.filter}, hero ${Math.round(first.heroHeight)}px, daylight layer ${first.dayLayer}, chips ${first.chips}.`,
    );

    /* Toggle in place: the other film, no reload. */
    await page.evaluate(() => {
      window.__svNoReload = true;
    });
    await setTheme(page, other);
    await expectHero(page, other, `${start}→${other} toggle`);
    assert.ok(
      await page.evaluate(() => window.__svNoReload === true),
      "theme toggle reloaded the page",
    );
    await page.screenshot({
      path: `${directory}/securevision-hero-${other}-after-toggle-1440.png`,
      clip: { x: 0, y: 0, width: 1440, height: 900 },
      animations: "disabled",
    });
    console.log(`${start} → ${other}: film swapped in place, no reload.`);

    /* Persisted theme, reload: right film first, other file never on the wire. */
    requests.length = 0;
    loaded = false;
    await page.reload({ waitUntil: "networkidle" });
    await expectHero(page, other, `${other} reload`);
    const wrong = other === "light" ? NIGHT : DAY;
    assert.ok(
      !requests.some((r) => r.path.endsWith(wrong.split("/").pop())),
      `${other} reload fetched ${wrong}`,
    );
    assert.ok(
      !requests.some((r) => r.path.endsWith(ownStill) && !r.afterLoad),
      `${other} reload fetched the ${start} still before load`,
    );

    /* Tablet and phone. */
    for (const [w, h] of [
      [1024, 900],
      [390, 844],
    ]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(400);
      await expectHero(page, other, `${other} @${w}`);
      await page.screenshot({
        path: `${directory}/securevision-hero-${other}-${w}.png`,
        clip: { x: 0, y: 0, width: w, height: h },
        animations: "disabled",
      });
    }
    await context.close();
  }

  assert.deepEqual(errors, [], "page / media / hydration errors");
  console.log(
    `PASS: ${checks} hero checks — the theme's still first then its film in both themes, two stills and two films, one per theme, no filter on daylight, layer/labels per theme, chips gone, copy and CTAs unchanged, no errors.`,
  );
} finally {
  await browser.close();
  server.close();
}
