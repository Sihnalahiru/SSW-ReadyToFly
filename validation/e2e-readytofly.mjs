import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true}),saved=new Map();let authenticated=false;
const liveContext=await browser.newContext();
const imageCheck=await liveContext.request.get('https://ssw-readytofly.madusanka-lahiru.workers.dev/source-assets/assets/data/Rev%201%20Sinhala/Ground%20handling%20-%20Images%20V1/0.jpg');
assert.equal(imageCheck.status(),200,'Live Cloudflare image proxy must return HTTP 200');
assert.ok((imageCheck.headers()['content-type']||'').startsWith('image/'),'Live image proxy must return an image content type');
await liveContext.close();
console.log('PASS live Cloudflare image proxy');
const user={id:'e2e-readytofly-user',username:'e2e-test',isAdmin:false};
try{
 for(const vp of [{width:1440,height:1000,label:'desktop'},{width:390,height:844,label:'mobile'}]){
  const context=await browser.newContext({viewport:vp,serviceWorkers:'block'}),page=await context.newPage();
  await page.route('**/api/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname.replace('/api/','');
   if(path==='auth/me')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated,user:authenticated?user:null})});
   if(path==='auth/login'&&req.method()==='POST'){authenticated=true;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,user})});}
   if(path==='progress'&&req.method()==='GET')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({items:[...saved].map(([key,data])=>({key,data}))})});
   if(path==='progress'&&req.method()==='PUT'){for(const item of req.postDataJSON().items||[])saved.set(item.key,item.data);return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});}
   if(path==='auth/logout'){authenticated=false;return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});}
   return route.fulfill({status:404,contentType:'application/json',body:'{"error":"NOT_FOUND"}'});
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.locator('#auth-username').fill('e2e-test');await page.locator('#auth-password').fill('ReadyToFly-Test-2026');await page.locator('#auth-form button[type=submit]').click();
  await page.locator('#application').waitFor({state:'visible'});
  await page.locator('.nav-item[data-view="exam"]').click();await page.locator('[data-open-paper]').first().waitFor();
  assert.equal(await page.locator('[data-open-paper]').count(),14,'14 papers render');
  if(vp.label==='desktop'){
   for(let paperIndex=0;paperIndex<14;paperIndex++){
    await page.locator('[data-open-paper="'+paperIndex+'"]').click();
    await page.locator('.exam-question-text').first().waitFor();
    await page.locator('[data-exam-back]').click();
   }
   await page.locator('[data-open-paper="13"]').click();
   for(let i=0;i<4;i++){
    const choices=page.locator('input[name=exam-answer]');
    if(await choices.count()){await choices.first().check();await page.locator('[data-exam-submit]').click();}
    else await page.locator('[data-exam-unscored]').click();
    await page.locator('[data-exam-next]').click();
   }
   await page.getByText('PAPER COMPLETED').waitFor();
   await page.waitForFunction(()=>document.getElementById('footer-status')?.textContent?.includes('All changes saved'),null,{timeout:12000});
   assert.equal([...saved.keys()].filter(k=>k.startsWith('exam-result:')).length,1,'Exam result saved through account progress API');
   await page.reload({waitUntil:'networkidle'});await page.locator('#application').waitFor({state:'visible'});
   await page.locator('.nav-item[data-view="progress"]').click();await page.getByText('Completed practice papers').waitFor();
   await page.getByText(/Practice Paper 14|Paper 14|GH-MOCK-14/i).first().waitFor();
  }else{
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,'Mobile viewport has no horizontal overflow');
   assert.equal(await page.locator('.mobile-nav-item').count(),6,'Mobile navigation is visible');
   await page.locator('.mobile-nav-item[data-view="vocabulary"]').click();await page.locator('#vocabulary-root').waitFor({state:'attached'});
  }
  console.log('PASS '+vp.label+' login, navigation, paper rendering and viewport');
  await context.close();
 }
 console.log('PASS exam result autosave/reload history contract (mocked progress API)');
}finally{await browser.close();}
