const CACHE="cv-builder-v30";
const PRE=["./","index.html","manifest.json","icon-192.png","icon-512.png","icon-80.png","img/banner-cv-builder.webp","img/fundador.webp","apple-touch-icon.png","favicon-32.png","site.css","site.js","pwa.js","extras.css","extras.js","vagas.js","dicas-de-carreira","sobre","vagas","contactos","privacidade","termos","cookies","carta-de-apresentacao","erros-no-curriculo","preparar-entrevista"];
self.addEventListener("install",e=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PRE.map(u=>c.add(u).catch(()=>{}))))); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{
  const r=e.request; if(r.method!=="GET"||new URL(r.url).origin!==location.origin) return;
  if(/^\/(admin|api)(\/|$)/.test(new URL(r.url).pathname)) return;
  const put=res=>{ if(res&&res.ok){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)); } return res; };
  if(r.url.indexOf("vagas-data.json")>-1){ e.respondWith(fetch(r).then(put).catch(()=>caches.match(r))); return; }
  if(r.mode==="navigate"){
    e.respondWith(fetch(r).then(put).catch(()=>caches.match(r).then(m=>m||caches.match("./")||caches.match("index.html"))));
  } else {
    e.respondWith(caches.match(r).then(m=>{ const net=fetch(r).then(put).catch(()=>m); return m||net; }));
  }
});
