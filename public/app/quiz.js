const DATA_URL='../assets/data/vocabulary_master.json';
const CONFIG_URL='../assets/data/quiz_config.json';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let records=[],config=null,loadError='',session=[],position=0,selected=null,score=0,wrong=[],activeSet=1;
const shuffle=items=>{const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;};
function buildSession(setNumber=activeSet){
 const sizes=config?.sets?.question_counts||[50,50,50,50,50,50,50,50,50,50,50,50,23];
 const setCount=sizes.length||13;
 activeSet=Math.min(Math.max(1,Number(setNumber)||1),setCount);
 // Fixed source-order slices make the 13 configured sets a complete, non-overlapping
 // partition of the workbook records. Shuffle only within the selected set.
 const eligible=records.filter(item=>item.japanese&&item.english&&String(item.english).trim());
 const start=sizes.slice(0,activeSet-1).reduce((sum,count)=>sum+Number(count||0),0);
 const size=Number(sizes[activeSet-1]||0);
 const source=shuffle(eligible.slice(start,start+size));
 const uniqueMeanings=[...new Map(eligible.filter(item=>String(item.english).trim()).map(item=>[String(item.english).trim().toLocaleLowerCase(),item])).values()];
 session=source.map(item=>{
  const answer=String(item.english).trim();
  const alternatives=shuffle(uniqueMeanings.filter(other=>
   other.id!==item.id&&String(other.english).trim().toLocaleLowerCase()!==answer.toLocaleLowerCase()
  )).slice(0,3);
  const choices=shuffle([item,...alternatives]).map(option=>({id:option.id,text:String(option.english).trim()}));
  return {...item,choices};
 });
 position=0;selected=null;score=0;wrong=[];
}
function renderQuizView(root){
 const item=session[position];
 if(!item){
  root.innerHTML=`
   <section class="welcome"><p class="eyebrow">VOCABULARY RECOGNITION PRACTICE</p><h1>Quiz complete</h1><p class="muted">This practice set is generated from the existing vocabulary workbook, not an official CBT paper. Sets use fixed, non-overlapping source-record ranges; question order is shuffled within each set.</p></section>
   <section class="panel quiz-result"><strong class="quiz-result-score">${score} / ${session.length}</strong><p>Correct answers</p><p class="muted">${wrong.length} questions added to your wrong-answer review.</p><button class="primary-button" type="button" data-quiz-restart>Practise another set</button></section>`;
  root.querySelector('[data-quiz-restart]')?.addEventListener('click',()=>{activeSet=activeSet>=(config?.sets?.set_count||13)?1:activeSet+1;buildSession(activeSet);renderQuizView(root);});return;
 }
 const answered=selected!==null,correct=answered&&selected===item.id;
 root.innerHTML=`
  <section class="welcome"><p class="eyebrow">KNOWLEDGE CHECK · VOCABULARY</p><h1>Quiz Center</h1><p class="muted">Choose the correct English meaning for each Japanese ground-handling term.</p></section>
  <section class="panel quiz-toolbar"><div><strong>Practice Set ${activeSet} of ${config?.sets?.set_count||13}</strong><span>Workbook-based practice · ${session.length} terms · Not official CBT</span></div><div class="quiz-score-strip"><span>Correct <b>${score}</b></span><span>Wrong <b>${wrong.length}</b></span><span>Remaining <b>${session.length-position}</b></span></div><div class="quiz-progress-track"><span style="width:${((position+(answered?1:0))/session.length)*100}%"></span></div><small>Question ${position+1} of ${session.length}</small></section>
  <section class="panel quiz-question-card">
   <div class="study-content-meta"><span>${escapeHtml(item.id)}</span><span>日本語 → English</span></div>
   <h2>${escapeHtml(item.japanese)}</h2>
   <p class="quiz-reading">${escapeHtml(item.furigana||'')}</p><p class="quiz-romaji">${escapeHtml(item.romaji||'')}</p>
   <p class="quiz-instruction">Select the correct English meaning.</p>
   <div class="quiz-options">${item.choices.map((choice,index)=>`
    <button type="button" class="quiz-option ${answered&&choice.id===item.id?'correct':''} ${answered&&selected===choice.id&&choice.id!==item.id?'incorrect':''}" data-quiz-choice="${escapeHtml(choice.id)}" ${answered?'disabled':''}>
     <span>${String.fromCharCode(65+index)}</span><strong>${escapeHtml(choice.text)}</strong>
    </button>`).join('')}</div>
   ${answered?`
    <div class="quiz-feedback ${correct?'is-correct':'is-wrong'}"><strong>${correct?'Correct!':'Not quite.'}</strong><p>${escapeHtml(item.english)}</p><p>${escapeHtml(item.sinhala||'')}</p></div>
    <button type="button" class="primary-button quiz-next" data-quiz-next>${position===session.length-1?'See results':'Next question →'}</button>
   `:''}
  </section>
  <p class="quiz-source-note">Question and answer text are drawn from the current vocabulary master. Distractors are other English meanings from that same master. Each configured set uses its own fixed source-record range. This is learning practice, not an official examination.</p>
 `;
 root.querySelectorAll('[data-quiz-choice]').forEach(button=>button.addEventListener('click',()=>{
  if(selected!==null)return;
  selected=button.dataset.quizChoice;
  if(selected===item.id)score++;else wrong.push({question_id:item.id,japanese:item.japanese,selected_id:selected,correct_english:item.english,created_at:new Date().toISOString()});
  window.dispatchEvent(new CustomEvent('readytofly:progress',{detail:{key:'quiz-attempt:'+item.id+':'+Date.now(),value:{question_id:item.id,correct:selected===item.id,selected_id:selected,created_at:new Date().toISOString()}}}));
  if(selected!==item.id)window.dispatchEvent(new CustomEvent('readytofly:progress',{detail:{key:'wrong-answer:'+item.id,value:{question_id:item.id,japanese:item.japanese,correct_english:item.english,wrong:true,updatedAt:new Date().toISOString()}}}));
  renderQuizView(root);
 }));
 root.querySelector('[data-quiz-next]')?.addEventListener('click',()=>{position++;selected=null;renderQuizView(root);});
}
export function renderQuiz(){
 queueMicrotask(async()=>{
  const root=document.getElementById('quiz-root');if(!root)return;
  if(loadError){root.innerHTML=`<div class="empty-state">${escapeHtml(loadError)}</div>`;return;}
  if(!records.length){
   root.innerHTML='<div class="panel"><p class="muted">Loading vocabulary practice bank…</p></div>';
   try{
    const [dataResponse,configResponse]=await Promise.all([fetch(DATA_URL,{cache:'no-store'}),fetch(CONFIG_URL,{cache:'no-store'})]);
    if(!dataResponse.ok||!configResponse.ok)throw new Error('Quiz resources could not be loaded.');
    const [data,settings]=await Promise.all([dataResponse.json(),configResponse.json()]);
    if(!Array.isArray(data.records))throw new Error('Vocabulary practice data is not supported.');
    records=data.records;config=settings;buildSession();
   }catch(error){loadError=error.message||'Quiz resources could not be loaded.';root.innerHTML=`<div class="empty-state">${escapeHtml(loadError)}</div>`;return;}
  }
  renderQuizView(root);
 });
 return '<section id="quiz-root"><div class="panel"><p class="muted">Loading vocabulary practice bank…</p></div></section>';
}
