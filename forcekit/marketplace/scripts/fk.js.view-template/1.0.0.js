// ForceKIT Marketplace · fk.js.view-template 1.0.0
// Template for a graphic script: instead of text it returns a view that
// ForceKIT draws in the script bubble and in the side panel. It shows every
// kind of view with real data from the page you are on; copy it and keep the
// parts you need. Read only: it changes nothing on the page.
//   fk.view.stats([...])  numbers      fk.view.kv({...})     key / value list
//   fk.view.table([...])  table        fk.view.tree(object)  tree with search
//   fk.view.note("...")   message      fk.view.stack([...])  several together
if (window !== window.top) return undefined;
const path = location.pathname;
const rec = /\/lightning\/r\/(\w+)\/([a-zA-Z0-9]{15,18})\//.exec(path);
const list = /\/lightning\/o\/(\w+)\//.exec(path);
const classicId = !/\/lightning\//.test(path) && /^\/([a-zA-Z0-9]{15}|[a-zA-Z0-9]{18})(?:[/?]|$)/.exec(path);

// links to records on the page (Lightning and Classic), for the table
const deep = (root, sel, out = []) => {
  out.push(...root.querySelectorAll(sel));
  for (const el of root.querySelectorAll("*")) if (el.shadowRoot) deep(el.shadowRoot, sel, out);
  return out;
};
const seen = new Set();
const links = [];
for (const a of deep(document, "a[href]")) {
  const m = /\/lightning\/r\/(?:(\w+)\/)?([a-zA-Z0-9]{15,18})\/view/.exec(a.getAttribute("href")) || /^\/([a-zA-Z0-9]{15}|[a-zA-Z0-9]{18})$/.exec(a.getAttribute("href"));
  const id = m && (m[2] || m[1]);
  const text = String(a.textContent || "").replace(/\s+/g, " ").trim();
  if (!id || !text || seen.has(id)) continue;
  seen.add(id);
  links.push({ Name: text, Id: id, Object: (m[2] && m[1]) || "" });
}

return fk.view.stack([
  fk.view.stats([
    { label: "Record links", value: links.length, tone: links.length ? "info" : undefined },
    { label: "Frames", value: document.querySelectorAll("iframe").length },
    { label: "Form fields", value: deep(document, "input, select, textarea").length },
    { label: "UI", value: /\/lightning\//.test(path) ? "Lightning" : "Classic", tone: "ok" },
  ]),
  fk.view.kv({
    Object: rec?.[1] || list?.[1] || "—",
    "Record Id": rec?.[2] || classicId?.[1] || "—",
    Title: document.title,
    Host: location.host,
  }, { title: "This page" }),
  links.length ? fk.view.table(links, { title: "Records linked on the page" }) : fk.view.note("No links to records on this page.", { tone: "info" }),
  fk.view.tree({ location: { href: location.href, pathname: path, search: location.search }, document: { title: document.title, lang: document.documentElement.lang, readyState: document.readyState } }, { title: "Raw data", rootLabel: "page" }),
]);
