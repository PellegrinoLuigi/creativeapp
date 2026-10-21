// ForceKIT Marketplace · fk.js.ids-on-page 1.0.0
// Collects the Salesforce record Ids linked from the current page (lists,
// related lists, lookups), also inside Lightning components. Read only.
if (window !== window.top) return undefined;
const ID = /(?:^|\/)([a-zA-Z0-9]{5}0[a-zA-Z0-9]{9}(?:[a-zA-Z0-9]{3})?)(?=[/?#]|$)/;
const ids = new Map();
const visit = (root) => {
  for (const a of root.querySelectorAll("a[href]")) {
    let url;
    try {
      url = new URL(a.getAttribute("href"), location.href);
    } catch {
      continue;
    }
    if (url.host !== location.host) continue;
    const m = ID.exec(url.pathname);
    if (m && !ids.has(m[1])) ids.set(m[1], (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80));
  }
  for (const el of root.querySelectorAll("*")) if (el.shadowRoot) visit(el.shadowRoot);
};
visit(document);
console.log(`${ids.size} Id(s) found`);
return [...ids].map(([id, label]) => (label ? `${id}  ${label}` : id)).join("\n");
