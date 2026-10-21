// ForceKIT Marketplace · fk.js.list-view-csv 1.0.0
// The rows of the list open on the page (list view or related list, the
// biggest table on screen) as a CSV file. Only the rows already loaded:
// scroll down first to load more. Read only.
if (window !== window.top) return undefined;
const deep = (root, sel, out = []) => {
  out.push(...root.querySelectorAll(sel));
  for (const el of root.querySelectorAll("*")) if (el.shadowRoot) deep(el.shadowRoot, sel, out);
  return out;
};
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
const tables = deep(document, "table").filter((t) => t.getClientRects().length && t.querySelector("thead th") && t.querySelector("tbody tr"));
if (!tables.length) return "No list on this page: open a list view (or a related list) and run it again.";
const table = tables.sort((a, b) => b.querySelectorAll("tbody tr").length - a.querySelectorAll("tbody tr").length)[0];
const textOf = (cell) => {
  const copy = cell.cloneNode(true);
  copy.querySelectorAll(".slds-assistive-text, .assistiveText, button, input, svg").forEach((x) => x.remove());
  // only buttons or checkboxes (actions, selection): nothing to export
  return clean(copy.textContent) || (cell.querySelector("button, input") ? "" : clean(cell.innerText));
};
const heads = [...(table.tHead?.rows[table.tHead.rows.length - 1]?.cells || [])].map((th) =>
  clean(th.getAttribute("aria-label") || th.getAttribute("title") || th.querySelector("[title]")?.getAttribute("title") || textOf(th))
);
const bodyRows = [...table.tBodies].flatMap((b) => [...b.rows]);
// columns with a header and something written in them (no checkboxes, row numbers, menus)
const keep = heads.map((h, i) => !!h && bodyRows.some((r) => r.cells[i] && textOf(r.cells[i])));
const csv = (v) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const lines = [heads.filter((_, i) => keep[i]).map(csv).join(",")];
for (const r of bodyRows) lines.push([...r.cells].filter((_, i) => keep[i]).map((c) => csv(textOf(c))).join(","));
const obj = /\/lightning\/[or]\/(\w+)\//.exec(location.pathname)?.[1] || "list";
const name = `${obj}-${new Date().toISOString().slice(0, 10)}.csv`;
const a = document.createElement("a");
a.href = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
a.download = name;
document.body.appendChild(a);
a.click();
a.remove();
setTimeout(() => URL.revokeObjectURL(a.href), 10000);
return `${bodyRows.length} row(s), ${lines[0].split(",").length} column(s) saved to ${name}`;
