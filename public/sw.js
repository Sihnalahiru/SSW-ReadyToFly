'use strict';
const CACHE_NAME='readytofly-shell-v15';
const CORE_ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.json','./app/dashboard.js','./app/study.js','./app/exam.js','./app/progress.js','./app/vocabulary.js','./app/quiz.js','./app/auth.js','./assets/data/study_note_visual_map.json','./assets/animations/Airplane%20arrival%20at%20airport.lottie','./assets/animations/Passports%20in%20pink%20and%20blue.lottie','./assets/animations/Trophy.lottie'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('readytofly-shell-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
  if(response.ok&&response.type==='basic'){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy))}
  return response;
 }).catch(()=>{
  // Only navigation requests may fall back to the app shell. Returning HTML
  // for a missing JS/CSS/image file causes MIME errors and hides real failures.
  if(event.request.mode==='navigate')return caches.match('./index.html');
  return new Response('',{status:503,statusText:'Offline'});
 })));
});
