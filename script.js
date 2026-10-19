(function () {
  "use strict";
  var LANG_KEY = "nl-portfolio-lang";
  var supported = ["en", "zh"];
  var current = "en";
  var SIDEBAR_KEY = "nl-portfolio-sidebar";
  var NAV_LABELS = { collapse: { en: "Collapse sidebar", zh: "收起侧边栏" }, expand: { en: "Expand sidebar", zh: "展开侧边栏" } };
  var VIEW_BY_HASH = { "#top": "home", "#intro": "home", "#home": "home", "#home-feature": "home", "#feature-title": "home", "#work": "work", "#juno-title": "work", "#pilot-title": "work", "#taiji-title": "work", "#dynamo-case": "work", "#dynamo-title": "work", "#experience": "experience", "#exp-title": "experience", "#about": "about", "#about-title": "about", "#contact": "contact", "#contact-title": "contact" };
  var NAV_VIEW = { "#top": "home", "#work": "work", "#experience": "experience", "#about": "about", "#contact": "contact" };
  var SECTION_BY_VIEW = { home: "top", work: "work", experience: "experience", about: "about", contact: "contact" };
  var openerThumb = null;
  var currentThumb = null;
  var galleryList = [];
  var galleryIndex = -1;
  function readStored() {
    try {
      var v = window.localStorage.getItem(LANG_KEY);
      return supported.indexOf(v) !== -1 ? v : null;
    } catch (e) {
      return null;
    }
  }
  function remember(lang) {
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
    }
  }
  function applyLang(lang) {
    var nodes = document.querySelectorAll("[data-en]");
    var i, el, value, tag;
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      value = lang === "zh" ? el.getAttribute("data-zh") : el.getAttribute("data-en");
      if (value === null) continue;
      tag = el.tagName;
      if (tag === "IMG") { el.setAttribute("alt", value); }
      else if (tag === "META") { el.setAttribute("content", value); }
      else { el.textContent = value; }
    }
    var labelled = document.querySelectorAll("[data-aria-en]");
    var j, lab, aria;
    for (j = 0; j < labelled.length; j++) {
      lab = labelled[j];
      aria = lang === "zh" ? lab.getAttribute("data-aria-zh") : lab.getAttribute("data-aria-en");
      if (aria !== null) { lab.setAttribute("aria-label", aria); }
    }
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");
    var btnEn = document.getElementById("lang-en");
    var btnZh = document.getElementById("lang-zh");
    if (btnEn) { btnEn.setAttribute("aria-pressed", lang === "en" ? "true" : "false"); }
    if (btnZh) { btnZh.setAttribute("aria-pressed", lang === "zh" ? "true" : "false"); }
    syncCollapseLabel();
    syncNavTitles();
    syncLightboxCaption();
  }
  function syncNavTitles() {
    var links = document.querySelectorAll(".nav-list a");
    var i, lab;
    for (i = 0; i < links.length; i++) {
      lab = links[i].getAttribute("aria-label");
      if (lab) { links[i].setAttribute("title", lab); }
    }
  }
  function syncLightboxCaption() {
    var caption = document.getElementById("lightbox-caption");
    var thumb = currentThumb || openerThumb;
    if (!caption || !thumb) { return; }
    var fig = thumb.closest ? thumb.closest("figure") : null;
    var fc = fig ? fig.querySelector("figcaption") : null;
    caption.textContent = fc ? fc.textContent : "";
    var inner = thumb.querySelector("img");
    var big = document.getElementById("lightbox-img");
    if (big && inner) { big.setAttribute("alt", inner.getAttribute("alt") || ""); }
  }
  function setLang(lang) {
    if (supported.indexOf(lang) === -1) { lang = "en"; }
    current = lang;
    remember(lang);
    applyLang(lang);
  }
  function galleryButtons(btn) {
    var gallery = btn.getAttribute("data-gallery");
    var all = document.querySelectorAll(".shot-btn");
    var list = [];
    var k, g;
    for (k = 0; k < all.length; k++) {
      g = all[k].getAttribute("data-gallery");
      if (g === gallery) { list.push(all[k]); }
    }
    if (list.length === 0) { list.push(btn); }
    return list;
  }
  function showItem(index) {
    var dialog = document.getElementById("lightbox");
    var big = document.getElementById("lightbox-img");
    var caption = document.getElementById("lightbox-caption");
    var count = document.getElementById("lightbox-count");
    if (galleryList.length === 0) { return; }
    galleryIndex = (index + galleryList.length) % galleryList.length;
    var btn = galleryList[galleryIndex];
    currentThumb = btn;
    var full = btn.getAttribute("data-full") || btn.getAttribute("href");
    var inner = btn.querySelector("img");
    if (full) { big.setAttribute("src", full); }
    big.setAttribute("alt", inner ? (inner.getAttribute("alt") || "") : "");
    var fig = btn.closest ? btn.closest("figure") : null;
    var fc = fig ? fig.querySelector("figcaption") : null;
    caption.textContent = fc ? fc.textContent : "";
    if (count) { count.textContent = (galleryIndex + 1) + " / " + galleryList.length; }
    if (dialog && !dialog.open) {
      dialog.showModal();
      document.body.classList.add("lightbox-open");
    }
  }
  function stepLightbox(delta) {
    if (galleryList.length === 0) { return; }
    showItem(galleryIndex + delta);
  }
  function wireLightbox() {
    var dialog = document.getElementById("lightbox");
    var big = document.getElementById("lightbox-img");
    var caption = document.getElementById("lightbox-caption");
    var prev = document.getElementById("lightbox-prev");
    var next = document.getElementById("lightbox-next");
    if (!dialog || !big || !caption) { return; }
    if (typeof dialog.showModal !== "function") { return; }
    var thumbs = document.querySelectorAll(".shot-btn");
    var openFrom = function (btn) {
      galleryList = galleryButtons(btn);
      openerThumb = btn;
      showItem(galleryList.indexOf(btn));
    };
    for (var i = 0; i < thumbs.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function (event) {
          if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) { return; }
          event.preventDefault();
          openFrom(btn);
        });
      })(thumbs[i]);
    }
    if (prev) { prev.addEventListener("click", function () { stepLightbox(-1); }); }
    if (next) { next.addEventListener("click", function () { stepLightbox(1); }); }
    document.addEventListener("keydown", function (event) {
      if (!dialog.open) { return; }
      if (event.key === "ArrowLeft") { event.preventDefault(); stepLightbox(-1); }
      else if (event.key === "ArrowRight") { event.preventDefault(); stepLightbox(1); }
    });
    var downOnBackdrop = false;
    dialog.addEventListener("pointerdown", function (event) {
      downOnBackdrop = (event.target === dialog);
    });
    dialog.addEventListener("pointerup", function (event) {
      if (downOnBackdrop && event.target === dialog) { dialog.close(); }
      downOnBackdrop = false;
    });
    dialog.addEventListener("close", function () {
      document.body.classList.remove("lightbox-open");
      big.removeAttribute("src");
      galleryList = [];
      galleryIndex = -1;
      currentThumb = null;
      if (openerThumb && typeof openerThumb.focus === "function") {
        try { openerThumb.focus(); } catch (e) {}
      }
      openerThumb = null;
    });
  }
  function wireTour() {
    var tour = document.getElementById("juno-tour");
    if (!tour) { return; }
    tour.addEventListener("toggle", function () {
      if (!tour.open) {
        var video = tour.querySelector("video");
        if (video) { video.pause(); }
      }
    });
  }
  function prefersReduced() {
    try {
      return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) { return false; }
  }
  function safeGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) {}
  }
  function syncCollapseLabel() {
    var btn = document.getElementById("sidebar-collapse");
    if (!btn) { return; }
    var collapsed = document.body.classList.contains("sidebar-collapsed");
    var key = collapsed ? "expand" : "collapse";
    var labels = NAV_LABELS[key];
    btn.setAttribute("aria-label", current === "zh" ? labels.zh : labels.en);
    var span = btn.querySelector(".collapse-label");
    if (span) { span.textContent = collapsed ? (current === "zh" ? "展开" : "Expand") : (current === "zh" ? "收起" : "Collapse"); }
  }
  function wireCollapse() {
    var btn = document.getElementById("sidebar-collapse");
    if (!btn) { return; }
    if (safeGet(SIDEBAR_KEY) === "collapsed") {
      document.body.classList.add("sidebar-collapsed");
      btn.setAttribute("aria-expanded", "false");
    }
    btn.addEventListener("click", function () {
      var collapsed = document.body.classList.toggle("sidebar-collapsed");
      btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      safeSet(SIDEBAR_KEY, collapsed ? "collapsed" : "expanded");
      syncCollapseLabel();
    });
    syncCollapseLabel();
  }
  function wireDrawer() {
    var toggle = document.getElementById("nav-toggle");
    var header = document.getElementById("site-header");
    var backdrop = document.getElementById("nav-backdrop");
    var main = document.getElementById("main");
    if (!toggle || !header) { return; }
    var lastFocus = null;
    function isOpen() { return document.body.classList.contains("nav-open"); }
    function openNav() {
      lastFocus = document.activeElement;
      document.body.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
      if (backdrop) { backdrop.hidden = false; }
      if (main && "inert" in main) { try { main.inert = true; } catch (e) {} }
      var cands = header.querySelectorAll("a[href], button:not([disabled])");
      var first = null;
      for (var fi = 0; fi < cands.length; fi++) {
        if (cands[fi].getClientRects && cands[fi].getClientRects().length > 0) { first = cands[fi]; break; }
      }
      if (first && typeof first.focus === "function") { try { first.focus(); } catch (e2) {} }
    }
    function closeNav() {
      if (!isOpen()) { return; }
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      if (backdrop) { backdrop.hidden = true; }
      if (main && "inert" in main) { try { main.inert = false; } catch (e) {} }
      if (lastFocus && typeof lastFocus.focus === "function") { try { lastFocus.focus(); } catch (e2) {} }
      lastFocus = null;
    }
    toggle.addEventListener("click", function () { if (isOpen()) { closeNav(); } else { openNav(); } });
    var close = document.getElementById("nav-close");
    if (close) { close.addEventListener("click", closeNav); }
    if (backdrop) { backdrop.addEventListener("click", function () { closeNav(); }); }
    header.addEventListener("click", function (ev) {
      var t = ev.target;
      var link = t && t.closest && t.closest("a");
      if (link) { closeNav(); }
    });
    document.addEventListener("keydown", function (ev) {
      if (!isOpen()) { return; }
      if (ev.key === "Escape") { ev.preventDefault(); closeNav(); return; }
      if (ev.key !== "Tab") { return; }
      var nodes = header.querySelectorAll("a[href], button:not([disabled])");
      var items = [];
      for (var m = 0; m < nodes.length; m++) {
        if (nodes[m].getClientRects && nodes[m].getClientRects().length > 0) { items.push(nodes[m]); }
      }
      if (items.length === 0) { return; }
      var first = items[0];
      var last = items[items.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); try { last.focus(); } catch (e) {} }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); try { first.focus(); } catch (e2) {} }
    });
    document.body.classList.add("drawer-ready");
  }
  function scrollToTarget(id) {
    var el = document.getElementById(id);
    if (!el || typeof el.scrollIntoView !== "function") { return; }
    var behavior = prefersReduced() ? "auto" : "smooth";
    var run = function () {
      try { el.scrollIntoView({ behavior: behavior, block: "start" }); }
      catch (e) { try { el.scrollIntoView(); } catch (e2) {} }
    };
    if (typeof window.requestAnimationFrame === "function") { window.requestAnimationFrame(run); }
    else { run(); }
  }
  function syncNav(view) {
    var links = document.querySelectorAll(".nav-list a");
    var i, v;
    for (i = 0; i < links.length; i++) {
      v = NAV_VIEW[links[i].getAttribute("href")];
      if (v && v === view) { links[i].setAttribute("aria-current", "page"); }
      else { links[i].removeAttribute("aria-current"); }
    }
  }
  function activateView(view, targetId) {
    if (view !== "work") {
      var vids = document.querySelectorAll("video");
      for (var vi = 0; vi < vids.length; vi++) { try { vids[vi].pause(); } catch (e) {} }
    }
    document.body.classList.add("views-on");
    document.body.setAttribute("data-active-view", view);
    var secs = document.querySelectorAll(".viewsec");
    var i, k, tags, match;
    for (i = 0; i < secs.length; i++) {
      tags = (secs[i].getAttribute("data-viewsec") || "").split(" ");
      match = (view === "all");
      for (k = 0; k < tags.length; k++) { if (tags[k] === view) { match = true; } }
      if (match) {
        secs[i].classList.remove("view-enter");
        void secs[i].offsetWidth;
        secs[i].classList.add("view-enter");
      } else {
        secs[i].classList.remove("view-enter");
      }
    }
    syncNav(view);
    if (targetId) { scrollToTarget(targetId); }
  }
  function routeFromHash() {
    var hash = "";
    try { hash = window.location.hash || ""; } catch (e) { hash = ""; }
    if (!hash || hash === "#") { activateView("home", "top"); return; }
    var id = hash.slice(1);
    var cut = id.indexOf("?");
    if (cut !== -1) { id = id.slice(0, cut); }
    var view = VIEW_BY_HASH["#" + id];
    if (!view) { activateView("all", null); return; }
    var isDeep = (view === "work" && id !== "work");
    activateView(view, isDeep ? id : SECTION_BY_VIEW[view]);
  }
  function initViews() {
    try {
      window.addEventListener("hashchange", routeFromHash);
      routeFromHash();
    } catch (e) {
      try { document.body.classList.remove("views-on"); document.body.removeAttribute("data-active-view"); } catch (e2) {}
    }
  }
  function init() {
    var btnEn = document.getElementById("lang-en");
    var btnZh = document.getElementById("lang-zh");
    if (btnEn) { btnEn.addEventListener("click", function () { setLang("en"); }); }
    if (btnZh) { btnZh.addEventListener("click", function () { setLang("zh"); }); }
    var stored = readStored();
    current = stored ? stored : "en";
    applyLang(current);
    wireLightbox();
    wireTour();
    wireCollapse();
    wireDrawer();
    initViews();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
