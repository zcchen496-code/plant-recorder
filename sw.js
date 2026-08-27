self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// 临时关闭请求拦截，避免 iPhone Safari 因旧 Service Worker 缓存导致页面打不开。
