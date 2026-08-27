const CACHE='plant-quadrat-local-v42';
const ASSETS=['./','./index.html','./manifest.webmanifest','./app-v4.js','./export-v4.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;
  e.respondWith(fetch(req,{cache:'no-store'}).then(r=>{
    const c=r.clone();caches.open(CACHE).then(cache=>cache.put(req,c));return r
  }).catch(()=>caches.match(req)));
});