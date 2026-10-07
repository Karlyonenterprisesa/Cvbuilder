/* Advision CV Builder — consentimento de cookies, Google Consent Mode v2, Analytics e AdSense.
   - GA_ID: preencha com o ID do Google Analytics 4 (ex.: "G-XXXXXXXXXX").
   - AD_SLOT: opcional. ID de um bloco de anúncios criado no AdSense (só números).
     Se ficar vazio, o AdSense usa os "Anúncios automáticos" (se activados na sua conta).
   Anúncios só aparecem em páginas com <body data-ads="on"> e só depois de consentimento. */
(function () {
  "use strict";
  var CFG = {
    ADSENSE_CLIENT: "ca-pub-5846610296337932",
    GA_ID: "",
    AD_SLOT: ""
  };
  var KEY = "advision_consent_v1";
  var body = function () { return document.body; };
  var adsPage = function () { return body() && body().getAttribute("data-ads") === "on"; };
  var needs = !!(CFG.ADSENSE_CLIENT || CFG.GA_ID);

  /* Consent Mode v2: tudo negado por defeito, antes de qualquer script Google */
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied", wait_for_update: 500 });

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function load(src, attrs) {
    if (document.querySelector('script[src="' + src + '"]')) return;
    var s = document.createElement("script"); s.async = true; s.src = src;
    for (var k in (attrs || {})) s.setAttribute(k, attrs[k]);
    document.head.appendChild(s);
  }
  function revoke() {
    window.gtag("consent", "update", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
  }
  function activate() {
    window.gtag("consent", "update", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" });
    if (CFG.GA_ID) {
      window.gtag("js", new Date());
      window.gtag("config", CFG.GA_ID, { anonymize_ip: true });
      load("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CFG.GA_ID));
    }
    if (CFG.ADSENSE_CLIENT && adsPage()) {
      load("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(CFG.ADSENSE_CLIENT), { crossorigin: "anonymous" });
      if (CFG.AD_SLOT) {
        var slots = document.querySelectorAll("[data-adslot]");
        for (var i = 0; i < slots.length; i++) {
          if (slots[i].firstChild) continue;
          var ins = document.createElement("ins");
          ins.className = "adsbygoogle"; ins.style.display = "block";
          ins.setAttribute("data-ad-client", CFG.ADSENSE_CLIENT);
          ins.setAttribute("data-ad-slot", CFG.AD_SLOT);
          ins.setAttribute("data-ad-format", "auto");
          ins.setAttribute("data-full-width-responsive", "true");
          slots[i].appendChild(ins);
          try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
        }
      }
    }
  }
  function closeBanner() { var b = document.getElementById("cookieBanner"); if (b) b.remove(); }
  function choose(v) { set(v); closeBanner(); if (v === "granted") activate(); else revoke(); }
  function banner() {
    if (document.getElementById("cookieBanner")) return;
    var d = document.createElement("div");
    d.id = "cookieBanner"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Aviso de cookies");
    d.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#0b1a33;color:#fff;padding:14px 16px calc(14px + env(safe-area-inset-bottom,0px));box-shadow:0 -4px 20px rgba(0,0,0,.3);font:14px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif";
    d.innerHTML = '<div style="max-width:860px;margin:0 auto;display:flex;gap:12px;align-items:center;flex-wrap:wrap">' +
      '<p style="margin:0;flex:1 1 280px">Usamos cookies opcionais para estatísticas e anúncios (Google), só com o seu consentimento. A criação do CV não depende deles. <a href="/cookies" style="color:#9cc0ff">Saber mais</a></p>' +
      '<button id="ckNo" type="button" style="min-height:44px;padding:0 18px;border-radius:999px;border:1.5px solid #fff;background:transparent;color:#fff;font-weight:700">Recusar</button>' +
      '<button id="ckYes" type="button" style="min-height:44px;padding:0 18px;border-radius:999px;border:0;background:#2f74ff;color:#fff;font-weight:800">Aceitar</button></div>';
    document.body.appendChild(d);
    document.getElementById("ckNo").onclick = function () { choose("denied"); };
    document.getElementById("ckYes").onclick = function () { choose("granted"); };
  }
  function init() {
    var m = document.getElementById("cookieManage");
    if (m && needs) { m.hidden = false; m.addEventListener("click", function (e) { e.preventDefault(); banner(); }); }
    if (!needs) return;
    var c = get();
    var showBanner = !!CFG.GA_ID || (!!CFG.ADSENSE_CLIENT && adsPage());
    if (c === "granted") activate(); else if (c !== "denied" && showBanner) banner();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
