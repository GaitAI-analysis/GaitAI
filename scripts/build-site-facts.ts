import { FOUNDER_ACADEMIC_RECORD } from "../src/data/publications";
import fs from "node:fs";
import path from "node:path";
import { siteCounts, terminology } from "../src/data/registry";
import { allProducts, industryUseCases } from "../src/data/products";
import { useCaseHrefById } from "../src/data/usecase-details";

const facts = {
  counts: siteCounts,
  terminology,
  founderAcademicRecord: FOUNDER_ACADEMIC_RECORD,
  products: allProducts.map(({ id, short, vertical, navigation }) => ({ id, label: short, href: `/${vertical}/${id}/`, vertical, navigation: Boolean(navigation) })),
  environments: industryUseCases.map(({ id, industry, vertical, footer }) => ({ id, label: industry, href: useCaseHrefById(id), vertical, footer: Boolean(footer) })),
};
const target = path.resolve("src/data/generated/site-facts.json");
const content = JSON.stringify(facts, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== content) {
    throw new Error("Site facts are stale. Run npm run build:facts.");
  }
} else {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
console.log(JSON.stringify(siteCounts, null, 2));
