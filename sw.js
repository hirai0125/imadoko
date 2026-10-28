// 更新したら VERSION を変えると、端末のキャッシュが入れ替わります
const VERSION='v53', CACHE='field-map-'+VERSION;
const FILES=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('field-map-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method==='POST'&&u.pathname.endsWith('/share-target')){
    e.respondWith((async()=>{
      try{
        const fd=await e.request.formData(), fs=fd.getAll('files').filter(f=>f&&f.name), c=await caches.open('shared-files');
        for(const k of await c.keys()) await c.delete(k);
        let i=0; for(const f of fs) await c.put(new URL('shared/'+(i++)+'/'+encodeURIComponent(f.name),self.registration.scope).href,new Response(f));
      }catch(_){}
      return Response.redirect(new URL('index.html?shared=1',self.registration.scope).href,303);
    })());
    return;
  }
  if(e.request.method!=='GET'||u.origin!==location.origin) return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).catch(()=>e.request.mode==='navigate'?caches.match('./index.html'):Response.error())));
});
