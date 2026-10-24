// ForceKIT — script comune del sito: immagini a grandezza piena in un popup
// (frecce e tasti per scorrere, Esc o clic fuori per chiudere) e menu a tendina.
(function () {
  function label(key, fallback) {
    try {
      var lang = document.documentElement.lang || "en";
      var d = JSON.parse(document.getElementById("i18n-data").textContent);
      return (lang !== "en" && d[lang] && d[lang][key]) || fallback;
    } catch (e) { return fallback; }
  }
  document.addEventListener("DOMContentLoaded", function () {
    var items = [].slice.call(document.querySelectorAll("[data-zoom]"));
    if (items.length) {
      var lb = document.createElement("div");
      lb.className = "lb";
      lb.setAttribute("role", "dialog");
      lb.setAttribute("aria-modal", "true");
      lb.innerHTML = '<button type="button" class="lb-x">×</button><button type="button" class="lb-prev" aria-label="‹">‹</button><figure><img alt="" /><figcaption></figcaption></figure><button type="button" class="lb-next" aria-label="›">›</button><span class="lb-n"></span>';
      document.body.appendChild(lb);
      var img = lb.querySelector("img"), cap = lb.querySelector("figcaption"), num = lb.querySelector(".lb-n");
      var at = 0, last = null;
      var show = function (i) {
        at = (i + items.length) % items.length;
        var el = items[at];
        var im = el.tagName === "IMG" ? el : el.querySelector("img");
        img.src = el.getAttribute("href") || im.currentSrc || im.src;
        img.alt = im ? im.alt : "";
        var c = el.querySelector(".g-cap");
        cap.textContent = c ? c.textContent : (im ? im.alt : "");
        num.textContent = items.length > 1 ? at + 1 + " / " + items.length : "";
      };
      var open = function (i) {
        last = document.activeElement;
        show(i);
        lb.querySelector(".lb-x").setAttribute("aria-label", label("lbClose", "Close"));
        lb.classList.add("open");
        document.documentElement.style.overflow = "hidden";
        lb.querySelector(".lb-x").focus();
      };
      var close = function () {
        lb.classList.remove("open");
        document.documentElement.style.overflow = "";
        if (last) last.focus();
      };
      items.forEach(function (el, i) {
        el.addEventListener("click", function (e) { e.preventDefault(); open(i); });
        if (el.tagName === "IMG") { el.tabIndex = 0; el.addEventListener("keydown", function (e) { if (e.key === "Enter") open(i); }); }
      });
      lb.addEventListener("click", function (e) {
        if (e.target.closest(".lb-prev")) return show(at - 1);
        if (e.target.closest(".lb-next")) return show(at + 1);
        if (e.target === lb || e.target.closest(".lb-x")) close();
      });
      document.addEventListener("keydown", function (e) {
        if (!lb.classList.contains("open")) return;
        if (e.key === "Escape") close();
        else if (e.key === "ArrowLeft") show(at - 1);
        else if (e.key === "ArrowRight") show(at + 1);
      });
    }
    // menu a tendina: si chiude scegliendo una voce o cliccando fuori
    var menu = document.querySelector("details.menu");
    if (menu) {
      menu.addEventListener("click", function (e) { if (e.target.closest(".menu-list a")) menu.open = false; });
      document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    }
    // video: YouTube si carica solo al click, nella lingua corrente (data-video viene da i18n).
    // Su touch l'autoplay dopo il tap viene bloccato: il player vero si carica quando la sezione
    // si avvicina, cosi' il tap arriva direttamente a YouTube.
    var touch = window.matchMedia && matchMedia("(pointer: coarse)").matches && "IntersectionObserver" in window;
    document.querySelectorAll("button.video[data-video]").forEach(function (btn) {
      var load = function (autoplay) {
        if (!btn.isConnected) return;
        var box = document.createElement("div");
        box.className = "video";
        var frame = document.createElement("iframe");
        frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(btn.getAttribute("data-video")) + "?rel=0&playsinline=1" + (autoplay ? "&autoplay=1" : "");
        frame.title = btn.getAttribute("aria-label") || "ForceKIT";
        frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        frame.allowFullscreen = true;
        box.appendChild(frame);
        // il box eredita data-video/i18n: se si cambia lingua dopo, il player segue
        box.setAttribute("data-video", btn.getAttribute("data-video"));
        box.setAttribute("data-i18n-attr", "data-video:videoId");
        new MutationObserver(function () {
          if (frame.src.indexOf("embed/" + encodeURIComponent(box.getAttribute("data-video")) + "?") !== -1) return;
          frame.src = frame.src.replace(/embed\/[^?]+/, "embed/" + encodeURIComponent(box.getAttribute("data-video"))).replace("&autoplay=1", "");
        }).observe(box, { attributes: true, attributeFilter: ["data-video"] });
        btn.replaceWith(box);
      };
      btn.addEventListener("click", function () { load(true); });
      if (touch) {
        var io = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { io.disconnect(); load(false); }
        }, { rootMargin: "300px 0px" });
        io.observe(btn);
      }
    });
  });
})();
