/* =========================================================================
   Memories — shared interactions
   - Scroll reveal (IntersectionObserver)
   - Distraction-free lightbox + slideshow (keyboard, autoplay, swipe)
   - Copy-link helper
   No dependencies. Progressive enhancement only.
   ========================================================================= */
(function () {
  "use strict";

  /* ---- Scroll reveal -------------------------------------------------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Lightbox / slideshow ------------------------------------------ */
  var lb = document.getElementById("lightbox");
  if (lb) {
    var imgEl = lb.querySelector(".lb__img");
    var counterEl = lb.querySelector(".lb__counter");
    var captionEl = lb.querySelector(".lb__caption");
    var playBtn = lb.querySelector("[data-lb='play']");

    var items = [];   // { src, caption }
    var index = 0;
    var playing = false;
    var timer = null;
    var DELAY = 3500;

    function collect() {
      items = Array.prototype.map.call(
        document.querySelectorAll("[data-photo]"),
        function (node) {
          var img = node.querySelector("img") || node;
          return {
            src: node.getAttribute("data-full") || img.getAttribute("src"),
            caption: node.getAttribute("data-caption") || img.getAttribute("alt") || ""
          };
        }
      );
    }

    function render() {
      var item = items[index];
      if (!item) return;
      imgEl.classList.remove("show");
      var next = new Image();
      next.onload = function () {
        imgEl.src = item.src;
        imgEl.alt = item.caption;
        // reflow then animate in
        requestAnimationFrame(function () { imgEl.classList.add("show"); });
      };
      next.src = item.src;
      counterEl.textContent = (index + 1) + " / " + items.length;
      captionEl.textContent = item.caption;
    }

    function open(i) {
      collect();
      index = i;
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      render();
    }

    function close() {
      stop();
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function go(dir) {
      index = (index + dir + items.length) % items.length;
      render();
    }

    function play() {
      playing = true;
      lb.dataset.playing = "true";
      timer = setInterval(function () { go(1); }, DELAY);
    }
    function stop() {
      playing = false;
      lb.dataset.playing = "false";
      if (timer) { clearInterval(timer); timer = null; }
    }
    function toggle() { playing ? stop() : play(); }

    // Open from any [data-photo]
    document.addEventListener("click", function (e) {
      var node = e.target.closest("[data-photo]");
      if (!node) return;
      collect();
      var all = Array.prototype.slice.call(document.querySelectorAll("[data-photo]"));
      open(all.indexOf(node));
    });

    // Controls
    lb.addEventListener("click", function (e) {
      var action = e.target.closest("[data-lb]");
      if (action) {
        var kind = action.getAttribute("data-lb");
        if (kind === "close") close();
        else if (kind === "prev") { stop(); go(-1); }
        else if (kind === "next") { stop(); go(1); }
        else if (kind === "play") toggle();
        return;
      }
      // click on empty backdrop closes
      if (e.target === lb || e.target.classList.contains("lb__stage")) close();
    });

    // Keyboard
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") { stop(); go(1); }
      else if (e.key === "ArrowLeft") { stop(); go(-1); }
      else if (e.key === " ") { e.preventDefault(); toggle(); }
    });

    // Touch swipe
    var startX = null;
    lb.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { stop(); go(dx < 0 ? 1 : -1); }
      startX = null;
    }, { passive: true });
  }

  /* ---- Copy link ------------------------------------------------------ */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-copy]");
    if (!btn) return;
    var text = btn.getAttribute("data-copy") || window.location.href;
    var done = function () {
      var label = btn.querySelector("[data-copy-label]") || btn;
      var prev = label.textContent;
      label.textContent = "Copied";
      setTimeout(function () { label.textContent = prev; }, 1600);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done);
    else done();
  });

  /* ---- Segmented control (tabs) -------------------------------------- */
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    group.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-tab]");
      if (!btn) return;
      group.querySelectorAll("button[data-tab]").forEach(function (b) {
        b.setAttribute("aria-selected", String(b === btn));
      });
      var target = btn.getAttribute("data-tab");
      document.querySelectorAll("[data-panel]").forEach(function (p) {
        p.hidden = p.getAttribute("data-panel") !== target;
      });
    });
  });
})();
