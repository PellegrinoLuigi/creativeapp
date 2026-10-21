// ForceKIT Marketplace — catalogo e dettaglio degli script ufficiali.
// Legge catalog.json (stessa cartella della pagina), nessun backend.
// Con ForceKIT installato il content script dell'estensione
// (content/marketplace-page.js) scrive su <html> data-forcekit-market
// = {"ext":"x.y.z","installed":{"id":"versione"}} e lancia l'evento
// "forcekit:market"; i pulsanti [data-fk-open] li gestisce lui.
(function () {
  var CATALOG_URL = "catalog.json";
  var state = { catalog: null, error: null, q: "", cat: "all", type: "all", ext: null };
  var root, codeCache = {};

  function lang() { return (document.documentElement.lang || "en").slice(0, 2); }
  var dict = null;
  function t(key, fallback, vars) {
    if (!dict) { try { dict = JSON.parse(document.getElementById("i18n-data").textContent); } catch (e) { dict = {}; } }
    var l = lang();
    var s = (l !== "en" && dict[l] && dict[l][key]) || fallback;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split("{" + k + "}").join(vars[k]); });
    return s;
  }
  // campi localizzati del catalogo: stringa o {en, it, ...}
  function loc(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    return v[lang()] || v.en || "";
  }
  function locList(v) {
    if (Array.isArray(v)) return v;
    return (v && (v[lang()] || v.en)) || [];
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function cmp(a, b) {
    var pa = String(a).split(".").map(Number), pb = String(b).split(".").map(Number);
    for (var i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
    return 0;
  }
  function latest(s) { return (s.versions || [])[0] || {}; }
  function iconHtml(s) {
    var js = s.type === "javascript";
    if (s.icon) return '<span class="mk-ic emoji' + (js ? " js" : "") + '" aria-hidden="true">' + esc(s.icon) + "</span>";
    return '<span class="mk-ic' + (js ? " js" : "") + '" aria-hidden="true">' + (js ? "JS" : "{ }") + "</span>";
  }
  function typeLabel(type) { return type === "javascript" ? "JavaScript" : "Apex"; }
  function catLabel(id) {
    var c = (state.catalog.categories || []).filter(function (x) { return x.id === id; })[0];
    return c ? loc(c.label) : id;
  }
  function readExt() {
    try { state.ext = JSON.parse(document.documentElement.getAttribute("data-forcekit-market") || "null"); } catch (e) { state.ext = null; }
  }
  function installedTag(s) {
    var inst = state.ext && state.ext.installed && state.ext.installed[s.id];
    if (!inst) return "";
    var v = latest(s).version;
    return cmp(v, inst) > 0
      ? '<span class="mk-tag up">' + esc(t("mkUpdate", "Update {v}", { v: v })) + "</span>"
      : '<span class="mk-tag ok">' + esc(t("mkInstalled", "Installed")) + "</span>";
  }
  function search(s) {
    if (!state.q) return true;
    var hay = [s.id, loc(s.name), loc(s.description), (s.tags || []).join(" "), s.author && s.author.name, catLabel(s.category)].join(" ").toLowerCase();
    return state.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
  }
  function visible() {
    return state.catalog.scripts.filter(function (s) {
      return (state.cat === "all" || s.category === state.cat) && (state.type === "all" || s.type === state.type) && search(s);
    });
  }

  // ---------- elenco ----------
  function renderList() {
    var c = state.catalog;
    var counts = {};
    c.scripts.forEach(function (s) { counts[s.category] = (counts[s.category] || 0) + 1; });
    var chip = function (group, id, label, n) {
      var on = state[group] === id;
      return '<button type="button" data-' + group + '="' + esc(id) + '" class="' + (on ? "active" : "") + '" aria-pressed="' + on + '">' + esc(label) + (n != null ? '<span class="n">' + n + "</span>" : "") + "</button>";
    };
    var rows = visible();
    root.innerHTML =
      '<div class="mk-hero"><div><p class="eyebrow">' + esc(t("mkEyebrow", "Marketplace")) + "</p>" +
      "<h1>" + t("mkH1", "Ready-made scripts for <span>ForceKIT</span>") + "</h1>" +
      '<p class="lede">' + esc(t("mkLede", "Official Apex and JavaScript scripts you can install in the Scripts section of ForceKIT with one click. Open source, versioned and checked before they are installed.")) + "</p></div>" +
      '<span class="mk-stat"><b>' + c.scripts.length + "</b>" + esc(t("mkCount", "official scripts")) + "</span></div>" +
      '<div class="mk-bar" role="search"><label class="mk-search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
      '<input type="search" id="mk-q" value="' + esc(state.q) + '" placeholder="' + esc(t("mkSearch", "Search scripts, tags, authors…")) + '" aria-label="' + esc(t("mkSearch", "Search scripts, tags, authors…")) + '" /></label>' +
      '<div class="mk-chips" aria-label="Type">' + chip("type", "all", t("mkAll", "All")) + chip("type", "apex", "Apex") + chip("type", "javascript", "JavaScript") + "</div>" +
      '<div class="mk-chips" aria-label="Category">' + chip("cat", "all", t("mkAllCats", "All categories"), c.scripts.length) +
      (c.categories || []).filter(function (x) { return counts[x.id]; }).map(function (x) { return chip("cat", x.id, loc(x.label), counts[x.id]); }).join("") + "</div></div>" +
      (rows.length
        ? '<div class="mk-grid">' + rows.map(card).join("") + "</div>"
        : '<div class="mk-state">' + esc(t("mkEmpty", "No script matches your search.")) + "</div>") +
      '<div class="mk-note">' + t("mkHow", "<b>How to install:</b> in the ForceKIT side panel go to <b>Scripts › + New › Marketplace</b>, pick the scripts and confirm. Installed scripts are read-only and appear in <b>Scripts</b> with the Marketplace badge; you can make an editable copy at any time.") + "</div>";
  }
  function card(s) {
    var v = latest(s);
    var js = s.type === "javascript";
    return '<a class="mk-card" href="?script=' + encodeURIComponent(s.id) + '" data-id="' + esc(s.id) + '">' +
      '<div class="mk-card-head">' + iconHtml(s) + "<div><h3>" + esc(loc(s.name)) + '</h3><div class="by">' + esc(s.author && s.author.name) + " · v" + esc(v.version) + "</div></div></div>" +
      "<p>" + esc(loc(s.description)) + "</p>" +
      '<div class="mk-tags"><span class="mk-tag type' + (js ? " js" : "") + '">' + typeLabel(s.type) + '</span><span class="mk-tag">' + esc(catLabel(s.category)) + "</span>" +
      (s.official ? '<span class="mk-tag official">' + esc(t("mkOfficial", "Official")) + "</span>" : "") + installedTag(s) + "</div></a>";
  }

  // ---------- dettaglio ----------
  function renderDetail(s) {
    var v = latest(s);
    var js = s.type === "javascript";
    var comp = v.compatibility || {};
    var hasExt = !!state.ext;
    var tooOld = hasExt && state.ext.ext && cmp(state.ext.ext, comp.minExtensionVersion) < 0;
    var row = function (k, val) { return "<div><dt>" + esc(k) + "</dt><dd>" + val + "</dd></div>"; };
    document.title = loc(s.name) + " — ForceKIT Marketplace";
    root.innerHTML =
      '<a class="mk-back" href="./">← ' + esc(t("mkBack", "All scripts")) + "</a>" +
      '<div class="mk-detail"><div>' +
      '<div class="mk-card-head">' + iconHtml(s) + "<div><h1>" + esc(loc(s.name)) + "</h1></div></div>" +
      '<div class="mk-tags"><span class="mk-tag type' + (js ? " js" : "") + '">' + typeLabel(s.type) + '</span><span class="mk-tag">v' + esc(v.version) + '</span><span class="mk-tag">' + esc(catLabel(s.category)) + "</span>" +
      (s.official ? '<span class="mk-tag official">' + esc(t("mkOfficial", "Official")) + "</span>" : "") + installedTag(s) + "</div>" +
      '<p class="desc">' + esc(loc(s.description)) + "</p>" +
      "<h2>" + esc(t("mkCode", "Code")) + "</h2>" +
      '<figure class="mk-code"><div class="mk-code-bar"><span>' + esc(v.file) + '</span><span class="sp"></span><span class="mk-integrity"></span>' +
      '<button type="button" data-copy>' + esc(t("mkCopy", "Copy")) + '</button><a href="' + esc(v.file) + '" download="' + esc(s.id + "-" + v.version + (js ? ".js" : ".apex")) + '">' + esc(t("mkDownload", "Download")) + "</a></div>" +
      '<pre><code class="mk-src"><span class="mk-spin"></span></code></pre></figure>' +
      "<h2>" + esc(t("mkChangelog", "Changelog")) + '</h2><ul class="mk-log">' +
      s.versions.map(function (x) {
        return '<li><div class="v">v' + esc(x.version) + " <span>" + esc(x.date) + " · ForceKIT ≥ " + esc((x.compatibility || {}).minExtensionVersion) + "</span></div><ul>" +
          locList(x.changelog).map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul></li>";
      }).join("") + "</ul></div>" +
      '<aside class="mk-panel"><dl class="mk-meta">' +
      row("ID", "<code>" + esc(s.id) + "</code>") +
      row(t("mkAuthor", "Author"), s.author && s.author.url ? '<a href="' + esc(s.author.url) + '" rel="noopener">' + esc(s.author.name) + "</a>" : esc(s.author && s.author.name)) +
      row(t("mkType", "Type"), typeLabel(s.type)) +
      row(t("mkVersion", "Version"), esc(v.version) + " · " + esc(v.date)) +
      row(t("mkCompat", "Requires"), "ForceKIT ≥ " + esc(comp.minExtensionVersion) + (comp.maxExtensionVersion ? " · ≤ " + esc(comp.maxExtensionVersion) : "")) +
      row("SHA-256", "<code>" + esc(v.sha256) + "</code>") +
      "</dl>" +
      '<div class="mk-install">' +
      (hasExt
        ? (tooOld
          ? '<p class="hint">' + esc(t("mkTooOld", "This version needs ForceKIT {v} or later: update the extension from chrome://extensions.", { v: comp.minExtensionVersion })) + "</p>"
          : '<button type="button" class="btn btn-primary" data-fk-open="' + esc(s.id) + '">' + esc(t("mkOpenInFk", "Open in ForceKIT")) + "</button>" +
            '<p class="hint">' + t("mkOpenHint", "The <b>Marketplace</b> of the side panel opens on this script: check origin and version, then confirm the installation.") + "</p>")
        : '<a class="btn btn-primary" href="https://chromewebstore.google.com/detail/forcekit/gilmnacbmadobfhnedbolnnnhecfjlna" target="_blank" rel="noopener noreferrer">' + esc(t("mkGetFk", "Get ForceKIT for Chrome")) + "</a>" +
          '<p class="hint">' + t("mkNoExt", "Then in the ForceKIT side panel go to <b>Scripts › + New › Marketplace</b> and install the script from there.") + "</p>") +
      "</div></aside></div>";
    loadCode(s, v);
  }
  function loadCode(s, v) {
    var box = root.querySelector(".mk-src");
    var badge = root.querySelector(".mk-integrity");
    var done = function (text, ok) {
      if (!box.isConnected) return;
      box.textContent = text;
      badge.textContent = ok ? "✓ " + t("mkVerified", "integrity verified") : "";
      root.querySelector("[data-copy]").onclick = function (e) {
        navigator.clipboard.writeText(text).then(function () {
          e.target.textContent = t("mkCopied", "Copied");
          setTimeout(function () { e.target.textContent = t("mkCopy", "Copy"); }, 1200);
        });
      };
    };
    if (codeCache[v.file]) return done(codeCache[v.file].text, codeCache[v.file].ok);
    fetch(v.file, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
      .then(function (buf) {
        var text = new TextDecoder().decode(buf);
        var check = window.crypto && crypto.subtle ? crypto.subtle.digest("SHA-256", buf) : Promise.resolve(null);
        return check.then(function (h) {
          var hex = h ? Array.prototype.map.call(new Uint8Array(h), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("") : "";
          var ok = hex === v.sha256;
          codeCache[v.file] = { text: ok ? text : t("mkBadHash", "The file does not match the catalog (SHA-256): it is not shown."), ok: ok };
          done(codeCache[v.file].text, ok);
        });
      })
      .catch(function () { if (box.isConnected) box.textContent = t("mkCodeErr", "The code could not be loaded. Try again later."); });
  }

  // ---------- navigazione ----------
  function current() { return new URLSearchParams(location.search).get("script"); }
  function render() {
    readExt();
    if (state.error) {
      root.innerHTML = '<div class="mk-state err">' + esc(t("mkLoadErr", "The catalog could not be loaded. Check your connection and try again.")) + '<br /><button type="button" class="btn btn-ghost btn-sm" data-retry>' + esc(t("mkRetry", "Try again")) + "</button></div>";
      return;
    }
    if (!state.catalog) {
      root.innerHTML = '<div class="mk-state"><span class="mk-spin"></span>' + esc(t("mkLoading", "Loading the catalog…")) + "</div>";
      return;
    }
    var id = current();
    var s = id && state.catalog.scripts.filter(function (x) { return x.id === id; })[0];
    if (id && !s) {
      root.innerHTML = '<a class="mk-back" href="./">← ' + esc(t("mkBack", "All scripts")) + '</a><div class="mk-state">' + esc(t("mkNotFound", "This script is not in the catalog (it may have been removed).")) + "</div>";
      return;
    }
    if (s) return renderDetail(s);
    document.title = t("pageTitle", "ForceKIT Marketplace — Official Salesforce scripts");
    renderList();
  }
  function go(href) {
    var url = new URL(href, location.href);
    var l = new URLSearchParams(location.search).get("lang");
    if (l) url.searchParams.set("lang", l);
    history.pushState(null, "", url);
    render();
    window.scrollTo(0, 0);
  }
  function load() {
    state.error = null;
    render();
    fetch(CATALOG_URL, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (c) {
        if (!c || c.schemaVersion !== 1 || !Array.isArray(c.scripts)) throw new Error("bad catalog");
        state.catalog = c;
        render();
      })
      .catch(function () { state.error = true; render(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    root = document.getElementById("mk-root");
    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-retry]")) return load();
      var chip = e.target.closest("[data-type], [data-cat]");
      if (chip) {
        if (chip.dataset.type) state.type = chip.dataset.type;
        if (chip.dataset.cat) state.cat = chip.dataset.cat;
        return renderList();
      }
      var a = e.target.closest("a.mk-card, a.mk-back");
      if (a && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
        e.preventDefault();
        go(a.getAttribute("href"));
      }
    });
    root.addEventListener("input", function (e) {
      if (e.target.id !== "mk-q") return;
      state.q = e.target.value.trim();
      var grid = root.querySelector(".mk-grid, .mk-state");
      var rows = visible();
      var html = rows.length ? '<div class="mk-grid">' + rows.map(card).join("") + "</div>" : '<div class="mk-state">' + esc(t("mkEmpty", "No script matches your search.")) + "</div>";
      if (grid) grid.outerHTML = html;
    });
    window.addEventListener("popstate", render);
    // cambio lingua (assets/i18n.js cambia <html lang>) e stato dell'estensione
    new MutationObserver(function () { if (state.catalog) render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    document.addEventListener("forcekit:market", function () { if (state.catalog) render(); });
    load();
  });
})();
