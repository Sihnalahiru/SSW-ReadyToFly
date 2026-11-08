import { renderDashboard } from './app/dashboard.js';
import { renderStudy } from './app/study.js';
import { renderExam } from './app/exam.js';
import { renderProgress } from './app/progress.js';
import { renderVocabulary } from './app/vocabulary.js';
import { renderQuiz } from './app/quiz.js';

(() => {
 'use strict';
 const loginScreen=document.getElementById('login-screen'),application=document.getElementById('application'),form=document.getElementById('auth-form'),message=document.getElementById('auth-message');
 const renderers={dashboard:renderDashboard,study:renderStudy,vocabulary:renderVocabulary,quiz:renderQuiz,exam:renderExam,progress:renderProgress};
 let authMode='login',currentUser=null,progressData={},viewTransitionTimer=null,pendingRecoveryCode=null,adminResetRequest=null;
 const cookieValue=name=>document.cookie.split('; ').find(v=>v.startsWith(name+'='))?.split('=').slice(1).join('=')||'';
 async function api(path,options={}) {
  const headers={'Content-Type':'application/json',...(options.headers||{})};
  if(options.method&&options.method!=='GET'&&options.method!=='HEAD'){const csrf=cookieValue('rtf_csrf');if(csrf)headers['X-CSRF-Token']=decodeURIComponent(csrf);}
  const response=await fetch('/api/'+path,{...options,headers,credentials:'same-origin',cache:'no-store'});
  const data=await response.json().catch(()=>({error:'SERVER_ERROR'}));
  if(!response.ok)throw new Error(data.message||data.error||'Request failed. Please try again.');
  return data;
 }
 function setMessage(text,isError=false){message.textContent=text;message.classList.toggle('error',isError);}
 function setMode(mode){
  authMode=mode;
  document.getElementById('auth-tabs').hidden=mode==='recover';
  document.querySelectorAll('[data-auth-mode]').forEach(b=>b.classList.toggle('active',b.dataset.authMode===mode));
  const configs={
   login:['WELCOME BACK','Sign in to ReadyToFly','Access your personal learning space.'],
   register:['JOIN READYTOFLY','Create your account','Set up your private learning profile.'],
   recover:['ACCOUNT RECOVERY','Request a password reset','An administrator will review your request. You will create your own new password after approval.']
  };
  const [eyebrow,title,subtitle]=configs[mode];
  document.getElementById('auth-eyebrow').textContent=eyebrow;
  document.getElementById('auth-title').textContent=title;
  document.getElementById('auth-subtitle').textContent=subtitle;
  const username='<label for="auth-username">Username</label><input id="auth-username" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Choose a username" required minlength="3" maxlength="32" pattern="[A-Za-z0-9._-]{3,32}">';
  const password='<label for="auth-password">Password</label><input id="auth-password" name="password" type="password" autocomplete="'+(mode==='login'?'current-password':'new-password')+'" placeholder="'+(mode==='login'?'Enter your password':'12+ characters, uppercase, lowercase and number')+'" required minlength="12" maxlength="128">';
  if(mode==='login')form.innerHTML=username.replace('Choose a username','Your username')+password+'<button class="text-link" type="button" data-auth-mode="recover">Forgot password? Use recovery code</button><button class="primary-button login-submit" type="submit">Sign in <span>→</span></button>';
  if(mode==='register')form.innerHTML=username+password+'<p class="auth-hint">Username: 3–32 letters, numbers, dot, underscore or hyphen. Password: at least 12 characters with uppercase, lowercase and a number.</p><button class="primary-button login-submit" type="submit">Create account <span>→</span></button>';
  if(mode==='recover')form.innerHTML=username.replace('Choose a username','Your username')+'<p class="auth-hint">Your request will be sent to the ReadyToFly administrator. Do not share your password with anyone.</p><button class="primary-button login-submit" type="submit">Request admin approval <span>→</span></button><button class="text-link" type="button" data-auth-mode="login">Back to sign in</button>';
  setMessage(mode==='login'?'Sign in to continue to your private study space.':'');
 }
 function showRecoveryCode(code,purpose){
  pendingRecoveryCode=code;
  authMode='recovery-display';
  document.getElementById('auth-tabs').hidden=true;
  document.getElementById('auth-eyebrow').textContent=purpose==='created'?'ACCOUNT CREATED':'RECOVERY CODE REPLACED';
  document.getElementById('auth-title').textContent='Save your recovery code';
  document.getElementById('auth-subtitle').textContent='This code is shown only once. Store it somewhere private and safe.';
  form.innerHTML='<div class="recovery-code-panel"><p class="recovery-warning">Keep this code private. Anyone with it and your username can reset your password.</p><code id="recovery-code-display" class="recovery-code-display"></code><button class="secondary-button" type="button" data-copy-recovery>Copy recovery code</button><p class="recovery-confirm">After saving it, continue to sign in.</p></div><button class="primary-button login-submit" type="button" data-recovery-done>I have saved my code <span>→</span></button>';
  document.getElementById('recovery-code-display').textContent=code;
  setMessage(purpose==='created'?'Your account is ready. Save this recovery code before continuing.':'Your password has been changed and all existing sessions were signed out. Save your new recovery code.',false);
 }
 function showAdminResetPending(){
  authMode='admin-reset-pending';
  document.getElementById('auth-tabs').hidden=true;
  document.getElementById('auth-eyebrow').textContent='ADMIN REVIEW';
  document.getElementById('auth-title').textContent='Request submitted';
  document.getElementById('auth-subtitle').textContent='Wait for the administrator to review your password reset request.';
  form.innerHTML='<p class="auth-hint">Once approved, you can create a new password here. Approval expires after 20 minutes.</p><button class="primary-button login-submit" type="button" data-reset-check>Check approval status</button><button class="text-link" type="button" data-auth-mode="login">Back to sign in</button>';
  setMessage('Request submitted. Telegram notification sent to the administrator when configured.',false);
 }
 async function checkAdminResetStatus(){
  const reset=adminResetRequest||JSON.parse(sessionStorage.getItem('rtf-admin-reset')||'null');
  if(!reset){setMode('recover');setMessage('No pending reset request found. Please submit a new request.',true);return;}
  try{
   const result=await api('auth/reset-status',{method:'POST',body:JSON.stringify(reset)});
   if(result.status==='approved'){
    authMode='admin-reset-complete';
    document.getElementById('auth-eyebrow').textContent='APPROVED';
    document.getElementById('auth-title').textContent='Create a new password';
    document.getElementById('auth-subtitle').textContent='Choose a password only you know. All old sessions will be signed out.';
    form.innerHTML='<label for="auth-password">New password</label><input id="auth-password" name="newPassword" type="password" autocomplete="new-password" placeholder="12+ characters, uppercase, lowercase and number" required minlength="12" maxlength="128"><button class="primary-button login-submit" type="submit">Set new password <span>→</span></button>';
    setMessage('Approved. This reset link is valid for 20 minutes.',false);
   }else if(result.status==='rejected'||result.status==='expired'||result.status==='completed'){
    sessionStorage.removeItem('rtf-admin-reset');adminResetRequest=null;setMode('recover');setMessage('This reset request is '+result.status+'. Please submit a new request if needed.',true);
   }else setMessage('Still waiting for administrator approval. Please check again later.',false);
  }catch(err){setMessage(err.message,true);}
 }
 
 function renderAdminPanel(){
  return '<section class="welcome"><p class="eyebrow">SYSTEM ADMINISTRATION</p><h1>Admin Panel</h1><p class="muted">Review password reset requests. Approval is valid for 20 minutes.</p></section><section class="panel"><div class="panel-heading"><h2>Password reset requests</h2><button class="secondary-button" type="button" data-admin-refresh>Refresh</button></div><div id="admin-reset-list" class="admin-reset-list"><p class="muted">Loading requests…</p></div></section>';
 }
 async function loadAdminRequests(){
  const host=document.getElementById('admin-reset-list');if(!host)return;
  host.textContent='Loading…';
  try{
   const data=await api('admin/reset-requests');
   host.replaceChildren();
   if(!data.requests?.length){const p=document.createElement('p');p.className='muted';p.textContent='No pending requests.';host.append(p);return;}
   for(const item of data.requests){
    const card=document.createElement('article');card.className='admin-request-card';
    const title=document.createElement('strong');title.textContent=item.username;
    const meta=document.createElement('p');meta.className='muted';meta.textContent='Requested: '+new Date(item.created_at).toLocaleString()+' · Status: '+item.status;
    card.append(title,meta);
    if(item.status==='pending'){
     for(const action of ['approve','reject']){
      const button=document.createElement('button');button.type='button';button.className=action==='approve'?'primary-button':'secondary-button';button.textContent=action==='approve'?'Approve':'Reject';
      button.addEventListener('click',async()=>{button.disabled=true;try{await api('admin/reset-review',{method:'POST',body:JSON.stringify({id:item.id,action})});await loadAdminRequests();}catch(e){button.disabled=false;setMessage(e.message,true);}});
      card.append(button);
     }
    }else if(item.expires_at){const expiry=document.createElement('p');expiry.className='muted';expiry.textContent='Approval expires: '+new Date(item.expires_at).toLocaleString();card.append(expiry);}
    host.append(card);
   }
  }catch(e){host.textContent=e.message;}
 }
 function showView(name){
  const current=(renderers[name]||name==='admin')?name:'dashboard';
  document.querySelectorAll('.nav-item[data-view],.mobile-nav-item[data-view]').forEach(el=>{const active=el.dataset.view===current;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  const appRoot=document.getElementById('app'),loader=document.getElementById('section-loader');
  const render=()=>{appRoot.innerHTML=current==='admin'?renderAdminPanel():renderers[current]();if(current==='admin')loadAdminRequests();window.scrollTo({top:0,behavior:'smooth'});if(loader)loader.hidden=true;};
  if(appRoot.innerHTML.trim()&&loader){loader.hidden=false;if(viewTransitionTimer)clearTimeout(viewTransitionTimer);viewTransitionTimer=setTimeout(render,650);}else render();
 }
 let saveTimer=null,saveInFlight=false;
 function queueStorageKey(){return currentUser?'readytofly-pending:'+currentUser.id:null;}
 function readPendingQueue(){try{return queueStorageKey()?JSON.parse(localStorage.getItem(queueStorageKey())||'{}'):{};}catch{return {};}}
 function writePendingQueue(queue){if(queueStorageKey())localStorage.setItem(queueStorageKey(),JSON.stringify(queue));}
 function setSaveStatus(status){
  const el=document.getElementById('footer-status');
  if(el)el.textContent='Signed in · '+(currentUser?.username||'')+' · '+status;
 }
 async function loadProgress(){
  const cacheKey='readytofly-progress-cache:'+currentUser.id;
  try{
   const result=await api('progress');
   progressData=Object.fromEntries((result.items||[]).map(x=>[x.key,x.data]));
   const pending=readPendingQueue();
   for(const [key,value] of Object.entries(pending))progressData[key]=value;
   localStorage.setItem(cacheKey,JSON.stringify(progressData));
   if(Object.keys(pending).length)await flushProgress();
   else setSaveStatus('All changes saved');
  }catch(e){
   const pending=readPendingQueue();
   try{progressData={...JSON.parse(localStorage.getItem(cacheKey)||'{}'),...pending};}catch{progressData={...pending};}
   setSaveStatus(navigator.onLine?'Sync unavailable':'Offline · changes queued');
   console.warn('Progress sync unavailable:',e.message);
  }
 }
 async function flushProgress(){
  if(!currentUser||!navigator.onLine||saveInFlight)return false;
  const queue=readPendingQueue(),entries=Object.entries(queue);
  if(!entries.length){setSaveStatus('All changes saved');return true;}
  saveInFlight=true;setSaveStatus('Saving…');
  try{
   for(let i=0;i<entries.length;i+=50){
    const batch=entries.slice(i,i+50);
    await api('progress',{method:'PUT',body:JSON.stringify({items:batch.map(([key,data])=>({key,data}))})});
    const latest=readPendingQueue();
    for(const [key,value] of batch)if(JSON.stringify(latest[key])===JSON.stringify(value))delete latest[key];
    writePendingQueue(latest);
   }
   localStorage.setItem('readytofly-progress-cache:'+currentUser.id,JSON.stringify(progressData));
   setSaveStatus(Object.keys(readPendingQueue()).length?'Changes waiting to sync':'All changes saved');
   return true;
  }catch(e){
   setSaveStatus(navigator.onLine?'Sync failed · retrying later':'Offline · changes queued');
   console.warn('Progress save queued:',e.message);return false;
  }finally{saveInFlight=false;}
 }
 function scheduleProgressSave(){
  if(saveTimer)clearTimeout(saveTimer);
  setSaveStatus(navigator.onLine?'Changes pending…':'Offline · changes queued');
  saveTimer=setTimeout(()=>flushProgress(),850);
 }
 async function saveProgress(key,value){
  if(!/^[a-zA-Z0-9:_-]{1,120}$/.test(key))throw new Error('Invalid progress key');
  if(!currentUser)throw new Error('Sign in before saving progress.');
  progressData[key]=value;
  const queue=readPendingQueue();queue[key]=value;writePendingQueue(queue);
  localStorage.setItem('readytofly-progress-cache:'+currentUser.id,JSON.stringify(progressData));
  scheduleProgressSave();
  return true;
 }
 window.ReadyToFlyProgress={get:()=>structuredClone(progressData),save:saveProgress,refresh:loadProgress};
 async function enterApp(user){
  currentUser=user;loginScreen.hidden=true;application.hidden=false;document.getElementById('admin-panel').hidden=!user.isAdmin;
  document.getElementById('footer-status').textContent='Signed in · '+user.username;
  await loadProgress();showView('dashboard');
 }
 function showLogin(){application.hidden=true;loginScreen.hidden=false;setMode('login');}
 form.addEventListener('click',async e=>{
  const modeButton=e.target.closest('[data-auth-mode]');
  if(modeButton){setMode(modeButton.dataset.authMode);return;}
  if(e.target.closest('[data-reset-check]')){await checkAdminResetStatus();return;}
  if(e.target.closest('[data-copy-recovery]')){
   try{await navigator.clipboard.writeText(pendingRecoveryCode);setMessage('Recovery code copied. Store it somewhere private.',false);}
   catch(err){setMessage('Copy is unavailable here. Select the recovery code and copy it manually.',true);}
   return;
  }
  if(e.target.closest('[data-recovery-done]')){
   pendingRecoveryCode=null;setMode('login');setMessage('Recovery code saved. Sign in with your username and password.',false);
  }
 });
 document.getElementById('auth-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-auth-mode]');if(b)setMode(b.dataset.authMode);});
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  const payload=Object.fromEntries(new FormData(form).entries());
  const submit=form.querySelector('button[type="submit"]');
  if(submit){submit.disabled=true;submit.textContent='Please wait…';}
  try{
   if(authMode==='login'){const result=await api('auth/login',{method:'POST',body:JSON.stringify(payload)});await enterApp(result.user);}
   else if(authMode==='register'){const result=await api('auth/register',{method:'POST',body:JSON.stringify(payload)});showRecoveryCode(result.recoveryCode,'created');}
   else if(authMode==='recover'){const result=await api('auth/reset-request',{method:'POST',body:JSON.stringify(payload)});if(result.requestId&&result.requestSecret){adminResetRequest={requestId:result.requestId,requestSecret:result.requestSecret};sessionStorage.setItem('rtf-admin-reset',JSON.stringify(adminResetRequest));showAdminResetPending();}else setMessage(result.message||'If the account exists, an administrator will review the request.',false);}
   else if(authMode==='admin-reset-complete'){const reset=adminResetRequest||JSON.parse(sessionStorage.getItem('rtf-admin-reset')||'null');if(!reset)throw new Error('Reset request not found. Please start again.');const result=await api('auth/complete-admin-reset',{method:'POST',body:JSON.stringify({...reset,newPassword:payload.newPassword})});sessionStorage.removeItem('rtf-admin-reset');adminResetRequest=null;setMode('login');setMessage(result.message,false);}
  }catch(err){setMessage(err.message,true);}
  finally{const next=form.querySelector('button[type="submit"]');if(next){next.disabled=false;next.textContent=authMode==='recovery-display'?'I have saved my code →':(authMode==='register'?'Create account →':authMode==='recover'?'Reset password →':'Sign in →');}}
 });
 document.addEventListener('click',event=>{const control=event.target.closest('[data-view]');if(control)showView(control.dataset.view);});
 document.getElementById('admin-panel').addEventListener('click',()=>showView('admin'));
 document.addEventListener('click',event=>{if(event.target.closest('[data-admin-refresh]'))loadAdminRequests();});
 document.getElementById('signout').addEventListener('click',async()=>{await flushProgress();try{await api('auth/logout',{method:'POST',body:'{}'});}catch(e){console.warn(e);}progressData={};currentUser=null;document.getElementById('admin-panel').hidden=true;showLogin();});
 const themeButton=document.getElementById('theme-toggle');
 if(localStorage.getItem('readytofly-theme')==='light')document.body.classList.add('light');
 themeButton.addEventListener('click',()=>{document.body.classList.toggle('light');localStorage.setItem('readytofly-theme',document.body.classList.contains('light')?'light':'dark');});
 function updateConnection(){document.getElementById('connection-status').textContent=navigator.onLine?'Online':'Offline';}
 updateConnection();window.addEventListener('online',()=>{updateConnection();flushProgress();});window.addEventListener('offline',()=>{updateConnection();setSaveStatus('Offline · changes queued');});
 window.addEventListener('pagehide',()=>{if(navigator.onLine)flushProgress();});
 if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('SW:',e)));
 (async()=>{
  setMode('login');
  try{const result=await api('auth/me');if(result.authenticated)await enterApp(result.user);}catch(e){console.warn('Session check:',e.message);}
 })();
})();
