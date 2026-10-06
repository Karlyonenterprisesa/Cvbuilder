const CACHE="cv-builder-v1";
const PRE=["./","CV_Builder.html","index.html","manifest.json","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PRE.map(u=>c.add(u).catch(()=>{}))))); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{
  const r=e.request; if(r.method!=="GET"||new URL(r.url).origin!==location.origin) return;
  e.respondWith(fetch(r).then(res=>{ if(res&&res.ok){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)); } return res; })
    .catch(()=>caches.match(r).then(m=>m||caches.match("./")||caches.match("CV_Builder.html")||caches.match("index.html"))));
});
