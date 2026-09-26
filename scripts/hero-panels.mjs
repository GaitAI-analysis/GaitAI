#!/usr/bin/env node
/**
 * THE HERO'S PANEL ENCODER
 * =============================================================================
 * Turns three source photographs into the responsive AVIF/WebP sets the
 * homepage hero serves, and writes a manifest of what it actually produced.
 *
 *     npm run hero:panels
 *
 * ── THE CONTRACT ──────────────────────────────────────────────────────────
 * Sources live in `assets/hero/src/` and are named for the panel and the
 * theme they belong to:
 *
 *     gaitai-dark.png        mobilitycare-dark.png        securevision-dark.png
 *     gaitai-light.png       mobilitycare-light.png       securevision-light.png
 *
 * Any still format ffmpeg reads will do (PNG, JPEG, TIFF, WebP, AVIF). Each is
 * centre-cropped to its panel's aspect ratio — the panel's box in
 * src/lib/hero-panels.ts, e.g. 810x887 for GaitAI — then encoded at every step
 * of the width ladder in both formats.
 *
 * ── IT NEVER UPSCALES ─────────────────────────────────────────────────────
 * A step wider than the source would be invented detail, which is the whole
 * defect this rebuild exists to remove. So the encoder emits only the steps the
 * source can actually fill, records them in the manifest, and the hero's
 * `srcset` is built from the manifest — never from the wished-for ladder. A
 * source that cannot reach the top step is a hard error unless `--interim` is
 * passed, and even then it is reported loudly, per panel, with the shortfall.
 *
 * ── THE MANIFEST ──────────────────────────────────────────────────────────
 * `src/data/hero-panels.generated.json` records, per panel and theme, the
 * widths on disk and the source's own size. It is committed, because the site
 * is a static export and the build must not depend on the encoder having been
 * run on the machine doing the building.
 */

import { execFile } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FFMPEG = process.env.FFMPEG || "ffmpeg";
const FFPROBE = process.env.FFPROBE || "ffprobe";

const SRC_DIR = path.join(root, "assets", "hero", "src");
const OUT_DIR = path.join(root, "public", "images", "hero", "panels");
const MANIFEST = path.join(root, "src", "data", "hero-panels.generated.json");

const CANVAS_HEIGHT = 887;
const THEMES = ["dark", "light"];

/* Kept in step with HERO_PANEL_ASSETS in src/lib/hero-panels.ts by
   scripts/check-hero.mjs, which fails if the two disagree. */
const PANELS = [
  { id: "gaitai", width: 810 },
  { id: "mobilitycare", width: 805 },
  { id: "securevision", width: 668 },
];
const WIDTHS = [480, 720, 1024, 1280, 1600, 2000, 2400];

const FORMATS = [
  {
    ext: "avif",
    /* libaom still-picture. crf 30 is visually clean on photography at these
       sizes; cpu-used 4 is the slowest setting that still encodes six files in
       a reasonable time. */
    args: ["-c:v", "libaom-av1", "-still-picture", "1", "-crf", "30", "-cpu-used", "4", "-pix_fmt", "yuv420p"],
  },
  {
    ext: "webp",
    args: ["-c:v", "libwebp", "-quality", "82", "-compression_level", "6", "-pix_fmt", "yuv420p"],
  },
];

const interim = process.argv.includes("--interim");

async function probe(file) {
  const { stdout } = await run(FFPROBE, [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-of", "csv=p=0",
    file,
  ]);
  const [width, height] = stdout.trim().split(",").map(Number);
  if (!width || !height) throw new Error(`could not read dimensions of ${file}`);
  return { width, height };
}

/** The centre crop that takes a source to the panel's exact aspect ratio. */
function centreCrop(source, aspect) {
  const sourceAspect = source.width / source.height;
  if (sourceAspect > aspect) {
    const w = Math.round(source.height * aspect);
    return { w, h: source.height, x: Math.round((source.width - w) / 2), y: 0 };
  }
  const h = Math.round(source.width / aspect);
  return { w: source.width, h, x: 0, y: Math.round((source.height - h) / 2) };
}

const even = (n) => (n % 2 === 0 ? n : n + 1);

async function findSource(id, theme) {
  if (!existsSync(SRC_DIR)) return null;
  const entries = await readdir(SRC_DIR);
  const stem = `${id}-${theme}.`;
  const hit = entries.find((e) => e.toLowerCase().startsWith(stem));
  return hit ? path.join(SRC_DIR, hit) : null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const manifest = { generated: new Date().toISOString(), panels: {} };
  const shortfalls = [];
  const missing = [];

  for (const panel of PANELS) {
    const aspect = panel.width / CANVAS_HEIGHT;
    manifest.panels[panel.id] = {};

    for (const theme of THEMES) {
      const source = await findSource(panel.id, theme);
      if (!source) {
        missing.push(`${panel.id}-${theme}`);
        continue;
      }
      const size = await probe(source);
      const crop = centreCrop(size, aspect);
      const top = WIDTHS[WIDTHS.length - 1];
      const widths = WIDTHS.filter((w) => w <= crop.w);
      /* If the source stops between two steps, its OWN width becomes the top
         step. Falling back to the ladder step below it would throw away real
         pixels the file holds, and this is still never an upscale. */
      if (crop.w < top && !widths.includes(crop.w)) widths.push(crop.w);

      if (widths.length === 0) {
        throw new Error(
          `${panel.id}-${theme}: source crops to ${crop.w}px, narrower than the smallest step (${WIDTHS[0]}px).`,
        );
      }
      if (crop.w < top) {
        shortfalls.push(
          `  ${panel.id}-${theme}: ${size.width}x${size.height} crops to ${crop.w}px ` +
            `— ${top - crop.w}px short of the ${top}px top step. ` +
            `Serving up to ${widths[widths.length - 1]}px.`,
        );
      }

      for (const width of widths) {
        const height = even(Math.round(width / aspect));
        for (const format of FORMATS) {
          const out = path.join(OUT_DIR, `${panel.id}-${theme}-${width}.${format.ext}`);
          await run(FFMPEG, [
            "-y", "-loglevel", "error",
            "-i", source,
            "-vf", `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y},scale=${even(width)}:${height}:flags=lanczos`,
            "-frames:v", "1",
            ...format.args,
            out,
          ]);
        }
        process.stdout.write(`  ${panel.id}-${theme}-${width}  avif+webp\n`);
      }

      manifest.panels[panel.id][theme] = {
        widths,
        source: { width: size.width, height: size.height },
        cropped: { width: crop.w, height: crop.h },
      };
    }
  }

  if (missing.length) {
    throw new Error(
      `No source photograph for: ${missing.join(", ")}.\n` +
        `Put them in assets/hero/src/ — see docs/hero-panels.md.`,
    );
  }

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`\nmanifest → ${path.relative(root, MANIFEST)}`);

  if (shortfalls.length) {
    const message =
      `\nSOURCES BELOW THE TARGET RESOLUTION — the hero will be soft at 2x:\n` +
      `${shortfalls.join("\n")}\n` +
      `Nothing was upscaled; the srcset simply stops at what the sources hold.\n`;
    if (!interim) {
      throw new Error(`${message}\nRe-run with --interim to accept this deliberately.`);
    }
    console.warn(message);
  }
}

main().catch((error) => {
  console.error(`\nhero:panels failed — ${error.message}`);
  process.exitCode = 1;
});
