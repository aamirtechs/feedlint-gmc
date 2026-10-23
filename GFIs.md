# Good First Issues

## 1. Add XML (RSS 2.0) feed input

Google Merchant Center also accepts XML feeds, and many stores only export that format. Add an XML input path that maps each item element to the same internal row shape used for CSV and TSV. Reuse the existing validation rules so XML and delimited feeds produce identical reports for equivalent data.

## 2. Add identifier_exists=no misuse warning

Shops sometimes set identifier_exists to no even when a product has a GTIN or a brand and MPN, which can limit performance. Add a warning when identifier_exists is no but gtin, brand, or mpn values are present on the same row. Cover the new rule with tests and document it in the report counts.

## 3. Add title rules (length, keyword-stuffing and ALL-CAPS detection)

Product titles that are very long, stuffed with repeated keywords, or written in all caps are a common disapproval and low click-through cause. Add title checks for length, repeated terms, and excessive capital letters. Each check should produce a clear fix suggestion in errors.csv.
