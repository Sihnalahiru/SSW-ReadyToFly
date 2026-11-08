export function renderExam() {
 return `
 <section class="welcome"><p class="eyebrow">EXAM TRAINING · CBT COMMAND</p><h1>CBT Examination</h1><p class="muted">Choose the language and exam environment. Japanese official-style practice and English international practice are kept completely separate.</p></section>
 <section class="exam-mode-grid">
  <article class="exam-mode-card exam-mode-jp">
   <div class="exam-mode-top"><span class="exam-mode-icon">あ</span><span class="status-pill">OFFICIAL-STYLE</span></div>
   <p class="eyebrow">SSW AIRPORT GROUND HANDLING</p><h2>日本語試験モード</h2><h3>Japanese-only CBT</h3>
   <p>Questions, answer choices, correct answers and review are displayed in Japanese only. Furigana is shown when verified source data provides it. No English, Sinhala or Romaji translations.</p>
   <div class="exam-mode-tags"><span>学科試験</span><span>実技試験</span><span>日本語のみ</span></div>
   <button class="primary-button" type="button" data-exam-mode="japanese">Select Japanese mode <span>→</span></button>
  </article>
  <article class="exam-mode-card exam-mode-en">
   <div class="exam-mode-top"><span class="exam-mode-icon">EN</span><span class="status-pill">INTERNATIONAL PRACTICE</span></div>
   <p class="eyebrow">ENGLISH PRACTICE ENVIRONMENT</p><h2>English Practice Mode</h2><h3>English-only questions & answers</h3>
   <p>Questions, answer choices, correct answers and explanations are displayed in English only. Japanese, Romaji and Sinhala are not mixed into this mode.</p>
   <div class="exam-mode-tags"><span>Written practice</span><span>Practical scenarios</span><span>English only</span></div>
   <button class="secondary-button" type="button" data-exam-mode="english">Select English mode <span>→</span></button>
  </article>
 </section>
 <section class="dashboard-section">
  <div class="section-heading"><div><p class="eyebrow">OFFICIAL NO. 1 EXAM FORMAT</p><h2>Real examination structure</h2></div><span class="status-pill">65% EACH SECTION</span></div>
  <div class="official-exam-grid">
   <article class="panel official-section"><div class="official-section-title"><span>01</span><div><h3>Written examination</h3><small>学科試験 · Japanese only</small></div></div><div class="official-metrics"><div><strong>30</strong><small>Questions</small></div><div><strong>45</strong><small>Minutes</small></div><div><strong>20/30</strong><small>Pass mark</small></div></div><div class="pass-track"><span style="width:66.6667%"></span></div><p>At least 20 correct answers out of 30 (65% threshold).</p></article>
   <article class="panel official-section"><div class="official-section-title"><span>02</span><div><h3>Practical examination</h3><small>実技試験 · Japanese only</small></div></div><div class="official-metrics"><div><strong>15</strong><small>Questions</small></div><div><strong>30</strong><small>Minutes</small></div><div><strong>10/15</strong><small>Pass mark</small></div></div><div class="pass-track"><span style="width:66.6667%"></span></div><p>At least 10 correct answers out of 15 (65% threshold).</p></article>
  </div>
  <p class="exam-important-note"><strong>Important:</strong> Written and practical results are assessed separately. Passing one section does not compensate for failing the other. This app provides a practice simulation, not the official examination.</p>
 </section>
 <section class="dashboard-section panel practice-papers-panel">
  <div class="section-heading"><div><p class="eyebrow">EXISTING REPOSITORY QUESTION SETS</p><h2>14 practice papers</h2></div><span class="status-pill">UNOFFICIAL PRACTICE</span></div>
  <p class="muted">The repository manifest contains 14 existing unofficial practice papers and 654 question references. These are separate from the official-format 30-question written and 15-question practical simulation. Each paper's question language and answer data must pass validation before it is opened.</p>
  <div class="paper-count-row"><strong>14</strong><span>Practice papers available in the source manifest</span><strong>654</strong><span>Question references recorded</span></div>
 </section>
 <section class="panel exam-pending-panel"><strong>Question engine integration is next.</strong><br>The existing paper and question records are being kept intact. Japanese-only and English-only display rules will be enforced when validated questions and answer keys are connected.</section>
 `;
}
