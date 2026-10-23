import { test } from "node:test";
import assert from "node:assert/strict";
import { gtinChecksumValid, validateFeedText, validateRows } from "../src/feedlint.js";
import { parseDelimited } from "../src/csv.js";
const validFeed = [
  "id,title,description,link,image_link,availability,price,condition,brand,gtin",
  "SKU-1,Widget,A widget,https://example.com/p,https://example.com/i.jpg,in_stock,10.00 USD,new,Acme,4006381333931"
].join("\n");
test("valid feed passes with zero errors", () => {
  const r = validateFeedText(validFeed);
  assert.equal(r.totalRows, 1);
  assert.equal(r.errors.length, 0);
});
test("GTIN checksum accepts a known valid EAN-13", () => { assert.equal(gtinChecksumValid("4006381333931"), true); });
test("GTIN checksum rejects a changed check digit", () => { assert.equal(gtinChecksumValid("4006381333932"), false); });
test("GTIN rejects a bad length", () => { assert.equal(gtinChecksumValid("12345"), false); });
test("duplicate GTIN is flagged", () => {
  const text = validFeed + "\n" + "SKU-2,Widget2,A widget,https://example.com/p2,https://example.com/i2.jpg,in_stock,10.00 USD,new,Acme,4006381333931";
  const r = validateFeedText(text);
  assert.ok(r.errors.some(e => e.rule === "gtin_duplicate"));
});
test("invalid availability and condition are flagged", () => {
  const text = validFeed.replace("in_stock", "available").replace(",new,", ",brand new,");
  const r = validateFeedText(text);
  assert.ok(r.errors.some(e => e.rule === "invalid_availability"));
  assert.ok(r.errors.some(e => e.rule === "invalid_condition"));
});
test("placeholder brand is flagged", () => {
  const r = validateFeedText(validFeed.replace("Acme", "Generic"));
  assert.ok(r.errors.some(e => e.rule === "brand_placeholder"));
});
test("empty required attribute is flagged", () => {
  const r = validateFeedText(validFeed.replace("A widget", ""));
  assert.ok(r.errors.some(e => e.rule === "required_empty"));
});
test("missing header column is flagged", () => {
  const rows = parseDelimited("id,title\nSKU-1,Widget", ",");
  const r = validateRows(rows);
  assert.ok(r.errors.some(e => e.rule === "missing_attribute"));
});
test("TSV input is parsed", () => {
  const tsv = validFeed.replaceAll(",", "\t");
  const r = validateFeedText(tsv);
  assert.equal(r.errors.length, 0);
});
test("quoted CSV fields with commas parse correctly", () => {
  const rows = parseDelimited('a,b\n"hello, world",x', ",");
  assert.deepEqual(rows[1], ["hello, world", "x"]);
});
