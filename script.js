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

/* Page motion: the hero card leans toward the pointer, project tiles carry a soft glow under the
   cursor, sections rise in as they scroll into view, and the hero numbers count up once.
   Everything is skipped when the reader asks for reduced motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduce) { return; }
  var root = document.documentElement;

  /* scroll reveal: each group's items rise in with a short stagger */
  var groups = [
    [".section-head", null],
    ["#projects .grid", ".tile"],
    ["#experience .job", ".job__meta, .rows > li"],
    ["#skills .grid", ".rows > li"],
    [".closing__links", ".stack-4, .footer__col"]
  ];
  var items = [];
  groups.forEach(function (g) {
    var hosts = document.querySelectorAll(g[0]);
    for (var i = 0; i < hosts.length; i++) {
      var list = g[1] ? hosts[i].querySelectorAll(g[1]) : [hosts[i]];
      for (var j = 0; j < list.length; j++) {
        list[j].classList.add("rv");
        list[j].style.setProperty("--rv-d", Math.min(j, 8) * 70 + "ms");
        items.push(list[j]);
      }
    }
  });
  if ("IntersectionObserver" in window && items.length) {
    root.classList.add("rv-on");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* hero numbers count up once, after the hero's entrance */
  function countUp(el) {
    var raw = el.textContent;
    var m = raw.match(/^(\D*)(\d+)(.*)$/);
    if (!m) { return; }
    var end = parseInt(m[2], 10), start = performance.now(), dur = 1100;
    function step(now) {
      var k = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = m[1] + Math.round(end * e) + m[3];
      if (k < 1) { requestAnimationFrame(step); } else { el.textContent = raw; }
    }
    requestAnimationFrame(step);
  }
  var nums = document.querySelectorAll(".hl-list b");
  setTimeout(function () { for (var i = 0; i < nums.length; i++) { countUp(nums[i]); } }, 450);

  if (!fine) { return; }

  /* hero card leans a little toward the pointer */
  var hero = document.querySelector(".hero");
  var card = document.querySelector(".hl-card");
  if (hero && card) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    var tick = function () {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      card.style.translate = cx.toFixed(2) + "px " + cy.toFixed(2) + "px";
      raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(tick) : 0;
    };
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 18;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 14;
      if (!raf) { raf = requestAnimationFrame(tick); }
    });
    hero.addEventListener("pointerleave", function () { tx = 0; ty = 0; if (!raf) { raf = requestAnimationFrame(tick); } });
  }

  /* a soft glow follows the cursor across project tiles and experience rows */
  var glow = document.querySelectorAll("#projects .tile, #experience .rows > li, #skills .rows > li");
  for (var i = 0; i < glow.length; i++) {
    glow[i].classList.add("glow");
    glow[i].addEventListener("pointermove", function (e) {
      var r = this.getBoundingClientRect();
      this.style.setProperty("--gx", (e.clientX - r.left) + "px");
      this.style.setProperty("--gy", (e.clientY - r.top) + "px");
    });
  }
})();
