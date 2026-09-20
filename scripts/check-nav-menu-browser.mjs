import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { serve } from "./audit-server.mjs";

/**
 * The desktop dropdowns, in a real browser: closed means gone.
 *
 * For every way a menu can close — pointer leaving, a click anywhere else,
 * Escape from the keyboard or with no focus in the menu, the theme changing
 * in either direction, a route change and back, a reload — this asserts two
 * things. First, structurally: no panel element is left in the DOM, and the
 * trigger says `aria-expanded="false"`. Second, optically: the pixels where
 * the panel was are IDENTICAL to a page on which the menu was never opened,
 * so no fade, blur layer or transparent remnant survives. The optical check
 * is what a screenshot would show; the structural check is why.
 *
 * It also proves the stack: header above hero, open panel above hero and
 * opaque, Ask GaitAI's launcher its own floating layer above the page and
 * below the header's dropdown when both overlap.
 *
 *   QA_CHROMIUM=<chromium or msedge executable> GAITAI_AUDIT_OUT=out \
 *     npx tsx scripts/check-nav-menu-browser.mjs
 *
 * Run it twice — the Playwright headless shell and real Edge — because the
 * failure this guards against (a compositor ghost of a backdrop-filter layer)
 * only ever shows in a real compositor.
 */

const require = createRequire(import.meta.url);
const { chromium } = require("../tmp/qa/node_modules/playwright");
/* NAV_CHECK_BASE=https://gaitai.in runs the same checks against a deployed
   site instead of the served export. */
const live = process.env.NAV_CHECK_BASE;
const { server, base } = live
  ? { server: { close() {} }, base: live.replace(/\/$/, "") }
  : await serve();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.QA_CHROMIUM,
});
const directory = "tmp/nav-menu-audit";
fs.mkdirSync(directory, { recursive: true });

/* Where the Products panel lives at 1440 — generous margins on every side so
   a shadow, a border or an off-by-a-few-pixels shift would be caught too. */
const REGION = { x: 380, y: 56, width: 520, height: 300 };
const errors = [];
let checks = 0;

async function diffRegion(page, a, b) {
  return await page.evaluate(
    async ([A, B]) => {
      const load = async (b64) =>
        createImageBitmap(
          await (await fetch("data:image/png;base64," + b64)).blob(),
        );
      const [ia, ib] = await Promise.all([load(A), load(B)]);
      const c = document.createElement("canvas");
      c.width = ia.width;
      c.height = ia.height;
      const g = c.getContext("2d");
      g.drawImage(ia, 0, 0);
      const da = g.getImageData(0, 0, c.width, c.height).data;
      g.clearRect(0, 0, c.width, c.height);
      g.drawImage(ib, 0, 0);
      const db = g.getImageData(0, 0, c.width, c.height).data;
      let changed = 0;
      let max = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d =
          Math.abs(da[i] - db[i]) +
          Math.abs(da[i + 1] - db[i + 1]) +
          Math.abs(da[i + 2] - db[i + 2]);
        if (d > 12) changed += 1;
        if (d > max) max = d;
      }
      return { changed, pct: (100 * changed) / (da.length / 4), max };
    },
    [a.toString("base64"), b.toString("base64")],
  );
}

async function themeIs(page, target) {
  return page.evaluate(
    (t) => document.documentElement.classList.contains(t),
    target,
  );
}

/* The toggle cycles Light → Dark → System; System follows the OS. Click until
   the <html> class is the one asked for, never assume one click is one theme. */
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

async function panelCount(page) {
  return page.locator("[data-nav-menu]").count();
}

async function expectClosed(page, label, baseline, trigger) {
  /* Let any exit animation finish (120ms) and the compositor settle. */
  await page.waitForTimeout(450);
  assert.equal(
    await panelCount(page),
    0,
    `${label}: a panel element is still in the DOM`,
  );
  assert.equal(
    await trigger.getAttribute("aria-expanded"),
    "false",
    `${label}: aria-expanded`,
  );
  const shot = await page.screenshot({ clip: REGION, animations: "disabled" });
  const d = await diffRegion(page, baseline, shot);
  /* A ghost is not subtle to this test. A panel at even 5% opacity over the
     photograph moves ~30% of the region's pixels; a hairline hover underline
     moved 77. Two live pages in a real compositor can differ by a handful of
     pixels at Δ<30 (image decode, subpixel AA) with nothing on screen — seen
     once on gaitai.in, 14 px — so the bar is one tenth of one percent, and
     any noise under it is printed rather than hidden. */
  if (d.pct >= 0.1)
    fs.writeFileSync(
      `${directory}/FAIL-${label.replace(/[^a-z0-9]+/gi, "-")}.png`,
      shot,
    );
  assert.ok(
    d.pct < 0.1,
    `${label}: ${d.pct.toFixed(3)}% of the panel region differs from never-opened (${d.changed} px, max Δ${d.max})`,
  );
  if (d.changed)
    console.log(
      `  (${label}: ${d.changed} px of decode noise, max Δ${d.max} — under the 0.1% bar)`,
    );
  checks += 1;
}

