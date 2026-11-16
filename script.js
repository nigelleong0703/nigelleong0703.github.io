/* The language switch: English (default) and Simplified Chinese.
   Every text node carries data-en / data-zh; labels carry data-aria-en / data-aria-zh;
   a diagram carries its Chinese spec in data-diagram-zh. Everything else (nav, motion,
   effects, moments, diagrams) is the kit's own scripts in assets/kit. */
(function () {
  "use strict";
  var KEY = "nl-portfolio-lang";
  var current = "en";

  function readStored() {
    try { var v = window.localStorage.getItem(KEY); return v === "zh" || v === "en" ? v : null; }
    catch (e) { return null; }
  }
  function remember(lang) {
    try { window.localStorage.setItem(KEY, lang); } catch (e) {}
  }

  /* the diagrams: keep each one's English spec, and swap in the language's spec */
  function diagramSpecs(lang) {
    var els = document.querySelectorAll("[data-diagram-zh]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el.hasAttribute("data-diagram-en")) { el.setAttribute("data-diagram-en", el.getAttribute("data-diagram") || ""); }
      el.setAttribute("data-diagram", el.getAttribute(lang === "zh" ? "data-diagram-zh" : "data-diagram-en"));
    }
    return els;
  }
  function redrawDiagrams(els) {
    if (!els.length) { return; }
    var url = new URL("assets/kit/diagrams/diagram.js", document.baseURI).href;
    import(url).then(function (m) {
      var dg = m.default || m;
      for (var i = 0; i < els.length; i++) {
        try { dg.mount(els[i], JSON.parse(els[i].getAttribute("data-diagram"))); } catch (e) {}
      }
    }).catch(function () {});
  }

  function apply(lang, redraw) {
    var nodes = document.querySelectorAll("[data-en]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var value = el.getAttribute(lang === "zh" ? "data-zh" : "data-en");
      if (value === null) { continue; }
      if (el.tagName === "IMG") { el.setAttribute("alt", value); }
      else if (el.tagName === "META") { el.setAttribute("content", value); }
      else { el.textContent = value; }
    }
    var labelled = document.querySelectorAll("[data-aria-en]");
    for (var j = 0; j < labelled.length; j++) {
      var aria = labelled[j].getAttribute(lang === "zh" ? "data-aria-zh" : "data-aria-en");
      if (aria !== null) { labelled[j].setAttribute("aria-label", aria); }
    }
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");
    var toggle = document.getElementById("lang-toggle");
    if (toggle) { toggle.setAttribute("lang", lang === "zh" ? "en" : "zh-CN"); }
    var specs = diagramSpecs(lang);
    if (redraw) { redrawDiagrams(specs); }
  }

  function setLang(lang) {
    current = lang === "zh" ? "zh" : "en";
    remember(current);
    apply(current, true);
  }

  /* runs before the kit's modules (a deferred script ahead of them), so a stored Chinese page
     is drawn in Chinese from the start: the hero's entrance, the diagrams and the marquee read it */
  current = readStored() || "en";
  if (current !== "en") { apply(current, false); }
  document.addEventListener("click", function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest("#lang-toggle") : null;
    if (t) { setLang(current === "zh" ? "en" : "zh"); }
  });
})();
