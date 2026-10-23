# feedlint-gmc
Live page: https://aamirtechs.github.io/feedlint-gmc/

Validate a Google Merchant Center product feed (CSV or TSV) locally against the rules that get products disapproved: GTIN checksum and duplicates, required attributes, invalid condition or availability values, and placeholder brands. Outputs an errors CSV and a Markdown report.

## Why

Merchant Center disapprovals are usually simple data problems, but they are often found only after a feed is uploaded and processed. This tool finds those problems locally in seconds, before upload, and gives each error a concrete fix. It runs offline with zero dependencies, and its exit code makes it easy to use in CI or a scheduled job.

## Install

Requires Node.js 20 or later. No dependencies to install.

```bash
git clone <your fork or copy of this repo>
cd feedlint-gmc
node src/cli.js --help
```

## Usage

```bash
node src/cli.js examples/feed.csv --out-dir out
```

This writes `errors.csv` and `report.md` to the output directory. Use `--errors FILE` and `--report FILE` to choose exact paths.

Exit code is 1 when errors are found and 0 when the feed is clean.

Library use:

```js
import { validateFeedText, gtinChecksumValid } from "./src/index.js";

const result = validateFeedText(csvText);
console.log(result.totalRows, result.errors.length);
console.log(gtinChecksumValid("4006381333931"));
```

## Rules

- Required attributes present in the header and non-empty per row: id, title, description, link, image_link, availability, price, condition, brand.
- GTIN, when present: 8, 12, 13, or 14 digits, a valid mod-10 checksum, and no duplicates across the feed.
- Availability must be one of in_stock, out_of_stock, preorder, backorder.
- Condition must be one of new, refurbished, used.
- Brand must not be a placeholder such as N/A, Generic, or Unknown.

## Example

Input, from `examples/feed.csv`. The sample feed contains several deliberate errors:

```csv
id,title,description,link,image_link,availability,price,condition,brand,gtin
SKU-001,Blue Widget,A sturdy blue widget,https://example.com/products/blue-widget,https://example.com/images/blue.jpg,in_stock,19.99 USD,new,Acme,4006381333931
SKU-002,Red Widget,A sturdy red widget,https://example.com/products/red-widget,https://example.com/images/red.jpg,in stock,24.99 USD,brand new,Generic,5901234123457
SKU-003,Green Widget,,https://example.com/products/green-widget,https://example.com/images/green.jpg,out_of_stock,14.99 USD,used,N/A,4006381333931
SKU-004,Yellow Widget,A yellow widget,https://example.com/products/yellow-widget,https://example.com/images/yellow.jpg,preorder,29.99 USD,new,Acme,4006381333932
SKU-005,Purple Widget,A purple widget,https://example.com/products/purple-widget,,backorder,9.99 USD,refurbished,Unknown,12345
```

Real output captured by running the command above:

```text
Checked 5 rows, found 10 errors.
```

Real `errors.csv` output:

```csv
row,id,rule,message,fix
3,SKU-002,invalid_availability,"Availability ""in stock"" is not an allowed value","Use one of in_stock, out_of_stock, preorder, backorder"
3,SKU-002,invalid_condition,"Condition ""brand new"" is not an allowed value","Use one of new, refurbished, used"
3,SKU-002,brand_placeholder,"Brand ""Generic"" looks like a placeholder",Use the real manufacturer brand name
4,SKU-003,required_empty,Required attribute description is empty,Provide a value for description
4,SKU-003,brand_placeholder,"Brand ""N/A"" looks like a placeholder",Use the real manufacturer brand name
4,SKU-003,gtin_duplicate,"GTIN ""4006381333931"" duplicates row 2",Give each distinct product its own GTIN
5,SKU-004,gtin_checksum,"GTIN ""4006381333932"" fails the mod-10 checksum",Check the GTIN digits against the product packaging
6,SKU-005,required_empty,Required attribute image_link is empty,Provide a value for image_link
6,SKU-005,brand_placeholder,"Brand ""Unknown"" looks like a placeholder",Use the real manufacturer brand name
6,SKU-005,gtin_format,"GTIN ""12345"" must be 8, 12, 13 or 14 digits",Provide a valid GTIN or remove the gtin attribute
```

Real `report.md` output:

```markdown
# Feed Lint Report

Total rows checked: 5
Total errors: 10
Status: FAIL

## Counts per rule

- brand_placeholder: 3
- required_empty: 2
- invalid_availability: 1
- invalid_condition: 1
- gtin_duplicate: 1
- gtin_checksum: 1
- gtin_format: 1

## Top fixes

- (3) Use the real manufacturer brand name
- (1) Use one of in_stock, out_of_stock, preorder, backorder
- (1) Use one of new, refurbished, used
- (1) Provide a value for description
- (1) Give each distinct product its own GTIN
- (1) Check the GTIN digits against the product packaging
- (1) Provide a value for image_link
- (1) Provide a valid GTIN or remove the gtin attribute
```

## Tests

```bash
npm test
```

## License

MIT, see LICENSE.