async function openByHover(page, trigger) {
  await trigger.hover();
  await page.waitForFunction(
    () => document.querySelector("[data-nav-menu]") !== null,
  );
  await page.waitForTimeout(250);
  assert.equal(await trigger.getAttribute("aria-expanded"), "true");
}

async function freshPage(context, theme) {
  const page = await context.newPage();
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await setTheme(page, theme);
  await page.mouse.move(720, 640);
  await page.waitForTimeout(600);
  return page;
}

try {
  for (const start of ["light", "dark"]) {
    const other = start === "light" ? "dark" : "light";
    const context = await browser.newContext({
      colorScheme: start,
      viewport: { width: 1440, height: 900 },
    });
    await context.addInitScript((m) => localStorage.setItem("theme", m), start);
    const page = await freshPage(context, start);
    page.on("pageerror", (e) => errors.push(`${start}: ${e.message}`));
    page.on("console", (m) => {
      if (
        m.type() === "error" &&
        /hydrat|Extra attributes|did not match/i.test(m.text())
      )
        errors.push(`${start}: ${m.text()}`);
    });
    const products = page.getByRole("link", { name: /^Products/ }).first();

    /* Baselines: the region with the menu never opened, in each theme. */
    const baseline = await page.screenshot({
      clip: REGION,
      animations: "disabled",
    });
    const otherPage = await freshPage(context, other);
    const otherBaseline = await otherPage.screenshot({
      clip: REGION,
      animations: "disabled",
    });
    await otherPage.close();
    await setTheme(page, start);
    await page.mouse.move(720, 640);
    await page.waitForTimeout(400);
    assert.equal(await panelCount(page), 0, `${start}: closed on load`);

    /* ── Open: above the hero, opaque, its own layer ── */
    await openByHover(page, products);
    const open = await page.evaluate(() => {
      const panel = document.querySelector("[data-nav-menu] > div");
      const wrap = panel.parentElement;
      const cs = getComputedStyle(panel);
      const r = panel.getBoundingClientRect();
      const mid = document.elementFromPoint(
        r.x + r.width / 2,
        r.y + r.height / 2,
      );
      return {
        bg: cs.backgroundColor,
        backdrop: cs.backdropFilter,
        isolation: cs.isolation,
        wrapZ: getComputedStyle(wrap).zIndex,
        headerZ: getComputedStyle(document.querySelector("header")).zIndex,
        headerPos: getComputedStyle(document.querySelector("header")).position,
        midIsInPanel: !!mid && panel.contains(mid),
        box: [
          Math.round(r.x),
          Math.round(r.y),
          Math.round(r.width),
          Math.round(r.height),
        ],
      };
    });
    const alpha =
      /rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*([\d.]+))?\)/.exec(
        open.bg,
      )?.[1];
    if (start === "light")
      assert.ok(
        alpha === undefined || Number(alpha) === 1,
        `${start}: panel surface must be opaque, got ${open.bg}`,
      );
    else
      assert.ok(
        alpha === undefined || Number(alpha) >= 0.97,
        `${start}: panel surface ${open.bg}`,
      );
    assert.equal(
      open.backdrop,
      "none",
      `${start}: the panel must not backdrop-filter`,
    );
    assert.equal(open.isolation, "isolate");
    assert.equal(open.headerPos, "fixed");
    assert.equal(open.headerZ, "50");
    assert.ok(
      open.midIsInPanel,
      `${start}: the open panel is not the topmost thing at its own centre`,
    );
    await page.screenshot({
      path: `${directory}/${start}-open.png`,
      clip: { x: 0, y: 0, width: 1440, height: 520 },
      animations: "disabled",
    });
    console.log(
      `${start}: open panel bg=${open.bg} backdrop=${open.backdrop} z=${open.wrapZ} in header z=${open.headerZ}; topmost at its centre.`,
    );

    /* ── Close paths ── */
    await page.mouse.move(720, 640);
    await expectClosed(page, `${start} hover-out`, baseline, products);

    await openByHover(page, products);
    await page.mouse.click(720, 640); // click-outside, on the hero
    await expectClosed(page, `${start} click-outside`, baseline, products);

    await openByHover(page, products);
    await page.keyboard.press("Escape"); // no focus inside the menu
    /* Closed at once, even though the pointer is still resting on the trigger
       — and it must STAY closed while the pointer sits there (mouseenter has
       already fired; nothing may reopen it). */
    await page.waitForTimeout(300);
    assert.equal(
      await panelCount(page),
      0,
      `${start}: Escape did not close a pointer-opened menu`,
    );
    await page.waitForTimeout(400);
    assert.equal(
      await panelCount(page),
      0,
      `${start}: the menu reopened under a resting pointer after Escape`,
    );
    /* The trigger's own hover underline is legitimately lit while the pointer
       rests on it; move off before comparing pixels to the never-opened page. */
    await page.mouse.move(720, 640);
    await expectClosed(
      page,
      `${start} Escape (pointer-opened)`,
      baseline,
      products,
    );

    await page.mouse.move(720, 640);
    await products.focus(); // keyboard open
    await page.waitForFunction(
      () => document.querySelector("[data-nav-menu]") !== null,
    );
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    assert.equal(
      await panelCount(page),
      0,
      `${start}: Escape did not close a keyboard-opened menu`,
    );
    /* Focus correctly stays on the trigger after Escape, and its focus ring
       and underline are legitimately lit. Release focus (as tabbing on would)
       before the pixel comparison; releasing it must not reopen anything. */
    await page.evaluate(
      () =>
        document.activeElement instanceof HTMLElement &&
        document.activeElement.blur(),
    );
    await expectClosed(
      page,
      `${start} Escape (keyboard-opened)`,
      baseline,
      products,
    );

    /* Theme change with the menu OPEN: it must close, and the region must
       match a page that loaded in the other theme and never opened it — and
       while the theme flips, no panel may reappear for even a frame. */
    await openByHover(page, products);
    const frames = [];
    const toggle = page.getByRole("button", { name: /^Theme:/ }).first();
    await toggle.click();
    for (let i = 0; i < 16; i += 1) {
      frames.push(await panelCount(page));
      await page.waitForTimeout(40);
    }
    assert.ok(
      frames.slice(3).every((n) => n === 0),
      `${start}: a panel was present during the theme transition (${frames.join(",")})`,
    );
    await setTheme(page, other);
    await page.mouse.move(720, 640);
    await expectClosed(
      page,
      `${start}→${other} switch while open`,
      otherBaseline,
      products,
    );
    console.log(
      `${start} → ${other}: menu closed on switch, region identical to a fresh ${other} page.`,
    );

    /* And back, with the menu CLOSED, against the original baseline. */
    await setTheme(page, start);
    await page.mouse.move(720, 640);
    await expectClosed(
      page,
      `${other}→${start} switch while closed`,
      baseline,
      products,
    );

    /* Route change: pick a menu item, land on it closed, come back closed. */
    await openByHover(page, products);
    await page
      .locator("[data-nav-menu]")
      .getByRole("link", { name: /^MobilityCare/ })
      .click();
    await page.waitForURL(/\/mobilitycare\/?$/);
    await page.waitForTimeout(400);
    assert.equal(
      await panelCount(page),
      0,
      `${start}: panel survived the route change`,
    );
    await page.goBack({ waitUntil: "networkidle" });
    await page.mouse.move(720, 640);
    await expectClosed(
      page,
      `${start} route change and back`,
      baseline,
      products,
    );

    /* Reload. */
    await page.reload({ waitUntil: "networkidle" });
    await page.mouse.move(720, 640);
    await expectClosed(page, `${start} reload`, baseline, products);

    /* ── The stack ── */
    const stack = await page.evaluate(() => {
      const at = (x, y) => document.elementFromPoint(x, y);
      const header = document.querySelector("header");
      const hero = document.querySelector("main section");
      const launcher = document.querySelector('[class*="launcher"]');
      const lr = launcher?.getBoundingClientRect();
      const heroHit = at(720, 640);
      const headerHit = at(190, 44);
      const launcherHit = lr
        ? at(lr.x + lr.width / 2, lr.y + lr.height / 2)
        : null;
      const z = (el) => {
        for (let e = el; e; e = e.parentElement) {
          const v = getComputedStyle(e).zIndex;
          if (v !== "auto" && getComputedStyle(e).position !== "static")
            return Number(v);
        }
        return 0;
      };
      return {
        headerHitInHeader: !!headerHit && header.contains(headerHit),
        heroHitInHero:
          !!heroHit &&
          !!hero &&
          hero.contains(heroHit) &&
          !header.contains(heroHit),
        launcherPresent: !!launcher,
        launcherHitInLauncher:
          !!launcherHit && !!launcher && launcher.contains(launcherHit),
        headerZ: z(header),
        launcherZ: launcher ? z(launcher) : null,
        heroZ: hero ? z(hero) : null,
      };
    });
    assert.ok(
      stack.headerHitInHeader,
      `${start}: header is not topmost at its own logo`,
    );
    assert.ok(
      stack.heroHitInHero,
      `${start}: the hero is not what the pointer meets below the header`,
    );
    assert.ok(
      stack.launcherPresent && stack.launcherHitInLauncher,
      `${start}: Ask GaitAI launcher is not clickable at its centre`,
    );
    assert.ok(
      stack.headerZ > stack.heroZ,
      `${start}: header z ${stack.headerZ} must beat hero z ${stack.heroZ}`,
    );
    console.log(
      `${start}: stack — header z${stack.headerZ} > hero z${stack.heroZ}; Ask launcher z${stack.launcherZ}, clickable.`,
    );

    await context.close();
  }

  assert.deepEqual(errors, [], "page / hydration errors");
  console.log(
    `PASS: ${checks} closed-state checks, each pixel-identical to never-opened; both theme directions; no errors.`,
  );
} finally {
  await browser.close();
  server.close();
}
