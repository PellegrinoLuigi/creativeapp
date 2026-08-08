(function () {
  var SUPPORTED = ["en", "it", "fr", "es", "de"];
  var STORAGE_KEY = "forcekit-lang";
  var original = { text: {}, html: {}, attr: {} };
  var snapshotted = false;

  function detectLang() {
    var params = new URLSearchParams(location.search);
    var q = params.get("lang");
    if (q && SUPPORTED.indexOf(q) !== -1) return q;
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    var nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (SUPPORTED.indexOf(nav) !== -1) return nav;
    return "en";
  }

  function loadData() {
    var el = document.getElementById("i18n-data");
    if (!el) return {};
    try { return JSON.parse(el.textContent); } catch (e) { return {}; }
  }

  function snapshotOriginal() {
    if (snapshotted) return;
    snapshotted = true;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (el.hasAttribute("data-i18n-html")) original.html[key] = el.innerHTML;
      else original.text[key] = el.textContent;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var parts = pair.split(":");
        var attr = parts[0], key = parts[1];
        original.attr[key] = { el: el, attr: attr, val: el.getAttribute(attr) };
      });
    });
  }

  function apply(lang, data) {
    snapshotOriginal();
    document.documentElement.lang = lang;
    var dict = lang !== "en" ? data[lang] : null;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var isHtml = el.hasAttribute("data-i18n-html");
      var val = dict && dict[key] !== undefined ? dict[key] : (isHtml ? original.html[key] : original.text[key]);
      if (val === undefined) return;
      if (isHtml) el.innerHTML = val;
      else el.textContent = val;
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var parts = pair.split(":");
        var attr = parts[0], key = parts[1];
        var fallback = original.attr[key] ? original.attr[key].val : undefined;
        var val = dict && dict[key] !== undefined ? dict[key] : fallback;
        if (val !== undefined) el.setAttribute(attr, val);
      });
    });

    document.querySelectorAll(".langnav a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-lang") === lang);
    });
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    var url = new URL(location.href);
    url.searchParams.set("lang", lang);
    history.replaceState(null, "", url);
    apply(lang, loadData());
  }

  document.addEventListener("DOMContentLoaded", function () {
    snapshotOriginal();
    var data = loadData();
    var lang = detectLang();
    apply(lang, data);
    document.querySelectorAll(".langnav a[data-lang]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        setLang(a.getAttribute("data-lang"));
      });
    });
  });
})();
