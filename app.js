import { renderDashboard } from './app/dashboard.js';
import { renderStudy } from './app/study.js';
import { renderExam } from './app/exam.js';
import { renderProgress } from './app/progress.js';

(() => {
  'use strict';
  const loginScreen = document.getElementById('login-screen');
  const application = document.getElementById('application');
  const app = document.getElementById('app');
  const status = document.getElementById('connection-status');
  const renderers = { dashboard: renderDashboard, study: renderStudy, exam: renderExam, progress: renderProgress };
  function showView(name) {
    const current = renderers[name] ? name : 'dashboard';
    document.querySelectorAll('.nav-item[data-view]').forEach(el => {
      const active = el.dataset.view === current;
      el.classList.toggle('active', active);
      if (active) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
    app.innerHTML = renderers[current]();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function enterPreview() {
    loginScreen.hidden = true;
    application.hidden = false;
    showView('dashboard');
  }
  document.getElementById('guest-preview').addEventListener('click', enterPreview);
  document.getElementById('signout-preview').addEventListener('click', () => {
    application.hidden = true;
    loginScreen.hidden = false;
    document.getElementById('login-message').textContent = 'You are viewing the app preview. Account sign-in will be enabled after authentication is configured.';
  });
  document.getElementById('login-form').addEventListener('submit', event => {
    event.preventDefault();
    document.getElementById('login-message').textContent = 'Account sign-in is not connected yet. Your password has not been sent or stored. Use app preview while we configure secure authentication.';
  });
  document.addEventListener('click', event => {
    const control = event.target.closest('[data-view]');
    if (control) showView(control.dataset.view);
  });
  const themeButton = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('readytofly-theme');
  if (savedTheme === 'dark') document.body.classList.add('dark');
  themeButton.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('readytofly-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
  function updateConnection() {
    const value = navigator.onLine ? 'Online' : 'Offline';
    if (status) status.textContent = value;
    const footer = document.getElementById('footer-status');
    if (footer) footer.textContent = value + ' · Preview mode';
  }
  updateConnection();
  window.addEventListener('online', updateConnection);
  window.addEventListener('offline', updateConnection);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker registration failed:', error)));
  }
})();