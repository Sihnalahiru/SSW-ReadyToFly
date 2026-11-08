(() => {
  'use strict';
  const app = document.getElementById('app');
  const status = document.getElementById('connection-status');
  const views = {
    dashboard: { title: 'Welcome aboard.', eyebrow: 'AIRPORT GROUND HANDLING', body: 'Your learning workspace is ready. Verified study content will appear here as the source audit is completed.', note: 'Dashboard data and learning analytics will be connected after the verified content and progress schema are ready.' },
    study: { title: 'Study library', eyebrow: 'LEARN STEP BY STEP', body: 'The study library is being prepared from the project source documents.', note: 'Lessons, vocabulary, technical terms, illustrations and audio are not populated yet. They will be added only after source verification.' },
    exam: { title: 'Practice exam', eyebrow: 'CHECK YOUR KNOWLEDGE', body: 'The practice exam area is ready for the verified question bank.', note: 'Questions, correct answers and explanations are pending source validation. No placeholder questions are presented as official exam content.' },
    progress: { title: 'My progress', eyebrow: 'YOUR LEARNING JOURNEY', body: 'Your progress dashboard will appear here once study sessions are connected.', note: 'Progress tracking is not yet enabled. This first release is the application shell, not the final learning build.' }
  };
  function showView(name) {
    const view = views[name] || views.dashboard;
    document.querySelectorAll('[data-view]').forEach(el => el.classList.toggle('active', el.classList.contains('nav-item') && el.dataset.view === name));
    app.innerHTML = '<section class="welcome"><p class="eyebrow"></p><h1></h1><p class="muted"></p></section><section class="panel"><div class="empty-state"></div></section>';
    app.querySelector('.eyebrow').textContent = view.eyebrow;
    app.querySelector('h1').textContent = view.title;
    app.querySelector('.welcome .muted').textContent = view.body;
    app.querySelector('.empty-state').textContent = view.note;
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
})();
