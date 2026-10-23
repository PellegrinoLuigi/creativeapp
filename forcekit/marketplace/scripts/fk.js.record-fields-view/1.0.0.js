// ForceKIT Marketplace · fk.js.record-fields-view 1.0.0
// The fields of the record open on the page (the ones you can see, Lightning
// or Classic) in a table you can search, sort and copy as CSV, with how many
// are filled and empty. Read only: it changes nothing on the page.
if (window !== window.top) return undefined;
const deep = (root, sel, out = []) => {
  out.push(...root.querySelectorAll(sel));
  for (const el of root.querySelectorAll("*")) if (el.shadowRoot) deep(el.shadowRoot, sel, out);
  return out;
};
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
const rows = [];
const seen = new Set();
const push = (section, label, value) => {
  label = clean(label);
  value = clean(value);
  if (!label || seen.has(label + "\t" + value)) return;
  seen.add(label + "\t" + value);
  rows.push({ Field: label, Value: value, Section: clean(section) });
};
// Lightning: the items of the record layout that are on screen
for (const item of deep(document, "records-record-layout-item")) {
  if (!item.offsetParent && !item.getClientRects().length) continue;
  const label = item.getAttribute("field-label") || deep(item, ".test-id__field-label")[0]?.textContent;
  const valueEl = deep(item, ".test-id__field-value")[0];
  if (!valueEl) continue;
  const copy = valueEl.cloneNode(true);
  copy.querySelectorAll(".slds-assistive-text, button").forEach((x) => x.remove());
  const section = item.closest("records-record-layout-section")?.getAttribute("title") || "";
  push(section, label, copy.textContent || valueEl.innerText);
}
// Classic: label / value cells of the detail page
for (const td of document.querySelectorAll("td.labelCol")) {
  const value = td.nextElementSibling;
  const section = td.closest(".pbSubsection")?.previousElementSibling?.textContent || "";
  if (value?.classList.contains("dataCol") || value?.classList.contains("data2Col")) push(section, td.textContent, value.innerText);
}
if (!rows.length) return fk.view.note("No record fields on this page: open a record (Details tab) and run it again.", { tone: "warn" });
const empty = rows.filter((r) => !r.Value).length;
const hasSections = rows.some((r) => r.Section);
return fk.view.stack([
  fk.view.stats([
    { label: "Fields", value: rows.length },
    { label: "Filled", value: rows.length - empty, tone: "ok" },
    { label: "Empty", value: empty, tone: empty ? "warn" : "ok" },
  ]),
  fk.view.table(rows, { title: clean(document.title), columns: hasSections ? ["Field", "Value", "Section"] : ["Field", "Value"] }),
]);
