const trackCard = (eyebrow, title, description, status, view = 'study') => `
 <article class="track-card">
  <div class="track-card-top"><span class="track-mark">✈</span><span class="status-pill">${status}</span></div>
  <p class="eyebrow">${eyebrow}</p><h3>${title}</h3><p>${description}</p>
  <button class="text-action" type="button" data-view="${view}">Open track <span aria-hidden="true">→</span></button>
 </article>`;

export function renderDashboard() {
 const progress = window.ReadyToFlyProgress?.get?.() || {};
 const entries = Object.entries(progress);
 const reviewed = entries.filter(([key,value]) => key.startsWith('study-page:') && value?.reviewed).length;
 const learned = entries.filter(([key,value]) => key.startsWith('vocabulary-known:') && value?.known).length;
 const attempts = entries.filter(([key,value]) => key.startsWith('quiz-attempt:') && value && typeof value.correct === 'boolean');
 const correct = attempts.filter(([,value]) => value.correct).length;
 const accuracy = attempts.length ? Math.round(correct / attempts.length * 100) : null;
 const activity = reviewed + learned + attempts.length;
 return `
 <section class="dashboard-hero">
  <div class="hero-copy">
   <p class="eyebrow">AIRPORT OPERATIONS · LEARNING COMMAND</p>
   <h1>Your next skill<br><span>takes you further.</span></h1>
   <p class="muted">A focused training workspace for your SSW Airport Ground Handling journey. Choose a learning track, practise, and build confidence step by step.</p>
   <div class="hero-actions">
    <button class="primary-button" type="button" data-view="study">Enter Study Center <span aria-hidden="true">→</span></button>
    <button class="secondary-button" type="button" data-view="exam">Open CBT Practice</button>
   </div>
  </div>
  <div class="hero-visual" aria-label="Airport ground operations illustration">
   <div class="radar-ring radar-one"></div><div class="radar-ring radar-two"></div>
   <div class="runway-line"></div><div class="plane-symbol">✈</div>
   <div class="hero-coordinate">GROUND OPS<br><strong>READY / 01</strong></div>
   <div class="hero-visual-caption">TRAIN · PRACTISE · PROGRESS</div>
  </div>
 </section>

 <section class="dashboard-section">
  <div class="section-heading"><div><p class="eyebrow">YOUR TRAINING OVERVIEW</p><h2>Learning tracks</h2></div><span class="section-note">Source versions kept separate</span></div>
  <div class="track-grid">
   ${trackCard('GROUND HANDLING · REV 1','Legacy syllabus','Original Ground Handling V1 and Safety & Quality V1 sources.','AUDIT IN PROGRESS')}
   ${trackCard('GROUND HANDLING · REV 2','Revised syllabus','Revised Ground Handling 2.1 and Safety & Quality Rev 2 sources.','AUDIT IN PROGRESS')}
   ${trackCard('AIRCRAFT MAINTENANCE','AM Books 1–3','A separate learning track for the three Aircraft Maintenance source books.','NOT ASSIGNED')}
  </div>
 </section>

 <section class="dashboard-section dashboard-lower">
  <article class="panel exam-overview">
   <div class="section-heading"><div><p class="eyebrow">EXAM PREPARATION</p><h2>CBT practice center</h2></div><span class="status-pill">PRACTICE CONTENT</span></div>
   <div class="exam-stats"><div><strong>14</strong><span>Practice papers</span></div><div><strong>654</strong><span>Question references</span></div><div><strong>50</strong><span>Target per paper</span></div></div>
   <p class="muted">Existing repository manifest lists 14 unofficial practice papers. Official exam duration has not been verified, so no official timer is assumed.</p>
   <button class="text-action" type="button" data-view="exam">Explore CBT practice <span aria-hidden="true">→</span></button>
  </article>
  <article class="panel daily-panel">
   <p class="eyebrow">YOUR LEARNING ACTIVITY</p><h2>${activity ? 'Your progress is taking shape.' : 'Start with one small step.'}</h2>
   <div class="exam-stats"><div><strong>${reviewed}</strong><span>Pages reviewed</span></div><div><strong>${learned}</strong><span>Words learned</span></div><div><strong>${accuracy===null?'—':accuracy+'%'}</strong><span>Quiz accuracy</span></div></div>
   <p class="muted">${attempts.length ? attempts.length+' saved quiz attempts · '+correct+' correct answers.' : 'Quiz accuracy will appear after your first saved quiz attempt.'} These figures use activity saved to this account; no streak or study time is estimated.</p>
   <button class="text-action" type="button" data-view="progress">View full progress <span aria-hidden="true">→</span></button>
  </article>
 </section>

 <section class="dashboard-section quick-section">
  <div class="section-heading"><div><p class="eyebrow">QUICK ACCESS</p><h2>Choose your next step</h2></div></div>
  <div class="quick-grid">
   <button class="quick-card" type="button" data-view="study"><span>▤</span><strong>Study Center</strong><small>Lessons and learning modes</small></button>
   <button class="quick-card" type="button" data-view="vocabulary"><span>あ</span><strong>Vocabulary</strong><small>Technical terms and flashcards</small></button>
   <button class="quick-card" type="button" data-view="quiz"><span>◇</span><strong>Quiz Center</strong><small>Topic practice and review</small></button>
   <button class="quick-card" type="button" data-view="exam"><span>✓</span><strong>CBT Examination</strong><small>Fixed papers and random practice</small></button>
  </div>
 </section>`;
}
