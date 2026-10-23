import { parseDelimited, detectDelimiter, rowsToObjects } from "./csv.js";
export const REQUIRED = ["id","title","description","link","image_link","availability","price","condition","brand"];
export const AVAILABILITY = new Set(["in_stock","out_of_stock","preorder","backorder"]);
export const CONDITIONS = new Set(["new","refurbished","used"]);
export const PLACEHOLDER_BRANDS = new Set(["n/a","na","generic","unknown","none","no brand","-"]);
export function gtinChecksumValid(gtin) {
  const digits = String(gtin).replace(/[\s-]/g, "");
  if (!/^\d+$/.test(digits)) return false;
  if (![8,12,13,14].includes(digits.length)) return false;
  const payload = digits.slice(0, -1);
  const check = Number(digits[digits.length - 1]);
  let sum = 0;
  const reversed = payload.split("").reverse();
  reversed.forEach((ch, i) => { sum += Number(ch) * (i % 2 === 0 ? 3 : 1); });
  const expected = (10 - (sum % 10)) % 10;
  return expected === check;
}
export function validateFeedText(text) {
  const firstLine = text.split(/\r?\n/)[0] || "";
  const delimiter = detectDelimiter(firstLine);
  const rows = parseDelimited(text, delimiter);
  return validateRows(rows);
}
export function validateRows(rows) {
  const { headers, objects } = rowsToObjects(rows);
  const errors = [];
  const add = (row, id, rule, message, fix) => errors.push({ row, id, rule, message, fix });
  for (const field of REQUIRED) {
    if (!headers.includes(field)) add(0, "", "missing_attribute", `Required attribute ${field} is missing from the header`, `Add a ${field} column to the feed`);
  }
  const seenGtin = new Map();
  objects.forEach((obj, idx) => {
    const rowNum = idx + 2;
    const id = obj.id || "";
    for (const field of REQUIRED) {
      if (headers.includes(field) && !obj[field]) add(rowNum, id, "required_empty", `Required attribute ${field} is empty`, `Provide a value for ${field}`);
    }
    if (obj.availability && !AVAILABILITY.has(obj.availability.trim().toLowerCase())) {
      add(rowNum, id, "invalid_availability", `Availability "${obj.availability}" is not an allowed value`, "Use one of in_stock, out_of_stock, preorder, backorder");
    }
    if (obj.condition && !CONDITIONS.has(obj.condition.trim().toLowerCase())) {
      add(rowNum, id, "invalid_condition", `Condition "${obj.condition}" is not an allowed value`, "Use one of new, refurbished, used");
    }
    if (obj.brand && PLACEHOLDER_BRANDS.has(obj.brand.trim().toLowerCase())) {
      add(rowNum, id, "brand_placeholder", `Brand "${obj.brand}" looks like a placeholder`, "Use the real manufacturer brand name");
    }
    if (obj.gtin) {
      const gtin = obj.gtin.replace(/[\s-]/g, "");
      if (!/^\d+$/.test(gtin) || ![8,12,13,14].includes(gtin.length)) {
        add(rowNum, id, "gtin_format", `GTIN "${obj.gtin}" must be 8, 12, 13 or 14 digits`, "Provide a valid GTIN or remove the gtin attribute");
      } else if (!gtinChecksumValid(gtin)) {
        add(rowNum, id, "gtin_checksum", `GTIN "${obj.gtin}" fails the mod-10 checksum`, "Check the GTIN digits against the product packaging");
      }
      if (seenGtin.has(gtin)) {
        add(rowNum, id, "gtin_duplicate", `GTIN "${obj.gtin}" duplicates row ${seenGtin.get(gtin)}`, "Give each distinct product its own GTIN");
      } else { seenGtin.set(gtin, rowNum); }
    }
  });
  return { headers, totalRows: objects.length, errors };
}
export function buildReport(result) {
  const counts = {};
  const fixes = {};
  for (const e of result.errors) { counts[e.rule] = (counts[e.rule] || 0) + 1; fixes[e.fix] = (fixes[e.fix] || 0) + 1; }
  const lines = [];
  lines.push("# Feed Lint Report", "");
  lines.push(`Total rows checked: ${result.totalRows}`);
  lines.push(`Total errors: ${result.errors.length}`);
  lines.push(`Status: ${result.errors.length ? "FAIL" : "PASS"}`, "");
  lines.push("## Counts per rule", "");
  if (!Object.keys(counts).length) lines.push("No errors found.");
  for (const [rule, count] of Object.entries(counts).sort((a,b)=>b[1]-a[1])) lines.push(`- ${rule}: ${count}`);
  lines.push("", "## Top fixes", "");
  if (!Object.keys(fixes).length) lines.push("Nothing to fix.");
  for (const [fix, count] of Object.entries(fixes).sort((a,b)=>b[1]-a[1]).slice(0,10)) lines.push(`- (${count}) ${fix}`);
  lines.push("");
  return lines.join("\n");
}
