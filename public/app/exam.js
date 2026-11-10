const DATA_BASE = './assets/data/';
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let examState = null;

export function renderExam() {
 return `
 <section class="welcome"><p class="eyebrow">CBT TRAINING · SOURCE-FAITHFUL PRACTICE</p><h1>Examination Practice</h1>
 <p class="muted">Choose a paper and practise with the question wording and English technical terms preserved as they appear in the existing source material. This is not a separate English-only test.</p></section>
 <section class="panel practice-papers-panel" id="exam-paper-host">
  <div class="section-heading"><div><p class="eyebrow">14 AVAILABLE PAPERS · 654 QUESTION RECORDS</p><h2>Select a practice paper</h2></div><span class="status-pill">SOURCE-BASED PRACTICE</span></div>
  <p class="muted" data-exam-status>Loading paper list…</p>
  <div class="exam-paper-grid" data-paper-grid></div>
 </section>
 <section class="panel exam-pending-panel"><strong>Exam language:</strong> Original source presentation. English technical words remain in English where the source uses them; Japanese wording and symbols are not translated or rewritten. Unverified answer keys are not scored.</section>
 <section class="dashboard-section"><div class="section-heading"><div><p class="eyebrow">EXAM FORMAT</p><h2>Practice, not a claimed official CBT</h2></div></div><p class="muted">Official question count, duration and pass thresholds remain unconfirmed. The practice papers therefore do not impose an invented timer or pass mark.</p></section>`;
}

export async function initExam() {
 const host=document.getElementById('exam-paper-host');
 if(!host || host.dataset.initialized==='1')return;
 host.dataset.initialized='1';
 const status=host.querySelector('[data-exam-status]');
 const grid=host.querySelector('[data-paper-grid]');
 try {
  const [paperResponse,bankResponse]=await Promise.all([
   fetch(DATA_BASE+'exam_papers.json',{cache:'no-cache'}),
   fetch(DATA_BASE+'exam_question_bank.json',{cache:'no-cache'})
  ]);
  if(!paperResponse.ok || !bankResponse.ok)throw new Error('Exam data could not be loaded ('+paperResponse.status+'/'+bankResponse.status+').');
  const papers=await paperResponse.json(),bank=await bankResponse.json();
  const byId=new Map((bank.items||[]).map(item=>[item.id,item]));
  examState={papers,byId,answers:{},index:0,current:null,correct:0,wrong:0,unscored:0,submitted:false};
  status.textContent='Choose one of the existing source-based papers. Question order and source records are preserved.';
  grid.innerHTML=(papers.papers||[]).map((paper,index)=>`
   <button type="button" class="panel exam-paper-card" data-open-paper="${index}">
    <span class="eyebrow">PAPER ${String(index+1).padStart(2,'0')}</span>
    <strong>${esc(paper.title)}</strong>
    <span class="exam-paper-count">${paper.questions.length} questions</span>
    <span class="muted">${esc(paper.classification||'Source-based practice')}</span>
    <span class="exam-paper-action">Open paper →</span>
   </button>`).join('');
  if(!papers.papers?.length)status.textContent='No paper records were found in the manifest.';
 } catch(error) {
  status.textContent='Unable to load exam papers: '+error.message;
  status.classList.add('error');
 }
 host.addEventListener('click',event=>{
  const paperButton=event.target.closest('[data-open-paper]');
  if(paperButton){openPaper(Number(paperButton.dataset.openPaper));return;}
  if(event.target.closest('[data-exam-back]')){showPaperList();return;}
  if(event.target.closest('[data-exam-submit]')){submitAnswer();return;}
  if(event.target.closest('[data-exam-unscored]')){recordUnscored();return;}
  if(event.target.closest('[data-exam-next]')){nextQuestion();return;}
  if(event.target.closest('[data-exam-finish]')){showSummary();return;}
  if(event.target.closest('[data-exam-restart]')){openPaper(examState.current);return;}
 });
}

function showPaperList(){
 const host=document.getElementById('exam-paper-host');if(!host||!examState)return;
 host.innerHTML='<div class="section-heading"><div><p class="eyebrow">14 AVAILABLE PAPERS</p><h2>Select a practice paper</h2></div></div><p class="muted">Select a paper to begin.</p><div class="exam-paper-grid" data-paper-grid></div>';
 const grid=host.querySelector('[data-paper-grid]');
 grid.innerHTML=examState.papers.papers.map((paper,index)=>'<button type="button" class="panel exam-paper-card" data-open-paper="'+index+'"><span class="eyebrow">PAPER '+String(index+1).padStart(2,'0')+'</span><strong>'+esc(paper.title)+'</strong><span class="exam-paper-count">'+paper.questions.length+' questions</span><span class="exam-paper-action">Open paper →</span></button>').join('');
}

function openPaper(index){
 const paper=examState?.papers.papers[index];if(!paper)return;
 examState.current=index;examState.index=0;examState.answers={};examState.correct=0;examState.wrong=0;examState.unscored=0;examState.submitted=false;
 renderQuestion();
}

