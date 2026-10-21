// ForceKIT Marketplace · fk.js.copy-record-fields 1.0.0
// Labels and values of the record open on the page (the fields you can see,
// Lightning or Classic) as a two-column table, copied to the clipboard when
// the browser allows it and returned here anyway. Read only.
if (window !== window.top) return undefined;
const deep = (root, sel, out = []) => {
  out.push(...root.querySelectorAll(sel));
  for (const el of root.querySelectorAll("*")) if (el.shadowRoot) deep(el.shadowRoot, sel, out);
  return out;
};
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
const rows = [];
const seen = new Set();
const push = (label, value) => {
  label = clean(label);
  value = clean(value);
  if (!label || seen.has(label + "\t" + value)) return;
  seen.add(label + "\t" + value);
  rows.push(`${label}\t${value}`);
};
// Lightning: the items of the record layout that are on screen
for (const item of deep(document, "records-record-layout-item")) {
  if (!item.offsetParent && !item.getClientRects().length) continue;
  const label = item.getAttribute("field-label") || deep(item, ".test-id__field-label")[0]?.textContent;
  const valueEl = deep(item, ".test-id__field-value")[0];
  if (!valueEl) continue;
  const copy = valueEl.cloneNode(true);
  copy.querySelectorAll(".slds-assistive-text, button").forEach((x) => x.remove());
  push(label, copy.textContent || valueEl.innerText);
}
// Classic: label / value cells of the detail page
for (const td of document.querySelectorAll("td.labelCol")) {
  const value = td.nextElementSibling;
  if (value?.classList.contains("dataCol") || value?.classList.contains("data2Col")) push(td.textContent, value.innerText);
}
if (!rows.length) return "No record fields on this page: open a record (Details tab) and run it again.";
const text = [clean(document.title), ...rows].join("\n");
let copied = false;
try {
  await navigator.clipboard.writeText(text);
  copied = true;
} catch {
  // the browser can refuse the clipboard without a click on the page: the text is below
}
console.log(`${rows.length} field(s)${copied ? " copied to the clipboard" : ""}`);
return text;
