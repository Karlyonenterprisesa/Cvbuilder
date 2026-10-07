/* Advision CV Builder — PWA: registo do service worker e botão flutuante «Instalar app».
   Regras: 1.ª vez após 3 min no site; fica visível 10 s; volta a cada 10 min. Nunca aparece se a app já estiver instalada. */
(function () {
  "use strict";
  var FIRST = 3 * 60 * 1000, SHOW = 10 * 1000, EVERY = 10 * 60 * 1000;
  var K_FIRST = "advision_pwa_first", K_LAST = "advision_pwa_last", K_DONE = "advision_pwa_done";
  var deferred = null, timer = null, hideT = null;
  var ua = navigator.userAgent || "";
  var isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function standalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  }
  function installed() { return standalone() || ls(K_DONE) === "1"; }

  if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
  }

  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; });
  window.addEventListener("appinstalled", function () { ls(K_DONE, "1"); deferred = null; remove(); });

  if (installed()) return;
  if (!ls(K_FIRST)) ls(K_FIRST, String(Date.now()));

  function remove() {
    clearTimeout(hideT);
    var b = document.getElementById("pwaInstall"); if (b) b.remove();
  }
  function help() {
    var d = document.createElement("div");
    d.id = "pwaHelp"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true");
    d.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(5,12,25,.6);display:flex;align-items:flex-end;justify-content:center;padding:16px;font:15px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif";
    var txt = isIOS
      ? "Toque no botão <b>Partilhar</b> (quadrado com seta) e escolha <b>Adicionar ao ecrã principal</b>."
      : "Abra o menu do navegador (⋮) e escolha <b>Instalar aplicação</b> ou <b>Adicionar ao ecrã principal</b>.";
    d.innerHTML = '<div style="background:#fff;color:#0b1a33;max-width:420px;width:100%;border-radius:16px;padding:18px 18px 14px;box-shadow:0 10px 40px rgba(0,0,0,.4)"><p style="margin:0 0 8px;font-weight:800;font-size:17px">Instalar o CV Builder</p><p style="margin:0 0 14px;text-align:left">' + txt + '</p><button type="button" id="pwaHelpOk" style="min-height:44px;width:100%;border:0;border-radius:999px;background:#1c5ff0;color:#fff;font-weight:800;font-size:15px">Entendi</button></div>';
    document.body.appendChild(d);
    d.onclick = function (e) { if (e.target === d || e.target.id === "pwaHelpOk") d.remove(); };
  }
  function install() {
    remove();
    if (deferred) {
      var ev = deferred; deferred = null;
      ev.prompt();
      if (ev.userChoice) ev.userChoice.then(function (r) { if (r && r.outcome === "accepted") ls(K_DONE, "1"); });
    } else { help(); }
  }
  function show() {
    if (document.getElementById("pwaInstall")) return;
    ls(K_LAST, String(Date.now()));
    var bottom = document.getElementById("cookieBanner") ? "92px" : "16px";
    var w = document.createElement("div");
    w.id = "pwaInstall"; w.setAttribute("role", "region"); w.setAttribute("aria-label", "Instalar aplicação");
    w.style.cssText = "position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(" + bottom + " + env(safe-area-inset-bottom,0px));z-index:99998;display:flex;align-items:center;gap:4px;background:#1c5ff0;color:#fff;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.35);font:700 15px/1 -apple-system,Segoe UI,Roboto,Arial,sans-serif;opacity:0;transform:translateY(12px);transition:opacity .3s,transform .3s;max-width:calc(100vw - 32px)";
    w.innerHTML = '<button type="button" id="pwaGo" style="display:flex;align-items:center;gap:8px;min-height:48px;padding:0 6px 0 16px;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer"><span aria-hidden="true" style="font-size:18px">⬇</span>Instalar app</button><button type="button" id="pwaX" aria-label="Fechar" style="min-height:48px;min-width:44px;border:0;background:transparent;color:#dbe6ff;font-size:20px;cursor:pointer">×</button>';
    document.body.appendChild(w);
    requestAnimationFrame(function () { w.style.opacity = "1"; w.style.transform = "none"; });
    document.getElementById("pwaGo").onclick = install;
    document.getElementById("pwaX").onclick = remove;
    hideT = setTimeout(function () {
      w.style.opacity = "0"; w.style.transform = "translateY(12px)";
      setTimeout(remove, 320);
    }, SHOW);
  }
  function tick() {
    if (installed()) { clearInterval(timer); remove(); return; }
    if (document.visibilityState !== "visible") return;
    if (!deferred && !isIOS) return;           /* só mostra se o navegador permitir instalar */
    var now = Date.now(), first = +ls(K_FIRST) || now, last = +ls(K_LAST) || 0;
    if (now - first >= FIRST && (!last || now - last >= EVERY)) show();
  }
  function start() { timer = setInterval(tick, 5000); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
