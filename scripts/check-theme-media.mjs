#!/usr/bin/env node
/**
 * GaitAI THEME-MEDIA CHECKER
 * =============================================================================
 * Dark mode ships the original renders; light mode ships a `-light` companion
 * of each one. The registry in src/lib/theme-media.ts records, for every film
 * and themed diagram, either both files or the reason one dark file is shown
 * in both themes. This script makes sure the registry and the disk agree, so
 * a new video cannot quietly ship dark-only into light mode.
 *
 *   ERRORS  (exit 1)
 *     - a registered dark file, poster or light file that does not exist
 *     - a video under public/assets/videos that is not registered at all
 *     - a pair whose light file has different dimensions / frame count /
 *       duration from the dark one (only when ffprobe is on PATH)
 *   WARNINGS (exit 0 unless --strict)
 *     - a pair whose light companion is missing: the page falls back to the
 *       dark file, and this is the loud notice the fallback is supposed to
 *       come with
 *     - a `-light` file on disk that no entry references
 *
 * Run through tsx so the .ts registry imports natively:
 *
 *   npm run check:media              # prebuild: warn on missing companions
 *   npm run check:media -- --strict  # verify/CI: missing companions fail
 * =============================================================================
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const STRICT = process.argv.includes("--strict");
const root = process.cwd();
const PUBLIC = path.join(root, "public");
const VIDEO_ROOT = path.join(PUBLIC, "assets", "videos");
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".m4v"]);

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const onDisk = (p) => existsSync(path.join(PUBLIC, p));
const lightOf = (p) => p.replace(/(\.[a-z0-9]+)$/i, "-light$1");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function probe(rel) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries", "stream=width,height,nb_read_frames:format=duration", "-of", "json", path.join(PUBLIC, rel)],
    { encoding: "utf8" },
  );
  if (r.status !== 0) return null;
  const j = JSON.parse(r.stdout);
  const s = j.streams?.[0];
  if (!s) return null;
  return { width: s.width, height: s.height, frames: Number(s.nb_read_frames), duration: Number(j.format.duration) };
}

const hasFfprobe = spawnSync("ffprobe", ["-version"], { encoding: "utf8" }).status === 0;

async function main() {
  const modPath = path.join(root, "src", "lib", "theme-media.ts");
  if (!existsSync(modPath)) throw new Error("missing src/lib/theme-media.ts");
  const { themeMedia } = await import(pathToFileURL(modPath).href);

  const entries = Object.entries(themeMedia);
  const registeredDark = new Set();
  const registeredLight = new Set();
  let pairs = 0;
  let islands = 0;

  for (const [key, entry] of entries) {
    registeredDark.add(entry.dark);
    if (!onDisk(entry.dark)) err(`${key}: dark file missing on disk: ${entry.dark}`);

    if (entry.kind === "island") {
      islands++;
      if (!entry.island || entry.island.trim().length < 20) err(`${key}: an island needs a real reason for staying dark in light mode`);
      if (entry.darkPoster) {
        registeredDark.add(entry.darkPoster);
        if (!onDisk(entry.darkPoster)) err(`${key}: poster missing on disk: ${entry.darkPoster}`);
      }
      continue;
    }

    pairs++;
    registeredLight.add(entry.light);
    if (entry.light === entry.dark) err(`${key}: pair with identical dark and light paths — make it an island with a reason`);
    if (!onDisk(entry.light)) {
      warn(
        `Missing light-theme ${entry.type}:\n      ${path.posix.basename(entry.dark)}\n    Expected:\n      ${entry.light}\n    (light mode falls back to the dark file until it exists)`,
      );
    } else if (hasFfprobe && entry.type === "video") {
      const a = probe(entry.dark);
      const b = probe(entry.light);
      if (a && b) {
        // A pair with `timing: "own"` is a separate light edit: same frame
        // size (the layout depends on it), its own length (ThemeVideo resumes
        // modulo duration). Everything else must match frame for frame.
        const sameBox = a.width === b.width && a.height === b.height;
        const sameTiming = a.frames === b.frames && Math.abs(a.duration - b.duration) < 0.05;
        if (!sameBox || (!sameTiming && entry.timing !== "own")) {
          err(
            `${key}: light companion does not match the dark film — dark ${a.width}x${a.height} ${a.frames}f ${a.duration.toFixed(2)}s, light ${b.width}x${b.height} ${b.frames}f ${b.duration.toFixed(2)}s${sameBox ? ' (set timing: "own" on the entry if the light film is a separate edit)' : ""}`,
          );
        }
      }
    }
    if (entry.poster) {
      registeredDark.add(entry.poster.dark);
      registeredLight.add(entry.poster.light);
      if (!onDisk(entry.poster.dark)) err(`${key}: dark poster missing on disk: ${entry.poster.dark}`);
      if (!onDisk(entry.poster.light)) {
        warn(`Missing light-theme poster:\n      ${path.posix.basename(entry.poster.dark)}\n    Expected:\n      ${entry.poster.light}`);
      }
    } else if (entry.type === "video") {
      warn(`${key}: video pair without posters — a light visitor sees nothing until the first frame decodes`);
    }
    if (entry.mobile) {
      for (const p of [entry.mobile.dark, entry.mobile.light]) {
        if (!onDisk(p)) err(`${key}: mobile variant missing on disk: ${p}`);
      }
    }
  }

  /* Discovery: every video on disk must be accounted for. */
  const videoFiles = existsSync(VIDEO_ROOT) ? walk(VIDEO_ROOT).filter((f) => VIDEO_EXT.has(path.extname(f).toLowerCase())) : [];
  const unregistered = [];
  const orphanLight = [];
  for (const abs of videoFiles) {
    const rel = "/" + path.relative(PUBLIC, abs).split(path.sep).join("/");
    // A light file is one an entry names as its light companion — usually
    // the `-light` convention, but a supplied edit may keep its own name
    // (the console films' `*-light-no-overlap.mp4`).
    const isLight = registeredLight.has(rel) || /-light\.[a-z0-9]+$/i.test(rel);
    if (isLight) {
      if (!registeredLight.has(rel)) orphanLight.push(rel);
    } else if (!registeredDark.has(rel)) {
      unregistered.push(rel);
    }
  }
  for (const rel of unregistered) {
    const light = lightOf(rel);
    err(
      `Unregistered video: ${rel}\n    Add it to src/lib/theme-media.ts as a pair (light: ${light}${onDisk(light) ? ", which exists" : ", which does NOT exist yet — render it with scripts/theme-media/render_light.py"}) or as an island with the reason it stays dark.`,
    );
  }
  for (const rel of orphanLight) warn(`Light file on disk that no entry references: ${rel}`);

  /* Report. */
  const videos = videoFiles.filter((f) => {
    const rel = "/" + path.relative(PUBLIC, f).split(path.sep).join("/");
    return !registeredLight.has(rel) && !/-light\.[a-z0-9]+$/i.test(rel);
  }).length;
  console.log(`theme-media: ${entries.length} entries (${pairs} pairs, ${islands} islands), ${videos} dark videos on disk${hasFfprobe ? ", ffprobe geometry check on" : ", ffprobe not found — geometry check skipped"}`);
  for (const w of warnings) console.log(`\n  WARNING  ${w}`);
  for (const e of errors) console.log(`\n  ERROR    ${e}`);
  const failing = errors.length + (STRICT ? warnings.length : 0);
  console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)${STRICT ? " [strict: warnings fail]" : ""}`);
  process.exit(failing ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
