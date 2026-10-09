/* Advision CV Builder — pesquisa, filtros e ordenação na página de vagas (PT/EN) */
(function () {
  "use strict";
  var cards = [].slice.call(document.querySelectorAll(".vg-card"));
  if (!cards.length) return;
  var I = {
    pt: { ph: "Pesquisar por vaga, empresa ou local…", btn: "Pesquisar", clr: "Limpar pesquisa", none: "Nenhuma vaga encontrada", tip: "Tente outras palavras.", one: "resultado", many: "resultados", forq: "para" },
    en: { ph: "Search by job, company or place…", btn: "Search", clr: "Clear search", none: "No jobs found", tip: "Try other words.", one: "result", many: "results", forq: "for" }
  };
  var lg = function () { return window.CVX && window.CVX.lang() === "en" ? "en" : "pt"; };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim(); };
  var items = cards.map(function (c, i) {
    var a = c.querySelector("h3 a"), slug = a ? (a.getAttribute("href") || "").split("/").pop() : "";
    return { el: c, i: i, slug: slug, txt: norm(c.textContent + " " + (c.getAttribute("data-q") || "")), prazo: "" };
  });
  var parent = cards[0].parentNode, anchor = cards[cards.length - 1].nextSibling;
  var intro = [].slice.call(parent.children).filter(function (n) { return n.classList.contains("title") || (n.classList.contains("card") && !n.classList.contains("vg-card")); });

  var box = document.createElement("div");
  box.className = "vg-tools";
  box.setAttribute("role", "search");
  box.innerHTML = '<form class="vg-form" novalidate><div class="vg-field"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="vgQ" type="search" autocomplete="off" enterkeyhint="search" spellcheck="false"><button type="button" class="vg-x" hidden>×</button></div><button type="submit" class="vg-go"></button></form>';
  var res = document.createElement("p"); res.className = "vg-res"; res.hidden = true; res.setAttribute("aria-live", "polite");
  var em = document.createElement("p"); em.className = "vg-empty"; em.hidden = true; em.innerHTML = "<b></b><span></span>";
  var first = parent.firstElementChild;
  parent.insertBefore(box, first); parent.insertBefore(res, first); parent.insertBefore(em, first);
  var q = box.querySelector("#vgQ"), x = box.querySelector(".vg-x"), go = box.querySelector(".vg-go");

  function labels() {
    var t = I[lg()];
    q.placeholder = t.ph; q.setAttribute("aria-label", t.ph); go.textContent = t.btn; x.setAttribute("aria-label", t.clr);
    em.querySelector("b").textContent = t.none; em.querySelector("span").textContent = t.tip;
    apply(true);
  }
  function apply(keep) {
    var t = I[lg()], words = norm(q.value).split(" ").filter(Boolean), n = 0, on = words.length > 0;
    x.hidden = !q.value;
    items.forEach(function (it) {
      var ok = words.every(function (w) { return it.txt.indexOf(w) > -1; });
      it.el.hidden = !ok; if (ok) n++;
    });
    var order = items.slice().sort(function (a, b) {
      var pa = a.prazo || "9999", pb = b.prazo || "9999";
      return pa < pb ? -1 : pa > pb ? 1 : a.i - b.i;
    });
    order.forEach(function (it) { parent.insertBefore(it.el, anchor); });
    intro.forEach(function (n) { n.hidden = on; n.style.display = on ? "none" : ""; });
    em.hidden = !(on && n === 0);
    res.hidden = !(on && n > 0);
    res.textContent = n + " " + (n === 1 ? t.one : t.many) + " " + t.forq + " “" + q.value.trim() + "”";
    if (!keep) { try { var u = new URL(location.href); if (q.value) u.searchParams.set("q", q.value); else u.searchParams.delete("q"); history.replaceState(null, "", u); } catch (e) {} }
  }
  var tm; q.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(function () { apply(); }, 120); });
  box.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); apply(); q.blur(); var f = items.filter(function (i) { return !i.el.hidden; })[0]; if (f) res.scrollIntoView({ behavior: "smooth", block: "start" }); });
  x.addEventListener("click", function () { q.value = ""; apply(); q.focus(); });
  document.addEventListener("keydown", function (e) { if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); } if (e.key === "Escape" && document.activeElement === q && q.value) { q.value = ""; apply(); } });
  document.addEventListener("cvx:lang", labels);
  try { var p = new URL(location.href).searchParams.get("q"); if (p) q.value = p; } catch (e) {}
  labels();
  fetch("/vagas-data.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : []; }).then(function (a) {
    var m = {}; (a || []).forEach(function (v) { m[v.slug] = v.prazo || ""; });
    items.forEach(function (it) { it.prazo = m[it.slug] || ""; }); apply(true);
  }).catch(function () {});
})();
