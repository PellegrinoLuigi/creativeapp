// ForceKIT Marketplace — chiamate API pronte (api/catalog.json, stessa
// cartella della pagina). Raccolte di API pubbliche e gratuite: si importano
// in ForceKIT (Strumenti › API › Raccolte › ⋯ › Marketplace chiamate) o si
// scaricano come JSON da importare. Nessun backend, nessun codice eseguito.
(function () {
  var CATALOG_URL = "catalog.json";
  var state = { catalog: null, error: null, q: "", cat: "all", open: {} };
  var root;

  function lang() { return (document.documentElement.lang || "en").slice(0, 2); }
  var dict = null;
  function t(key, fallback, vars) {
    if (!dict) { try { dict = JSON.parse(document.getElementById("i18n-data").textContent); } catch (e) { dict = {}; } }
    var l = lang();
    var s = (l !== "en" && dict[l] && dict[l][key]) || fallback;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split("{" + k + "}").join(vars[k]); });
    return s;
  }
  function loc(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    return v[lang()] || v.en || "";
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function catLabel(id) {
    var c = (state.catalog.categories || []).filter(function (x) { return x.id === id; })[0];
    return c ? loc(c.label) : id;
  }
  function method(r) { return r.kind === "soap" ? "SOAP" : r.method || "GET"; }
  function search(p) {
    if (!state.q) return true;
    var hay = [p.id, p.name, loc(p.description), (p.tags || []).join(" "), catLabel(p.category), p.site,
      p.requests.map(function (r) { return r.name + " " + r.url; }).join(" ")].join(" ").toLowerCase();
    return state.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }
  function visible() {
    return state.catalog.packages.filter(function (p) { return (state.cat === "all" || p.category === state.cat) && search(p); });
  }
  function total() {
    return state.catalog.packages.reduce(function (n, p) { return n + p.requests.length; }, 0);
  }

  // Raccolta nel formato di export di ForceKIT: stessi Id del Marketplace
  // dell'estensione, quindi reimportandola si aggiornano solo le differenze.
  function toCollection(p) {
    return {
      id: "mkt:" + p.id,
      name: p.name,
      vars: (p.vars || []).map(function (v) { return { k: v.k, v: v.v || "", on: true }; }),
      requests: p.requests.map(function (r) {
        var soap = r.kind === "soap";
        var out = {};
        Object.keys(r).forEach(function (k) { out[k] = r[k]; });
        out.id = "mkt:" + p.id + ":" + r.id;
        out.kind = soap ? "soap" : "rest";
        out.method = soap ? "POST" : r.method || "GET";
        return out;
      }),
    };
  }
  function download(list, name) {
    var blob = new Blob([JSON.stringify({ forcekitApi: 1, collections: list.map(toCollection) }, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  function render() {
    var c = state.catalog;
    var counts = {};
    c.packages.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
    var chip = function (id, label, n) {
      var on = state.cat === id;
      return '<button type="button" data-cat="' + esc(id) + '" class="' + (on ? "active" : "") + '" aria-pressed="' + on + '">' + esc(label) + (n != null ? '<span class="n">' + n + "</span>" : "") + "</button>";
    };
    var rows = visible();
    root.innerHTML =
      '<div class="mk-hero"><div><p class="eyebrow">' + esc(t("mkEyebrow", "Marketplace")) + "</p>" +
      "<h1>" + t("apiH1", "API calls ready for <span>ForceKIT</span>") + "</h1>" +
      '<p class="lede">' + esc(t("apiLede", "Collections of free public APIs, no keys needed: REST, GraphQL and SOAP. Import them into the ForceKIT API client with one click, with their variables, and try a call straight away.")) + "</p></div>" +
      '<span class="mk-stat"><b>' + total() + "</b>" + esc(t("apiCount", "calls in {n} collections", { n: c.packages.length })) + "</span></div>" +
      '<div class="mk-bar" role="search"><label class="mk-search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
      '<input type="search" id="mk-q" value="' + esc(state.q) + '" placeholder="' + esc(t("apiSearch", "Search APIs, calls, URLs…")) + '" aria-label="' + esc(t("apiSearch", "Search APIs, calls, URLs…")) + '" /></label>' +
      '<div class="mk-chips" aria-label="Category">' + chip("all", t("mkAllCats", "All categories"), c.packages.length) +
      (c.categories || []).filter(function (x) { return counts[x.id]; }).map(function (x) { return chip(x.id, loc(x.label), counts[x.id]); }).join("") + "</div>" +
      '<button type="button" class="btn btn-ghost btn-sm api-dl-all" data-dl-all>' + esc(t("apiDownloadAll", "Download all (JSON)")) + "</button></div>" +
      (rows.length ? '<div class="mk-grid api-grid">' + rows.map(card).join("") + "</div>" : '<div class="mk-state">' + esc(t("apiEmpty", "No API matches your search.")) + "</div>") +
      '<div class="mk-note">' + t("apiHow", "<b>How to import:</b> in the ForceKIT side panel open <b>Tools › API</b>, then <b>Collections › ⋯ › Call marketplace</b>: pick a collection and press Import, or click a single call to open it. Or download the JSON here and use <b>Collections › ⋯ › Import collection</b>. Importing again only updates what changed. The calls go to third-party public services: don't send them confidential data.") + "</div>";
  }
  function card(p) {
    var open = !!state.open[p.id];
    return '<article class="mk-card api-card' + (open ? " open" : "") + '" data-id="' + esc(p.id) + '">' +
      '<div class="mk-card-head"><span class="mk-ic" aria-hidden="true">API</span><div><h3>' + esc(p.name) + '</h3><div class="by">' + esc(p.author && p.author.name) + " · v" + esc(p.version) + "</div></div></div>" +
      "<p>" + esc(loc(p.description)) + "</p>" +
      '<div class="mk-tags"><span class="mk-tag">' + esc(catLabel(p.category)) + "</span>" + (p.tags || []).map(function (x) { return '<span class="mk-tag type">' + esc(x) + "</span>"; }).join("") + "</div>" +
      '<div class="api-actions"><button type="button" class="api-toggle" data-toggle="' + esc(p.id) + '" aria-expanded="' + open + '">' + (open ? "▾ " : "▸ ") + esc(t("apiCalls", "{n} calls", { n: p.requests.length })) + "</button>" +
      '<a class="api-site" href="' + esc(p.site) + '" target="_blank" rel="noopener noreferrer">' + esc(t("apiDocs", "API docs")) + " ↗</a>" +
      '<button type="button" class="btn btn-primary btn-sm" data-dl="' + esc(p.id) + '">' + esc(t("apiDownload", "Download JSON")) + "</button></div>" +
      (open
        ? '<ul class="api-reqs">' + p.requests.map(function (r) {
            var m = method(r);
            return '<li><span class="api-m api-m-' + esc(m.toLowerCase()) + '">' + esc(m) + '</span><span class="api-n">' + esc(r.name) + '</span><code>' + esc(r.url) + "</code></li>";
          }).join("") + "</ul>" +
          ((p.vars || []).length ? '<div class="api-vars"><b>' + esc(t("apiVars", "Variables")) + "</b> " + p.vars.map(function (v) { return "<code>{{" + esc(v.k) + "}} = " + esc(v.v) + "</code>"; }).join(" ") + "</div>" : "")
        : "") +
      "</article>";
  }

  function load() {
    root.innerHTML = '<div class="mk-state"><span class="mk-spin"></span>' + esc(t("mkLoading", "Loading the catalog…")) + "</div>";
    fetch(CATALOG_URL, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (c) {
        if (!c || !Array.isArray(c.packages)) throw new Error("bad catalog");
        state.catalog = c;
        render();
      })
      .catch(function () {
        root.innerHTML = '<div class="mk-state">' + esc(t("mkLoadErr", "Couldn't load the catalog. Check your connection and try again.")) +
          ' <button type="button" class="btn btn-ghost btn-sm" data-retry>' + esc(t("mkRetry", "Try again")) + "</button></div>";
      });
  }

  function init() {
    root = document.getElementById("mk-root");
    if (!root) return;
    root.addEventListener("input", function (e) {
      if (e.target.id !== "mk-q") return;
      state.q = e.target.value;
      var pos = e.target.selectionStart;
      render();
      var q = document.getElementById("mk-q");
      q.focus();
      q.setSelectionRange(pos, pos);
    });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      // clic sulla scheda (fuori da bottoni e link) = apre o chiude l'elenco delle chiamate
      if (!b && !e.target.closest("a") && !(window.getSelection && String(window.getSelection()))) {
        var c = e.target.closest(".api-card");
        if (c) b = c.querySelector("[data-toggle]");
      }
      if (!b) return;
      if (b.hasAttribute("data-retry")) return load();
      if (b.hasAttribute("data-cat")) { state.cat = b.getAttribute("data-cat"); return render(); }
      if (b.hasAttribute("data-toggle")) { var id = b.getAttribute("data-toggle"); state.open[id] = !state.open[id]; return render(); }
      if (b.hasAttribute("data-dl-all")) return download(state.catalog.packages, "forcekit-api-marketplace.json");
      if (b.hasAttribute("data-dl")) {
        var p = state.catalog.packages.filter(function (x) { return x.id === b.getAttribute("data-dl"); })[0];
        if (p) download([p], "forcekit-api-" + p.id + ".json");
      }
    });
    // cambio di lingua (site.js): si ridisegna con i testi nuovi
    new MutationObserver(function () { if (state.catalog) render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    load();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
