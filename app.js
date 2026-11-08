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
 let authMode='login', currentUser=null, progressData={};
 const params=new URLSearchParams(location.search);
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
  document.getElementById('auth-tabs').hidden=mode==='forgot'||mode==='reset';
  document.querySelectorAll('[data-auth-mode]').forEach(b=>b.classList.toggle('active',b.dataset.authMode===mode));
  const configs={
   login:['WELCOME BACK','Sign in to ReadyToFly','Access your personal learning space.'],
   register:['JOIN READYTOFLY','Create your account','Your own secure learning profile.'],
   forgot:['ACCOUNT RECOVERY','Reset your password','We will email you a secure reset link.'],
   reset:['SECURE PASSWORD RESET','Choose a new password','Use at least 12 characters, including uppercase, lowercase and a number.']
  };
  const [eyebrow,title,subtitle]=configs[mode];document.getElementById('auth-eyebrow').textContent=eyebrow;document.getElementById('auth-title').textContent=title;document.getElementById('auth-subtitle').textContent=subtitle;
  const email='<label for="auth-email">Email address</label><input id="auth-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required maxlength="254">';
  const password='<label for="auth-password">Password</label><input id="auth-password" name="password" type="password" autocomplete="'+(mode==='login'?'current-password':'new-password')+'" placeholder="'+(mode==='login'?'Enter your password':'At least 12 characters')+'" required minlength="12" maxlength="128">';
  const display='<label for="auth-name">Your name</label><input id="auth-name" name="displayName" autocomplete="name" placeholder="Full name" required maxlength="80">';
  if(mode==='login')form.innerHTML=email+password+'<button class="text-link" type="button" data-auth-mode="forgot">Forgot password?</button><button class="primary-button login-submit" type="submit">Sign in <span>→</span></button>';
  if(mode==='register')form.innerHTML=display+email+password+'<button class="primary-button login-submit" type="submit">Create account <span>→</span></button>';
  if(mode==='forgot')form.innerHTML=email+'<button class="primary-button login-submit" type="submit">Send reset link <span>→</span></button><button class="text-link" type="button" data-auth-mode="login">Back to sign in</button>';
  if(mode==='reset')form.innerHTML=password+'<button class="primary-button login-submit" type="submit">Update password <span>→</span></button>';
  setMessage(mode==='login'?'Sign in to continue to your private study space.':'');
 }
 function showView(name){
  const current=renderers[name]?name:'dashboard';
  document.querySelectorAll('.nav-item[data-view]').forEach(el=>{const active=el.dataset.view===current;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  document.getElementById('app').innerHTML=renderers[current]();
  window.scrollTo({top:0,behavior:'smooth'});
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
  document.getElementById('footer-status').textContent='Signed in · '+user.email;
  await loadProgress();showView('dashboard');
 }
 function showLogin(){application.hidden=true;loginScreen.hidden=false;setMode('login');}
 form.addEventListener('click',e=>{const b=e.target.closest('[data-auth-mode]');if(b){setMode(b.dataset.authMode);}});
 document.getElementById('auth-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-auth-mode]');if(b)setMode(b.dataset.authMode);});
 form.addEventListener('submit',async e=>{
  e.preventDefault();const fd=new FormData(form),payload=Object.fromEntries(fd.entries());
  const submit=form.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent='Please wait…';
  try{
   if(authMode==='login'){const result=await api('auth/login',{method:'POST',body:JSON.stringify(payload)});await enterApp(result.user);}
   else if(authMode==='register'){const result=await api('auth/register',{method:'POST',body:JSON.stringify(payload)});setMode('login');setMessage(result.message||'Check your email to verify your account.');}
   else if(authMode==='forgot'){const result=await api('auth/forgot-password',{method:'POST',body:JSON.stringify(payload)});setMessage(result.message);}
   else if(authMode==='reset'){payload.token=params.get('token')||'';const result=await api('auth/reset-password',{method:'POST',body:JSON.stringify(payload)});history.replaceState({},'',location.pathname);setMode('login');setMessage(result.message);}
  }catch(err){setMessage(err.message,true);}
  finally{const next=form.querySelector('button[type="submit"]');if(next){next.disabled=false;}}
 });
 document.addEventListener('click',event=>{const control=event.target.closest('[data-view]');if(control)showView(control.dataset.view);});
 document.getElementById('signout').addEventListener('click',async()=>{try{await api('auth/logout',{method:'POST',body:'{}'});}catch(e){console.warn(e);}progressData={};localStorage.removeItem('readytofly-progress-cache');currentUser=null;showLogin();});
 const themeButton=document.getElementById('theme-toggle');
 if(localStorage.getItem('readytofly-theme')==='light')document.body.classList.add('light');
 themeButton.addEventListener('click',()=>{document.body.classList.toggle('light');localStorage.setItem('readytofly-theme',document.body.classList.contains('light')?'light':'dark');});
 function updateConnection(){const value=navigator.onLine?'Online':'Offline';document.getElementById('connection-status').textContent=value;}
 updateConnection();window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);
 if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('SW:',e)));
 (async()=>{
  if(params.get('auth')==='verify'&&params.get('token')){try{const r=await api('auth/verify',{method:'POST',body:JSON.stringify({token:params.get('token')})});history.replaceState({},'',location.pathname);setMode('login');setMessage(r.message);}catch(e){setMode('login');setMessage(e.message,true);}return;}
  if(params.get('auth')==='reset'&&params.get('token')){setMode('reset');setMessage('Choose a new password for your account.');return;}
  setMode('login');
  try{const result=await api('auth/me');if(result.authenticated)await enterApp(result.user);}catch(e){console.warn('Session check:',e.message);}
 })();
})();