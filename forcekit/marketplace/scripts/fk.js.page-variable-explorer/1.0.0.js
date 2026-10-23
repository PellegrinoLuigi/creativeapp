// ForceKIT Marketplace · fk.js.page-variable-explorer 1.0.0
// Shows a JavaScript variable of the page as a tree you can search, expand and
// copy (path or value): e.g. "location", "history.state", "myApp.config" or
// "items[0]". Run it again (or reopen its bubble) to read it again: what
// changed since the first run is highlighted. Read only.
const path = String.raw`{{Variable}}`.trim().replace(/^window\.?/, "");
// the path, piece by piece: a.b[0]["c d"]
const parts = [];
path.replace(/([^.[\]]+)|\[(\d+)\]|\[["']([^"']*)["']\]/g, (m, name, index, quoted) => {
  parts.push(index !== undefined ? Number(index) : quoted !== undefined ? quoted : name);
  return m;
});
let value = window;
for (const p of parts) {
  if (value == null) break;
  try {
    value = value[p];
  } catch (e) {
    value = undefined;
    break;
  }
}
if (value === undefined) {
  // other frames of the tab may have it: only the top one says it's missing
  if (window !== window.top) return undefined;
  return fk.view.note(`"${path || "window"}" is not defined on this page.`, { tone: "warn" });
}
if (value === null || typeof value !== "object") return fk.view.kv([[path || "window", value]], { title: location.host });
return fk.view.tree(value, { title: `${path || "window"} · ${location.host}`, rootLabel: path || "window" });
