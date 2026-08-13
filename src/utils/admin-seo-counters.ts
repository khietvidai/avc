/** Injected into /_emdash/admin so SEO Title / Meta Description show live counts. */
export const ADMIN_SEO_COUNTER_SCRIPT = `
(function () {
  if (window.__avcSeoCounters) return;
  window.__avcSeoCounters = true;

  function words(s) {
    var t = (s || "").trim();
    if (!t) return 0;
    return t.split(/\\s+/).length;
  }

  function tone(el, n, min, max) {
    if (!n) el.style.color = "#888";
    else if (n >= min && n <= max) el.style.color = "#3d7a2a";
    else el.style.color = "#b45309";
  }

  function decorate(input, kind) {
    if (input.dataset.avcSeo) return;
    input.dataset.avcSeo = kind;
    var hint = document.createElement("div");
    hint.style.cssText = "font-size:12px;margin-top:4px;font-variant-numeric:tabular-nums";
    input.insertAdjacentElement("afterend", hint);

    function tick() {
      var n = (input.value || "").length;
      var w = words(input.value);
      if (kind === "title") {
        hint.textContent = w + " từ · " + n + "/60 ký tự (chuẩn Google 50–60)";
        tone(hint, n, 50, 60);
      } else {
        hint.textContent = w + " từ · " + n + "/160 ký tự (chuẩn Google 140–160)";
        tone(hint, n, 140, 160);
      }
    }
    input.addEventListener("input", tick);
    tick();
  }

  function scan() {
    var nodes = document.querySelectorAll("input, textarea");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var label = "";
      if (el.id) {
        var lab = document.querySelector('label[for="' + el.id + '"]');
        if (lab) label = lab.textContent || "";
      }
      var wrap = el.closest("label, .field, [class*='Field'], [class*='seo']");
      if (wrap && !label) label = wrap.textContent || "";
      var near = (el.getAttribute("placeholder") || "") + " " + (el.getAttribute("name") || "") + " " + (el.getAttribute("aria-label") || "") + " " + label;
      if (/seo title|seo_title|seotitle/i.test(near) && el.tagName === "INPUT") decorate(el, "title");
      if (/meta description|seo description|seo_description/i.test(near) && (el.tagName === "TEXTAREA" || el.tagName === "INPUT")) decorate(el, "desc");
    }
  }

  scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
`.trim();
