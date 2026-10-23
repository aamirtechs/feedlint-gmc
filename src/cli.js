#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { validateFeedText, buildReport } from "./feedlint.js";
import { escapeCsv } from "./csv.js";
function usage() { console.error("Usage: feedlint-gmc <feed.csv|feed.tsv> [--out-dir DIR] [--errors FILE] [--report FILE]"); }
const args = process.argv.slice(2);
if (!args.length || args.includes("--help") || args.includes("-h")) { usage(); process.exit(args.length ? 0 : 2); }
let input = null, outDir = ".", errorsFile = null, reportFile = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--out-dir") outDir = args[++i];
  else if (args[i] === "--errors") errorsFile = args[++i];
  else if (args[i] === "--report") reportFile = args[++i];
  else if (!input) input = args[i];
  else { usage(); process.exit(2); }
}
if (!input) { usage(); process.exit(2); }
const text = readFileSync(input, "utf8");
const result = validateFeedText(text);
errorsFile = errorsFile ? resolve(errorsFile) : join(resolve(outDir), "errors.csv");
reportFile = reportFile ? resolve(reportFile) : join(resolve(outDir), "report.md");
mkdirSync(dirname(errorsFile), { recursive: true });
mkdirSync(dirname(reportFile), { recursive: true });
const csvLines = ["row,id,rule,message,fix"];
for (const e of result.errors) csvLines.push([e.row, e.id, e.rule, e.message, e.fix].map(escapeCsv).join(","));
writeFileSync(errorsFile, csvLines.join("\n") + "\n");
writeFileSync(reportFile, buildReport(result));
console.log(`Checked ${result.totalRows} rows, found ${result.errors.length} errors.`);
console.log(`Wrote ${errorsFile}`);
console.log(`Wrote ${reportFile}`);
process.exit(result.errors.length ? 1 : 0);
