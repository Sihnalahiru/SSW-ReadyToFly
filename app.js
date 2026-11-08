import { renderDashboard } from './app/dashboard.js';
import { renderStudy } from './app/study.js';
import { renderExam } from './app/exam.js';
import { renderProgress } from './app/progress.js';

(() => {
  'use strict';
  const app = document.getElementById('app');
  const status = document.getElementById('connection-status');
  const renderers = {
    dashboard: renderDashboard,
    study: renderStudy,
    exam: renderExam,
    progress: renderProgress
  };
  function showView(name) {
    const render = renderers[name] || renderDashboard;
    document.querySelectorAll('.nav-item[data-view]').forEach(el => {
      const active = el.dataset.view === name;
      el.classList.toggle('active', active);
      if (active) el.setAttribute('aria-current', 'page');
      else el.removeAttribute('aria-current');
    });
    app.innerHTML = render();
  }
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
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker registration failed:', error)));
  }
  if (status) status.textContent = navigator.onLine ? 'Online' : 'Offline';
  window.addEventListener('online', () => { if (status) status.textContent = 'Online'; });
  window.addEventListener('offline', () => { if (status) status.textContent = 'Offline'; });
  showView('dashboard');
})();
