/**
 * ASK GAITAI PREFLIGHT — why is the assistant not on the site?
 *
 * The assistant self-disables when it has no backend: `ASSISTANT_ENABLED` is
 * false and `<AskGaitAI />` renders null, so the site looks exactly as it did
 * before. That is the right default for a fresh clone, and it is also a silent
 * failure mode — a deploy can be perfectly green with the launcher absent, and
 * nothing anywhere says so.
 *
 * This says so. It checks the four things that have to be true, names the one
 * that is not, and prints the command that fixes it.
 *
 *   npm run ask:doctor
 *   npm run ask:doctor -- https://asia-south1-…/askGaitai   (check a URL)
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const ok = (m) => console.log(`  [32mok[0m    ${m}`);
const bad = (m) => console.log(`  [31mMISSING[0m  ${m}`);
const warn = (m) => console.log(`  [33mnote[0m  ${m}`);

/** Read a key out of .env.local without pulling in a dotenv dependency. */
function fromEnvFile(key) {
  const file = resolve(root, ".env.local");
  if (!existsSync(file)) return "";
  const line = readFileSync(file, "utf8")
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith(`${key}=`));
  return line ? line.slice(line.indexOf("=") + 1).trim() : "";
}

console.log("\nAsk GaitAI — preflight\n");

let blocked = 0;

/* 1 · the corpus ---------------------------------------------------------- */
const corpus = resolve(root, "functions/knowledge.json");
if (existsSync(corpus)) {
  const { size, mtime } = statSync(corpus);
  const records = JSON.parse(readFileSync(corpus, "utf8"));
  /* The corpus is an object keyed by section, not a flat array — count the
     records inside whichever shape it has rather than guessing one. */
  const count = Array.isArray(records)
    ? records.length
    : (records?.documents?.length ??
       records?.records?.length ??
       Object.values(records).filter(Array.isArray).flat().length);
  ok(
    `corpus: ${count ?? "?"} records, ${Math.round(size / 1024)} KB, built ${mtime
      .toISOString()
      .slice(0, 16)
      .replace("T", " ")}`,
  );
} else {
  blocked += 1;
  bad("corpus: functions/knowledge.json absent");
  console.log("        fix: npm run build:knowledge");
}

/* 2 · the client's endpoint ----------------------------------------------- */
const endpoint = (
  process.argv[2] ||
  process.env.NEXT_PUBLIC_ASK_GAITAI_ENDPOINT ||
  fromEnvFile("NEXT_PUBLIC_ASK_GAITAI_ENDPOINT") ||
  ""
).trim();

if (endpoint) {
  ok(`endpoint configured: ${endpoint}`);
} else {
  blocked += 1;
  bad("endpoint: NEXT_PUBLIC_ASK_GAITAI_ENDPOINT is empty");
  console.log("        the assistant does not mount at all without it");
  console.log("        local:  add it to .env.local");
  console.log(
    "        deploy: Repo -> Settings -> Secrets and variables -> Actions",
  );
  console.log("                -> Variables -> NEXT_PUBLIC_ASK_GAITAI_ENDPOINT");
}

/* 3 · does the backend answer? -------------------------------------------- */
if (endpoint) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        /* The function requires an Origin and checks it against an allowlist,
           so a preflight without one is refused for the right reason. */
        Origin: "https://gaitai.in",
      },
      body: JSON.stringify({ message: "preflight", pathname: "/" }),
      signal: AbortSignal.timeout(20000),
    });

    if (response.ok) {
      ok(`backend answered ${response.status}`);
    } else if (response.status === 404) {
      blocked += 1;
      bad(`backend: 404 — no function is deployed at that URL`);
      console.log("        fix: firebase deploy --only functions");
      console.log("        (needs the Blaze plan and LLM_API_KEY in Secret Manager)");
    } else if (response.status === 403) {
      blocked += 1;
      bad("backend: 403 — the origin is not on ALLOWED_ORIGINS");
      console.log("        fix: functions/src/index.ts, then redeploy");
    } else {
      blocked += 1;
      bad(`backend: HTTP ${response.status}`);
    }
  } catch (error) {
    blocked += 1;
    bad(`backend unreachable: ${error.message}`);
  }
} else {
  warn("backend: not checked — no endpoint to check");
}

/* 4 · the rate-limit rules ------------------------------------------------- */
const rules = readFileSync(resolve(root, "firestore.rules"), "utf8");
if (rules.includes("askGaitaiRateLimits")) {
  ok("firestore.rules covers askGaitaiRateLimits");
} else {
  warn("firestore.rules has no askGaitaiRateLimits block");
}
if (rules.includes("assistantStats")) {
  ok("firestore.rules covers assistantStats (usage counters)");
} else {
  warn("firestore.rules has no assistantStats block — counters will be denied");
}

console.log(
  blocked === 0
    ? "\nAll clear: a build from here ships the assistant.\n"
    : `\n${blocked} blocker${blocked === 1 ? "" : "s"}. The launcher will not appear until they are cleared.\n`,
);

process.exit(blocked === 0 ? 0 : 1);
