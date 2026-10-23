export function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else { field += c; }
    } else if (c === '"') { inQuotes = true; }
    else if (c === delimiter) { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else { field += c; }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => !(r.length === 1 && r[0] === ""));
}
export function detectDelimiter(firstLine) { return firstLine.includes("\t") ? "\t" : ","; }
export function rowsToObjects(rows) {
  if (!rows.length) return { headers: [], objects: [] };
  const headers = rows[0].map(h => h.trim());
  const objects = rows.slice(1).map(values => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (values[idx] ?? "").trim(); });
    return obj;
  });
  return { headers, objects };
}
export function escapeCsv(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replaceAll('"', '""') + '"';
  return s;
}
