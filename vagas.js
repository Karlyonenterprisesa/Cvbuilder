/* Advision CV Builder — pesquisa, filtros e ordenação na página de vagas (PT/EN) */
(function () {
  "use strict";
  var cards = [].slice.call(document.querySelectorAll(".vg-card"));
  if (!cards.length) return;
  var I = {
    pt: { ph: "Pesquisar por vaga, empresa ou local…", btn: "Pesquisar", clr: "Limpar pesquisa", sort: "Ordenar por", s1: "Prazo mais próximo", s2: "Título (A–Z)", soon: "Termina em 7 dias", none: "Nenhuma vaga encontrada", tip: "Tente outras palavras ou limpe os filtros.", all: "vagas", one: "vaga", of: "de", lbl: "Pesquisar vagas" },
    en: { ph: "Search by job, company or place…", btn: "Search", clr: "Clear search", sort: "Sort by", s1: "Nearest deadline", s2: "Title (A–Z)", soon: "Ends within 7 days", none: "No jobs found", tip: "Try other words or clear the filters.", all: "jobs", one: "job", of: "of", lbl: "Search jobs" }
  };
  var lg = function () { return window.CVX && window.CVX.lang() === "en" ? "en" : "pt"; };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim(); };
  var today = new Date(), iso = today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2);
  var week = new Date(today.getTime() + 7 * 864e5), isoW = week.getFullYear() + "-" + ("0" + (week.getMonth() + 1)).slice(-2) + "-" + ("0" + week.getDate()).slice(-2);
  var items = cards.map(function (c, i) {
    var a = c.querySelector("h3 a"), slug = a ? (a.getAttribute("href") || "").split("/").pop() : "";
    return { el: c, i: i, slug: slug, txt: norm(c.textContent + " " + (c.getAttribute("data-q") || "")), title: norm(a && a.textContent), prazo: "" };
  });
  var parent = cards[0].parentNode, anchor = cards[cards.length - 1].nextSibling;

  var box = document.createElement("div");
  box.className = "vg-tools";
  box.setAttribute("role", "search");
  box.innerHTML = '<form class="vg-form" novalidate><div class="vg-field"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="vgQ" type="search" autocomplete="off" enterkeyhint="search" spellcheck="false"><button type="button" class="vg-x" hidden>×</button></div><button type="submit" class="vg-go"></button></form><div class="vg-row"><label class="vg-sel"><span></span><select id="vgS"><option value="p"></option><option value="a"></option></select></label><button type="button" class="vg-pill" aria-pressed="false"></button><span class="vg-count" aria-live="polite"></span></div><p class="vg-empty" hidden><b></b><span></span></p>';
  parent.insertBefore(box, cards[0]);
  var q = box.querySelector("#vgQ"), x = box.querySelector(".vg-x"), s = box.querySelector("#vgS"), pill = box.querySelector(".vg-pill"), cnt = box.querySelector(".vg-count"), em = box.querySelector(".vg-empty"), go = box.querySelector(".vg-go");

  function labels() {
    var t = I[lg()];
    q.placeholder = t.ph; q.setAttribute("aria-label", t.lbl); go.textContent = t.btn; x.setAttribute("aria-label", t.clr);
    box.querySelector(".vg-sel span").textContent = t.sort; s.options[0].text = t.s1; s.options[1].text = t.s2;
    pill.textContent = t.soon; em.querySelector("b").textContent = t.none; em.querySelector("span").textContent = t.tip;
    apply(true);
  }
  function apply(keep) {
    var t = I[lg()], words = norm(q.value).split(" ").filter(Boolean), soon = pill.getAttribute("aria-pressed") === "true", n = 0;
    x.hidden = !q.value;
    items.forEach(function (it) {
      var ok = words.every(function (w) { return it.txt.indexOf(w) > -1; });
      if (ok && soon) ok = !!it.prazo && it.prazo >= iso && it.prazo <= isoW;
      it.el.hidden = !ok; if (ok) n++;
    });
    var order = items.slice().sort(function (a, b) {
      if (s.value === "a") return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
      var pa = a.prazo || "9999", pb = b.prazo || "9999";
      return pa < pb ? -1 : pa > pb ? 1 : a.i - b.i;
    });
    order.forEach(function (it) { parent.insertBefore(it.el, anchor); });
    em.hidden = n > 0;
    cnt.textContent = n + " " + t.of + " " + items.length + " " + (items.length === 1 ? t.one : t.all);
    if (!keep) { try { var u = new URL(location.href); if (q.value) u.searchParams.set("q", q.value); else u.searchParams.delete("q"); history.replaceState(null, "", u); } catch (e) {} }
  }
  var tm; q.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(function () { apply(); }, 120); });
  box.querySelector("form").addEventListener("submit", function (e) { e.preventDefault(); apply(); q.blur(); var f = items.filter(function (i) { return !i.el.hidden; })[0]; if (f) f.el.scrollIntoView({ behavior: "smooth", block: "nearest" }); });
  x.addEventListener("click", function () { q.value = ""; apply(); q.focus(); });
  s.addEventListener("change", function () { apply(); });
  pill.addEventListener("click", function () { pill.setAttribute("aria-pressed", pill.getAttribute("aria-pressed") === "true" ? "false" : "true"); apply(); });
  document.addEventListener("keydown", function (e) { if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); } if (e.key === "Escape" && document.activeElement === q && q.value) { q.value = ""; apply(); } });
  document.addEventListener("cvx:lang", labels);
  try { var p = new URL(location.href).searchParams.get("q"); if (p) q.value = p; } catch (e) {}
  labels();
  fetch("/vagas-data.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : []; }).then(function (a) {
    var m = {}; (a || []).forEach(function (v) { m[v.slug] = v.prazo || ""; });
    items.forEach(function (it) { it.prazo = m[it.slug] || ""; }); apply(true);
  }).catch(function () {});
})();
