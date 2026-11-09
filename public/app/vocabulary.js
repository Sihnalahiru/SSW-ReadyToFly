const DATA_URL = '../assets/data/vocabulary_master.json';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));
let records = [];
let loadError = '';
let query = '';
let activeIndex = 0;
let showAnswer = false;
let knownIds = new Set();

function filteredRecords() {
 const term = query.trim().toLocaleLowerCase();
 if (!term) return records;
 return records.filter(item => [
  item.id,item.japanese,item.furigana,item.romaji,item.english,item.sinhala
 ].some(value => String(value || '').toLocaleLowerCase().includes(term)));
}
function renderVocabularyView(root) {
 const list = filteredRecords();
 if (activeIndex >= list.length) activeIndex = 0;
 const current = list[activeIndex];
 root.innerHTML = `
  <section class="welcome"><p class="eyebrow">JAPANESE TECHNICAL LANGUAGE</p><h1>Vocabulary Center</h1><p class="muted">Explore the existing Ground Handling vocabulary master with Japanese readings and English/Sinhala meanings.</p></section>
  <section class="panel vocab-summary"><div><strong>${records.length}</strong><span>Source records</span></div><div><strong>${list.length}</strong><span>Matching terms</span></div><div><strong>${knownIds.size}</strong><span>Marked learned · this account</span></div></section>
  <section class="panel vocab-search-panel">
   <label for="vocab-search">Search Japanese, reading, Romaji, English or Sinhala</label>
   <input id="vocab-search" type="search" placeholder="e.g. aircraft / 航空機 / ගුවන් යානය" value="${escapeHtml(query)}">
   <p class="study-source-notice">Source note: entries are displayed from the existing workbook extraction. Structural presence does not certify every reading or translation. Known reading anomalies remain unchanged pending source verification.</p>
  </section>
  <section class="vocab-flashcard-wrap">
   ${current ? `
    <article class="panel vocab-flashcard">
     <div class="study-content-meta"><span>${escapeHtml(current.id)}</span><span>Card ${activeIndex+1} / ${list.length}</span></div>
     <p class="vocab-japanese">${escapeHtml(current.japanese)}</p>
     <p class="vocab-reading">${escapeHtml(current.furigana || 'Reading not supplied')}</p>
     <p class="vocab-romaji">${escapeHtml(current.romaji || '')}</p>
     ${showAnswer ? `
      <div class="vocab-answer">
       <div class="study-language-block"><span>ENGLISH</span><p>${escapeHtml(current.english || 'Not supplied')}</p></div>
       <div class="study-language-block study-sinhala"><span>SINHALA</span><p>${escapeHtml(current.sinhala || 'සිංහල අර්ථය ලබා දී නැත')}</p></div>
      </div>
     ` : '<p class="muted vocab-reveal-hint">Think of the meaning, then reveal the answer.</p>'}
     <button type="button" class="primary-button vocab-reveal" data-vocab-reveal>${showAnswer ? 'Hide meaning' : 'Reveal English + Sinhala'}</button>
     <button type="button" class="secondary-button vocab-known" data-vocab-known>${knownIds.has(current.id) ? 'Learned ✓' : 'Mark as learned'}</button>
     <div class="vocab-card-navigation"><button type="button" class="secondary-button" data-vocab-prev ${activeIndex===0?'disabled':''}>← Previous</button><button type="button" class="secondary-button" data-vocab-next ${activeIndex>=list.length-1?'disabled':''}>Next →</button></div>
    </article>
   ` : '<div class="panel empty-state">No matching vocabulary. Try another search.</div>'}
  </section>
  <section class="panel vocab-list-panel"><div class="section-heading"><div><p class="eyebrow">MASTER LIST</p><h2>Vocabulary records</h2></div><span class="section-note">${list.length} entries</span></div><div class="vocab-list">
   ${list.slice(0,100).map((item,index)=>`
    <button type="button" class="vocab-list-row ${current?.id===item.id?'active':''}" data-vocab-open="${escapeHtml(item.id)}">
     <span class="vocab-list-jp">${escapeHtml(item.japanese)}<small>${escapeHtml(item.furigana)}</small></span>
     <span class="vocab-list-meaning">${escapeHtml(item.english)}<small>${escapeHtml(item.sinhala)}</small></span>
     <span class="vocab-list-id">${escapeHtml(item.id)}</span>
    </button>`).join('')}
  </div>${list.length>100?'<p class="muted vocab-list-limit">Showing the first 100 matching terms. Use search to narrow the list.</p>':''}</section>
 `;
 root.querySelector('#vocab-search')?.addEventListener('input',event=>{
  query=event.target.value;activeIndex=0;showAnswer=false;
  const cursor=query.length;renderVocabularyView(root);
  const input=root.querySelector('#vocab-search');input?.focus();input?.setSelectionRange(cursor,cursor);
 });
 root.querySelector('[data-vocab-reveal]')?.addEventListener('click',()=>{showAnswer=!showAnswer;renderVocabularyView(root);});
 root.querySelector('[data-vocab-known]')?.addEventListener('click',()=>{
  if(!current)return;
  if(knownIds.has(current.id))knownIds.delete(current.id);else knownIds.add(current.id);
  window.dispatchEvent(new CustomEvent('readytofly:progress',{detail:{key:'vocabulary-known:'+current.id,value:{known:knownIds.has(current.id),updatedAt:new Date().toISOString()}}}));
  renderVocabularyView(root);
 });
 root.querySelector('[data-vocab-prev]')?.addEventListener('click',()=>{activeIndex=Math.max(0,activeIndex-1);showAnswer=false;renderVocabularyView(root);});
 root.querySelector('[data-vocab-next]')?.addEventListener('click',()=>{activeIndex=Math.min(list.length-1,activeIndex+1);showAnswer=false;renderVocabularyView(root);});
 root.querySelectorAll('[data-vocab-open]').forEach(button=>button.addEventListener('click',()=>{
  const index=list.findIndex(item=>item.id===button.dataset.vocabOpen);
  if(index>=0){activeIndex=index;showAnswer=true;renderVocabularyView(root);}
 }));
}
export function renderVocabulary() {
 queueMicrotask(async()=>{
  const root=document.getElementById('vocabulary-root');if(!root)return;
  if(loadError){root.innerHTML=`<div class="empty-state">${escapeHtml(loadError)}</div>`;return;}
  if(!records.length){
   root.innerHTML='<div class="panel"><p class="muted">Loading vocabulary master…</p></div>';
   try{
    const response=await fetch(DATA_URL,{cache:'no-store'});
    if(!response.ok)throw new Error('Vocabulary master could not be loaded.');
    const data=await response.json();
    if(!Array.isArray(data.records))throw new Error('Vocabulary source format is not supported.');
    records=data.records;
    const saved=window.ReadyToFlyProgress?.get?.()||{};
    knownIds=new Set(Object.entries(saved).filter(([key,value])=>key.startsWith('vocabulary-known:')&&value?.known).map(([key])=>key.slice('vocabulary-known:'.length)));
   }catch(error){loadError=error.message||'Vocabulary could not be loaded. Please try again while online.';root.innerHTML=`<div class="empty-state">${escapeHtml(loadError)}</div>`;return;}
  }
  renderVocabularyView(root);
 });
 return '<section id="vocabulary-root"><div class="panel"><p class="muted">Loading vocabulary master…</p></div></section>';
}
