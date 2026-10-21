// ForceKIT Marketplace · fk.js.expand-all 1.0.0
// Opens every collapsed section and accordion of the page: Lightning record
// layouts and accordions, Classic detail page sections.
if (window !== window.top) return undefined;
const deep = (root, sel, out = []) => {
  out.push(...root.querySelectorAll(sel));
  for (const el of root.querySelectorAll("*")) if (el.shadowRoot) deep(el.shadowRoot, sel, out);
  return out;
};
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
let opened = 0;
const toggles = deep(document, 'button.slds-section__title-action[aria-expanded="false"], button.slds-accordion__summary-action[aria-expanded="false"]');
for (const b of toggles) {
  if (!b.getClientRects().length) continue;
  b.click();
  opened++;
}
for (const img of document.querySelectorAll("img.showListButton")) {
  img.click();
  opened++;
}
return opened ? `${opened} section(s) expanded` : "Nothing to expand on this page.";
