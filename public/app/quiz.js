const DATA_URL='../assets/data/vocabulary_master.json';
const CONFIG_URL='../assets/data/quiz_config.json';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let records=[],config=null,loadError='',session=[],position=0,selected=null,score=0,wrong=[],activeSet=1,reviewMode=false,hasStarted=false;
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
function buildReviewSession(){
 reviewMode=true;
 const saved=window.ReadyToFlyProgress?.get?.()||{};
 const missedIds=[...new Set(Object.entries(saved)
  .filter(([key,value])=>key.startsWith('wrong-answer:')&&value?.wrong)
  .map(([key,value])=>value.question_id||key.slice('wrong-answer:'.length)))];
 const byId=new Map(records.map(item=>[item.id,item]));
 const missed=missedIds.map(id=>byId.get(id)).filter(item=>item?.japanese&&item?.english);
 const uniqueMeanings=[...new Map(records.filter(item=>item.english).map(item=>[String(item.english).trim().toLocaleLowerCase(),item])).values()];
 session=shuffle(missed).map(item=>{
  const answer=String(item.english).trim();
  const alternatives=shuffle(uniqueMeanings.filter(other=>other.id!==item.id&&String(other.english).trim().toLocaleLowerCase()!==answer.toLocaleLowerCase())).slice(0,3);
  return {...item,choices:shuffle([item,...alternatives]).map(option=>({id:option.id,text:String(option.english).trim()}))};
 });
 position=0;selected=null;score=0;wrong=[];
}
function renderSetPicker(root){
 const sizes=config?.sets?.question_counts||[];
 const saved=window.ReadyToFlyProgress?.get?.()||{};
 const cards=sizes.map((count,index)=>{
  const setNumber=index+1;
  const start=sizes.slice(0,index).reduce((sum,value)=>sum+Number(value||0),0);
  const ids=new Set(records.filter(item=>item.japanese&&item.english).slice(start,start+Number(count||0)).map(item=>item.id));
  const completed=Object.entries(saved).filter(([key,value])=>key.startsWith('quiz-attempt:')&&ids.has(value?.question_id)).length;
  return `<button type="button" class="quiz-set-card" data-quiz-set="${setNumber}">
   <span class="quiz-set-number">SET ${String(setNumber).padStart(2,'0')}</span>
   <strong>${Number(count||0)} Questions</strong>
   <small>${completed?Math.min(completed,Number(count||0))+' attempts saved':'Ready to practise'}</small>
   <span class="quiz-set-action">Choose set →</span>
  </button>`;
 }).join('');
 root.innerHTML=`
  <section class="welcome"><p class="eyebrow">KNOWLEDGE CHECK · VOCABULARY</p><h1>Quiz Center</h1><p class="muted">Choose a practice set. Each set contains its own questions and can be opened separately.</p></section>
  <section class="panel quiz-set-picker">
   <div class="quiz-set-picker-heading"><div><strong>Vocabulary practice papers</strong><span>${sizes.length} separate sets · ${sizes.reduce((a,b)=>a+Number(b||0),0)} terms</span></div><span class="quiz-set-label">SELECT A SET</span></div>
   <div class="quiz-set-grid">${cards}</div>
   <p class="quiz-source-note">Workbook-based vocabulary practice. These sets are not official CBT examination papers. Question order is shuffled within the selected set.</p>
  </section>`;
 root.querySelectorAll('[data-quiz-set]').forEach(button=>button.addEventListener('click',()=>{
  activeSet=Number(button.dataset.quizSet);reviewMode=false;hasStarted=true;buildSession(activeSet);renderQuizView(root);
 }));
}
function renderQuizView(root){
 if(!reviewMode&&!hasStarted){renderSetPicker(root);return;}
 const item=session[position];
 if(!item){
  const saved=window.ReadyToFlyProgress?.get?.()||{};
  const missedCount=Object.entries(saved).filter(([key,value])=>key.startsWith('wrong-answer:')&&value?.wrong).length;
  root.innerHTML=`
   <section class="welcome"><p class="eyebrow">${reviewMode?'WRONG-ANSWER REVIEW':'VOCABULARY RECOGNITION PRACTICE'}</p><h1>${reviewMode?'Review complete':'Quiz complete'}</h1><p class="muted">${reviewMode?'Retry the terms you previously answered incorrectly. They remain in your review list until you clear them.':'This practice set is generated from the existing vocabulary workbook, not an official CBT paper. Sets use fixed, non-overlapping source-record ranges; question order is shuffled within each set.'}</p></section>
   <section class="panel quiz-result">${session.length?'<strong class="quiz-result-score">'+score+' / '+session.length+'</strong><p>Correct answers</p>':'<p>No saved wrong answers to review.</p>'}<p class="muted">${missedCount} terms remain in your wrong-answer list.</p><button class="primary-button" type="button" data-quiz-return>${reviewMode?'Back to practice':'Practise another set'}</button>${reviewMode&&missedCount?'<button class="secondary-button" type="button" data-quiz-clear>Clear wrong-answer list</button>':''}</section>`;
  root.querySelector('[data-quiz-return]')?.addEventListener('click',()=>{if(reviewMode){reviewMode=false;hasStarted=true;buildSession(activeSet);renderQuizView(root);}else{hasStarted=false;session=[];renderSetPicker(root);}});
  root.querySelector('[data-quiz-clear]')?.addEventListener('click',()=>{Object.entries(saved).filter(([key,value])=>key.startsWith('wrong-answer:')&&value?.wrong).forEach(([key,value])=>window.dispatchEvent(new CustomEvent('readytofly:progress',{detail:{key,value:{...value,wrong:false,clearedAt:new Date().toISOString()}}})));renderQuizView(root);});
  return;
 }
 const answered=selected!==null,correct=answered&&selected===item.id;
 root.innerHTML=`
  <section class="welcome"><p class="eyebrow">KNOWLEDGE CHECK · VOCABULARY</p><h1>Quiz Center</h1><p class="muted">Choose the correct English meaning for each Japanese ground-handling term.</p></section>
  <section class="panel quiz-toolbar"><div><strong>${reviewMode?'Wrong-answer review':`Practice Set ${activeSet} of ${config?.sets?.set_count||13}`}</strong><span>${reviewMode?'Previously missed workbook terms':'Workbook-based practice · '+session.length+' terms · Not official CBT'}</span></div><button type="button" class="secondary-button" data-quiz-review>${reviewMode?'Exit review':'Review missed terms'}</button><div class="quiz-score-strip"><span>Correct <b>${score}</b></span><span>Wrong <b>${wrong.length}</b></span><span>Remaining <b>${session.length-position}</b></span></div><div class="quiz-progress-track"><span style="width:${((position+(answered?1:0))/session.length)*100}%"></span></div><small>Question ${position+1} of ${session.length}</small></section>
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
 root.querySelector('[data-quiz-review]')?.addEventListener('click',()=>{if(reviewMode){reviewMode=false;buildSession(activeSet);}else buildReviewSession();renderQuizView(root);});
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
    records=data.records;config=settings;hasStarted=false;session=[];
   }catch(error){loadError=error.message||'Quiz resources could not be loaded.';root.innerHTML=`<div class="empty-state">${escapeHtml(loadError)}</div>`;return;}
  }
  renderQuizView(root);
 });
 return '<section id="quiz-root"><div class="panel"><p class="muted">Loading vocabulary practice bank…</p></div></section>';
}
