const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function getProgress(){try{return window.ReadyToFlyProgress?.get?.()||{};}catch{return {};}}
export function renderProgress(){
 const data=getProgress(),entries=Object.entries(data);
 const reviewed=entries.filter(([key,value])=>key.startsWith('study-page:')&&value?.reviewed);
 const learned=entries.filter(([key,value])=>key.startsWith('vocabulary-known:')&&value?.known);
 const attempts=entries.filter(([key])=>key.startsWith('quiz-attempt:'));
 const correct=attempts.filter(([,value])=>value?.correct).length;
 const wrong=attempts.length-correct;
 const wrongAnswers=entries.filter(([key,value])=>key.startsWith('wrong-answer:')&&value?.wrong);
 const total=reviewed.length+learned.length+attempts.length;
 return `
  <section class="welcome"><p class="eyebrow">YOUR LEARNING JOURNEY</p><h1>My progress</h1><p class="muted">A live summary of the study, vocabulary and quiz activity saved to this account.</p></section>
  <section class="progress-stat-grid">
   <article class="panel progress-stat"><span>Study pages reviewed</span><strong>${reviewed.length}</strong><small>Page review markers</small></article>
   <article class="panel progress-stat"><span>Vocabulary learned</span><strong>${learned.length}</strong><small>Terms marked learned</small></article>
   <article class="panel progress-stat"><span>Quiz attempts</span><strong>${attempts.length}</strong><small>${correct} correct · ${wrong} incorrect</small></article>
   <article class="panel progress-stat"><span>Wrong answers</span><strong>${wrongAnswers.length}</strong><small>Saved for review</small></article>
  </section>
  <section class="panel progress-detail-panel">
   <div class="section-heading"><div><p class="eyebrow">ACTIVITY SUMMARY</p><h2>Learning activity</h2></div><span class="section-note">${total} recorded actions</span></div>
   <div class="progress-bars">
    <div><span>Study pages</span><b>${reviewed.length}</b><i><em style="width:${Math.min(100,reviewed.length/Math.max(1,reviewed.length)*100)}%"></em></i></div>
    <div><span>Vocabulary</span><b>${learned.length}</b><i><em style="width:${Math.min(100,learned.length/Math.max(1,learned.length)*100)}%"></em></i></div>
    <div><span>Quiz accuracy</span><b>${attempts.length?Math.round(correct/attempts.length*100):0}%</b><i><em style="width:${attempts.length?correct/attempts.length*100:0}%"></em></i></div>
   </div>
   <p class="progress-data-note">Only activity recorded by the current app modules is counted. No estimated XP, streaks, study time or achievements are generated. Data is account-scoped through the existing progress service.</p>
  </section>
  <section class="panel progress-detail-panel">
   <div class="section-heading"><div><p class="eyebrow">REVIEW NEXT</p><h2>Wrong-answer list</h2></div><span class="section-note">${wrongAnswers.length} items</span></div>
   ${wrongAnswers.length?wrongAnswers.slice(-30).reverse().map(([key,value])=>`<div class="progress-wrong-row"><strong>${escapeHtml(value.japanese||value.question_id||key)}</strong><span>${escapeHtml(value.correct_english||'Correct answer recorded in quiz source')}</span></div>`).join(''):'<p class="muted">No wrong answers have been recorded yet. Complete a quiz to build your review list.</p>'}
  </section>
 `;
}
