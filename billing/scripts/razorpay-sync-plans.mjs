#!/usr/bin/env node
/**
 * Create (or re-use) the four Razorpay plans and write their ids into the
 * production D1 `plans` table. Run ONCE per Razorpay account/mode by the
 * founder, with the Razorpay keys in the environment — never commit them:
 *
 *   RAZORPAY_KEY_ID=rzp_test_… RAZORPAY_KEY_SECRET=… node scripts/razorpay-sync-plans.mjs [--sandbox]
 *
 * Idempotent: it lists existing plans and matches on notes.product/cycle
 * before creating. Prints the SQL it applies through `wrangler d1 execute`.
 */
import { execSync } from "node:child_process";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
if (!KEY_ID || !KEY_SECRET) {
  console.error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required (test-mode keys first).");
  process.exit(2);
}
const MONTHLY = { mobilitycare: 99900, securevision: 149900 };
const PLANS = [];
for (const product of ["mobilitycare", "securevision"]) {
  PLANS.push({ product, cycle: "monthly", period: "monthly", amount: MONTHLY[product], label: "Monthly", renews: "every month" });
  PLANS.push({ product, cycle: "annual", period: "yearly", amount: Math.round(MONTHLY[product] * 12 * 0.8), label: "Annual", renews: "every 12 months" });
}
const NAMES = { mobilitycare: "GaitAI MobilityCare", securevision: "GaitAI SecureVision" };
const auth = "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
const api = async (method, path, body) => {
  const res = await fetch(`https://api.razorpay.com${path}`, { method, headers: { authorization: auth, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${JSON.stringify(data)}`);
  return data;
};

const existing = (await api("GET", "/v1/plans?count=100")).items ?? [];
const sql = [];
for (const p of PLANS) {
  let plan = existing.find((e) => e.notes?.product === p.product && e.notes?.cycle === p.cycle && e.item?.amount === p.amount && e.period === p.period);
  if (!plan) {
    plan = await api("POST", "/v1/plans", {
      period: p.period,
      interval: 1,
      item: { name: `${NAMES[p.product]} — ${p.label}`, amount: p.amount, currency: "INR", description: `${NAMES[p.product]} subscription, billed ${p.renews}` },
      notes: { product: p.product, cycle: p.cycle },
    });
    console.log(`created ${plan.id} for ${p.product}/${p.cycle} (${p.amount} paise)`);
  } else console.log(`re-using ${plan.id} for ${p.product}/${p.cycle}`);
  sql.push(
    `INSERT INTO plans (product, cycle, provider, provider_plan_id, amount_paise, currency, created_at) VALUES ('${p.product}','${p.cycle}','razorpay','${plan.id}',${p.amount},'INR',${Math.floor(Date.now() / 1000)}) ON CONFLICT(product, cycle, provider) DO UPDATE SET provider_plan_id = excluded.provider_plan_id, amount_paise = excluded.amount_paise;`,
  );
}
const configFlag = process.argv.includes("--sandbox") ? "-c wrangler.sandbox.jsonc gaitai-billing-sandbox" : "gaitai-billing";
const cmd = `npx wrangler d1 execute ${configFlag} --remote --command "${sql.join(" ").replace(/"/g, '\\"')}"`;
console.log("\nApplying to D1:\n" + cmd);
if (!process.argv.includes("--dry-run")) execSync(cmd, { stdio: "inherit" });
