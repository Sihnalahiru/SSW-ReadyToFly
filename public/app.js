import { renderDashboard } from './app/dashboard.js';
import { renderStudy } from './app/study.js';
import { renderExam } from './app/exam.js';
import { renderProgress } from './app/progress.js';
import { renderVocabulary } from './app/vocabulary.js';
import { renderQuiz } from './app/quiz.js';
import { renderHistory } from './app/history.js';

(() => {
 'use strict';
 const loginScreen=document.getElementById('login-screen'),application=document.getElementById('application'),form=document.getElementById('auth-form'),message=document.getElementById('auth-message');
 const renderers={dashboard:renderDashboard,study:renderStudy,vocabulary:renderVocabulary,quiz:renderQuiz,exam:renderExam,progress:renderProgress,history:renderHistory};
 let authMode='login',currentUser=null,progressData={},viewTransitionTimer=null,pendingRecoveryCode=null;
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
   recover:['ACCOUNT RECOVERY','Recover your account','Use your username and your one-time recovery code.']
  };
  const [eyebrow,title,subtitle]=configs[mode];
  document.getElementById('auth-eyebrow').textContent=eyebrow;
  document.getElementById('auth-title').textContent=title;
  document.getElementById('auth-subtitle').textContent=subtitle;
  const username='<label for="auth-username">Username</label><input id="auth-username" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Choose a username" required minlength="3" maxlength="32" pattern="[A-Za-z0-9._-]{3,32}">';
  const password='<label for="auth-password">Password</label><input id="auth-password" name="password" type="password" autocomplete="'+(mode==='login'?'current-password':'new-password')+'" placeholder="'+(mode==='login'?'Enter your password':'12+ characters, uppercase, lowercase and number')+'" required minlength="12" maxlength="128">';
  if(mode==='login')form.innerHTML=username.replace('Choose a username','Your username')+password+'<button class="text-link" type="button" data-auth-mode="recover">Forgot password? Use recovery code</button><button class="primary-button login-submit" type="submit">Sign in <span>→</span></button>';
  if(mode==='register')form.innerHTML=username+password+'<p class="auth-hint">Username: 3–32 letters, numbers, dot, underscore or hyphen. Password: at least 12 characters with uppercase, lowercase and a number.</p><button class="primary-button login-submit" type="submit">Create account <span>→</span></button>';
  if(mode==='recover')form.innerHTML=username.replace('Choose a username','Your username')+'<label for="auth-recovery-code">Recovery code</label><input id="auth-recovery-code" name="recoveryCode" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="RTF-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" required maxlength="48"><label for="auth-password">New password</label><input id="auth-password" name="newPassword" type="password" autocomplete="new-password" placeholder="12+ characters, uppercase, lowercase and number" required minlength="12" maxlength="128"><button class="primary-button login-submit" type="submit">Reset password <span>→</span></button><button class="text-link" type="button" data-auth-mode="login">Back to sign in</button>';
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
 function showView(name){
  const current=renderers[name]?name:'dashboard';
  document.querySelectorAll('.nav-item[data-view],.mobile-nav-item[data-view]').forEach(el=>{const active=el.dataset.view===current;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  const appRoot=document.getElementById('app'),loader=document.getElementById('section-loader');
  const render=()=>{appRoot.innerHTML=renderers[current]();window.scrollTo({top:0,behavior:'smooth'});if(loader)loader.hidden=true;};
  if(appRoot.innerHTML.trim()&&loader){loader.hidden=false;if(viewTransitionTimer)clearTimeout(viewTransitionTimer);viewTransitionTimer=setTimeout(render,650);}else render();
 }
 async function loadProgress(){
  try{const result=await api('progress');progressData=Object.fromEntries((result.items||[]).map(x=>[x.key,x.data]));localStorage.setItem('readytofly-progress-cache',JSON.stringify({userId:currentUser.id,data:progressData}));}
  catch(e){console.warn('Progress sync unavailable:',e.message);}
 }
 async function saveProgress(key,value){
  if(!/^[a-zA-Z0-9:_-]{1,120}$/.test(key))throw new Error('Invalid progress key');
  progressData[key]=value;
  try{await api('progress',{method:'PUT',body:JSON.stringify({items:[{key,data:value}]})});localStorage.setItem('readytofly-progress-cache',JSON.stringify({userId:currentUser.id,data:progressData}));return true;}
  catch(e){setMessage('Progress sync failed. Your latest change could not be confirmed by the server.',true);throw e;}
 }
 window.ReadyToFlyProgress={get:()=>structuredClone(progressData),save:saveProgress,refresh:loadProgress};
 async function enterApp(user){
  currentUser=user;loginScreen.hidden=true;application.hidden=false;
  document.getElementById('footer-status').textContent='Signed in · '+user.username;
  await loadProgress();showView('dashboard');
 }
 function showLogin(){application.hidden=true;loginScreen.hidden=false;setMode('login');}
 form.addEventListener('click',async e=>{
  const modeButton=e.target.closest('[data-auth-mode]');
  if(modeButton){setMode(modeButton.dataset.authMode);return;}
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
   else if(authMode==='recover'){const result=await api('auth/recover-password',{method:'POST',body:JSON.stringify(payload)});showRecoveryCode(result.recoveryCode,'rotated');}
  }catch(err){setMessage(err.message,true);}
  finally{const next=form.querySelector('button[type="submit"]');if(next){next.disabled=false;next.textContent=authMode==='recovery-display'?'I have saved my code →':(authMode==='register'?'Create account →':authMode==='recover'?'Reset password →':'Sign in →');}}
 });
 document.addEventListener('click',async event=>{const reset=event.target.closest('[data-dashboard-reset]');if(reset){if(!window.confirm('Reset dashboard-only preferences and summaries? Your examination history, completed papers, marks, books and account will remain safe.'))return;try{await saveProgress('dashboard:preferences',{resetAt:Date.now(),version:1});await saveProgress('dashboard:summary',{});showView('dashboard');}catch(err){console.warn('Dashboard reset failed:',err.message);alert('Dashboard reset could not be saved. Please try again.');}return;}const control=event.target.closest('[data-view]');if(control)showView(control.dataset.view);});
 document.getElementById('signout').addEventListener('click',async()=>{try{await api('auth/logout',{method:'POST',body:'{}'});}catch(e){console.warn(e);}progressData={};localStorage.removeItem('readytofly-progress-cache');currentUser=null;showLogin();});
 const themeButton=document.getElementById('theme-toggle');
 if(localStorage.getItem('readytofly-theme')==='light')document.body.classList.add('light');
 themeButton.addEventListener('click',()=>{document.body.classList.toggle('light');localStorage.setItem('readytofly-theme',document.body.classList.contains('light')?'light':'dark');});
 function updateConnection(){document.getElementById('connection-status').textContent=navigator.onLine?'Online':'Offline';}
 updateConnection();window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);
 if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('SW:',e)));
 (async()=>{
  setMode('login');
  try{const result=await api('auth/me');if(result.authenticated)await enterApp(result.user);}catch(e){console.warn('Session check:',e.message);}
 })();
})();