function renderQuestion(){
 const host=document.getElementById('exam-paper-host'),state=examState,paper=state.papers.papers[state.current];
 if(!host||!paper)return;
 const id=paper.questions[state.index],item=state.byId.get(id);
 if(!item){host.innerHTML='<p class="error">Question record '+esc(id)+' is missing from the question bank. This record has not been replaced.</p><button class="secondary-button" data-exam-back>Back to papers</button>';return;}
 state.submitted=false;
 const options=Array.isArray(item.options)?item.options:[];
 const keyValid=options.length>0&&options.some(option=>String(option.value)===String(item.correct_answer));
 const isAnswered=Object.prototype.hasOwnProperty.call(state.answers,id);
 host.innerHTML=`
  <div class="section-heading"><div><p class="eyebrow">${esc(paper.paper_id)} · QUESTION ${state.index+1} OF ${paper.questions.length}</p><h2>${esc(paper.title)}</h2></div><button type="button" class="secondary-button" data-exam-back>← All papers</button></div>
  <div class="exam-progress-line"><span style="width:${((state.index+1)/paper.questions.length)*100}%"></span></div>
  <article class="panel exam-question-card">
   <div class="exam-question-meta"><span>${esc(item.id)}</span><span>${esc(item.section||item.type||'Source question')}</span></div>
   <p class="exam-question-text">${esc(item.question||item.question_text||'')}</p>
   ${item.japanese?'<p class="exam-question-japanese" lang="ja">'+esc(item.japanese)+'</p>':''}
   ${item.furigana?'<p class="exam-question-reading">'+esc(item.furigana)+'</p>':''}
   ${options.length?'<div class="exam-answer-options">'+options.map((option,i)=>'<label class="exam-answer-option"><input type="radio" name="exam-answer" value="'+esc(option.value)+'" '+(state.answers[id]===String(option.value)?'checked':'')+' '+(isAnswered?'disabled':'')+'><span class="exam-option-letter">'+String.fromCharCode(65+i)+'</span><span>'+esc(option.label)+'</span></label>').join('')+'</div>':'<p class="muted">This source record has no selectable options. Continue without scoring this item.</p>'}
   <div class="exam-answer-feedback" data-answer-feedback>${isAnswered?(state.answers[id]===null?'Unscored source record.':'Answer recorded.')+(keyValid?'':' · Answer key is not validated; this item will not affect the score.')+(item.explanation?'<p>'+esc(item.explanation)+'</p>':''):''}</div>
   <div class="exam-action-row">
    ${!isAnswered?(options.length?'<button type="button" class="primary-button" data-exam-submit>Submit answer</button>':'<button type="button" class="primary-button" data-exam-unscored>Continue · unscored</button>'):'<button type="button" class="primary-button" data-exam-next>'+(state.index===paper.questions.length-1?'Finish paper':'Next question →')+'</button>'}
   </div>
  </article>
  <p class="muted">No timer is applied because the official duration has not been verified. Source wording and English technical terms are preserved.</p>`;
 if(isAnswered)state.submitted=true;
}

function recordUnscored(){
 const state=examState,paper=state.papers.papers[state.current],id=paper.questions[state.index];
 state.answers[id]=null;state.unscored++;renderQuestion();
 const feedback=document.querySelector('[data-answer-feedback]');if(feedback)feedback.innerHTML='<strong>Not scored.</strong> This source record has no verified selectable options.';
}
function submitAnswer(){
 const state=examState,paper=state.papers.papers[state.current],id=paper.questions[state.index],item=state.byId.get(id);
 const selected=document.querySelector('input[name="exam-answer"]:checked');
 if(!selected){const feedback=document.querySelector('[data-answer-feedback]');if(feedback)feedback.textContent='Please select an answer first.';return;}
 const options=Array.isArray(item.options)?item.options:[];
 const valid=options.some(option=>String(option.value)===String(item.correct_answer));
 state.answers[id]=String(selected.value);state.submitted=true;
 if(!valid)state.unscored++;
 else if(String(selected.value)===String(item.correct_answer))state.correct++;
 else state.wrong++;
 renderQuestion();
 const feedback=document.querySelector('[data-answer-feedback]');
 if(feedback){feedback.innerHTML=(valid?(String(selected.value)===String(item.correct_answer)?'<strong>Correct.</strong>':'<strong>Incorrect.</strong> Correct answer: '+esc(options.find(option=>String(option.value)===String(item.correct_answer))?.label||item.correct_answer)): '<strong>Not scored.</strong> This answer key is pending source verification.')+(item.explanation?'<p>'+esc(item.explanation)+'</p>':'');}
}
function nextQuestion(){
 const paper=examState.papers.papers[examState.current];
 if(examState.index>=paper.questions.length-1){showSummary();return;}
 examState.index++;renderQuestion();
}
function showSummary(){
 const host=document.getElementById('exam-paper-host'),state=examState,paper=state.papers.papers[state.current];
 const answered=Object.keys(state.answers).length,scoreable=state.correct+state.wrong;
 host.innerHTML='<p class="eyebrow">PAPER COMPLETED</p><h2>'+esc(paper.title)+'</h2><div class="official-metrics"><div><strong>'+answered+'</strong><small>Answered</small></div><div><strong>'+state.correct+'</strong><small>Correct</small></div><div><strong>'+state.wrong+'</strong><small>Incorrect</small></div><div><strong>'+state.unscored+'</strong><small>Unscored</small></div></div><p class="muted">Score: '+(scoreable?Math.round(state.correct/scoreable*100)+'% of scored questions':'Not available')+'. Items with unverified answer keys are excluded from scoring.</p><div class="exam-action-row"><button type="button" class="primary-button" data-exam-restart>Retry this paper</button><button type="button" class="secondary-button" data-exam-back>Choose another paper</button></div>';
}
