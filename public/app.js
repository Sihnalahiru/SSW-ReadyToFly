import { renderDashboard } from './app/dashboard.js';
import { renderStudy } from './app/study.js';
import { renderExam } from './app/exam.js';
import { renderProgress } from './app/progress.js';
import { ReadyToFlyAuth } from './app/auth.js';

(() => {
  'use strict';
  const loginScreen=document.getElementById('login-screen');
  const application=document.getElementById('application');
  const appRoot=document.getElementById('app');
  const loginMessage=document.getElementById('login-message');
  const status=document.getElementById('connection-status');
  const renderers={dashboard:renderDashboard,study:renderStudy,exam:renderExam,progress:renderProgress};
  let currentUser=null;
  function message(text,kind='info'){loginMessage.textContent=text;loginMessage.dataset.kind=kind;}
  function setAuthView(view){
    document.querySelectorAll('.auth-form').forEach(form=>form.hidden=form.id!==view+'-form');
    document.querySelectorAll('[data-auth-view]').forEach(button=>button.classList.toggle('active',button.dataset.authView===view));
    const titles={login:['Welcome to ReadyToFly','Sign in to continue your journey.'],register:['Create your account','Your learning journey starts here.'],forgot:['Reset your password','We will email you a secure reset link.'],reset:['Choose a new password','Use a strong password you have not used before.']};
    const selected=titles[view]||titles.login;
    document.getElementById('login-title').textContent=selected[0];
    document.getElementById('login-subtitle').textContent=selected[1];
    message('');
  }
  function showView(name){
    const current=renderers[name]?name:'dashboard';
    document.querySelectorAll('.nav-item[data-view]').forEach(el=>{
      const active=el.dataset.view===current;
      el.classList.toggle('active',active);
      if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
    });
    appRoot.innerHTML=renderers[current]();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  async function enterApplication(user){
    currentUser=user||null;
    loginScreen.hidden=true;application.hidden=false;
    const footer=document.getElementById('footer-status');
    footer.textContent=currentUser?('Signed in · '+currentUser.email):'Preview mode · Not signed in';
    showView('dashboard');
    if(currentUser){
      try{const items=await ReadyToFlyAuth.loadProgress();window.dispatchEvent(new CustomEvent('readytofly:progress-loaded',{detail:{items}}));}
      catch(error){console.warn('Progress sync could not load:',error.code||error.message);}
    }
  }
  async function signOut(){
    try{await ReadyToFlyAuth.logout();}catch(error){console.warn('Sign-out request:',error.code||error.message);}
    currentUser=null;application.hidden=true;loginScreen.hidden=false;setAuthView('login');message('You have been signed out.','success');
  }
  document.getElementById('guest-preview').addEventListener('click',()=>enterApplication(null));
  document.getElementById('signout-preview').addEventListener('click',signOut);
  document.addEventListener('click',event=>{
    const view=event.target.closest('[data-view]');if(view)showView(view.dataset.view);
    const authView=event.target.closest('[data-auth-view]');if(authView)setAuthView(authView.dataset.authView);
  });
  document.getElementById('login-form').addEventListener('submit',async event=>{
    event.preventDefault();const form=new FormData(event.currentTarget);
    const button=event.currentTarget.querySelector('button[type=submit]');button.disabled=true;message('Signing in securely…');
    try{const result=await ReadyToFlyAuth.login(form.get('email'),form.get('password'));await enterApplication(result.user); }
    catch(error){const messages={INVALID_CREDENTIALS:'Email or password is incorrect.',EMAIL_NOT_VERIFIED:'Please verify your email using the link we sent you.',DATABASE_NOT_CONFIGURED:'The Cloudflare database is not configured yet.'};message(messages[error.code]||error.message||'Unable to sign in. Please try again.','error');}
    finally{button.disabled=false;}
  });
  document.getElementById('register-form').addEventListener('submit',async event=>{
    event.preventDefault();const form=new FormData(event.currentTarget),button=event.currentTarget.querySelector('button[type=submit]');button.disabled=true;message('Creating your account…');
    try{const result=await ReadyToFlyAuth.register({displayName:form.get('displayName'),email:form.get('email'),password:form.get('password')});setAuthView('login');message(result.message||'Check your email to verify your account.','success');}
    catch(error){message(error.message||'Registration could not be completed.','error');}
    finally{button.disabled=false;}
  });
  document.getElementById('forgot-form').addEventListener('submit',async event=>{
    event.preventDefault();const form=new FormData(event.currentTarget),button=event.currentTarget.querySelector('button[type=submit]');button.disabled=true;message('Requesting a password reset…');
    try{const result=await ReadyToFlyAuth.forgotPassword(form.get('email'));message(result.message,'success');}
    catch(error){message('Could not request a reset link. Please try again.','error');}
    finally{button.disabled=false;}
  });
  document.getElementById('reset-form').addEventListener('submit',async event=>{
    event.preventDefault();const token=new URLSearchParams(location.search).get('token');if(!token){message('This reset link is missing or invalid.','error');return;}
    const form=new FormData(event.currentTarget),button=event.currentTarget.querySelector('button[type=submit]');button.disabled=true;message('Updating your password…');
    try{const result=await ReadyToFlyAuth.resetPassword(token,form.get('password'));history.replaceState({},'',location.pathname);setAuthView('login');message(result.message,'success');}
    catch(error){message(error.message||'This reset link may have expired.','error');}
    finally{button.disabled=false;}
  });
  const themeButton=document.getElementById('theme-toggle');
  if(localStorage.getItem('readytofly-theme')==='light')document.body.classList.add('light');
  themeButton.addEventListener('click',()=>{document.body.classList.toggle('light');localStorage.setItem('readytofly-theme',document.body.classList.contains('light')?'light':'dark');});
  function updateConnection(){if(status)status.textContent=navigator.onLine?'Online':'Offline';}
  updateConnection();window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);
  const params=new URLSearchParams(location.search);
  if(params.get('auth')==='verify'&&params.get('token')){
    ReadyToFlyAuth.verify(params.get('token')).then(result=>{history.replaceState({},'',location.pathname);message(result.message,'success');setAuthView('login');}).catch(()=>{message('This verification link is invalid or expired. Please register again or request help.','error');});
  }else if(params.get('auth')==='reset'&&params.get('token')){setAuthView('reset');}
  else{setAuthView('login');}
  window.ReadyToFlyAuth=ReadyToFlyAuth;
  window.ReadyToFlySession=()=>currentUser;
  if('serviceWorker'in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('Service worker registration failed:',error)));
  ReadyToFlyAuth.me().then(result=>{if(result.authenticated)enterApplication(result.user);}).catch(error=>console.warn('Session restore unavailable:',error.code||error.message));
})();