const DATA_URL='./data/vocabulary_master.json';
const PAGE_SIZE=50;
const SECTIONS=[
 {number:1,title:'Aircraft & Flight Basics',start:1,end:50},
 {number:2,title:'Ground Handling & Work Allocation',start:51,end:100},
 {number:3,title:'Ramp Safety & Cargo Handling',start:101,end:167},
 {number:4,title:'Operational Procedures & Airport Services',start:168,end:240},
 {number:5,title:'Passenger, Baggage & Cargo Services',start:241,end:315},
 {number:6,title:'Dangerous Goods – Classes & Regulations',start:316,end:360},
 {number:7,title:'Aircraft Movement & Ramp Safety',start:361,end:405},
 {number:8,title:'Passenger Handling & Work Coordination',start:406,end:460},
 {number:9,title:'Ground Equipment, Weather & Load Control',start:461,end:500},
 {number:10,title:'Weather, PPE & Vehicle Operations',start:501,end:538},
 {number:11,title:'Service Quality, Communication & Safety Culture',start:539,end:600},
 {number:12,title:'Dangerous Goods – Examples & Items',start:601,end:623}
].map(s=>({...s,count:s.end-s.start+1}));
let records=[];
let part=1;
let query='';
let showAll=false;
let flipped=new Set();
let favourites=new Set();
let loadingPromise=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function loadVocabulary(){
 if(!loadingPromise)loadingPromise=fetch(DATA_URL,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('Vocabulary file could not be loaded ('+r.status+')');return r.json()}).then(data=>{
  if(!Array.isArray(data.records)||data.records.length!==623)throw new Error('Vocabulary source validation failed: expected 623 records.');
  records=data.records;
  const saved=window.ReadyToFlyProgress?.get?.()['vocabulary:favourites'];
  favourites=new Set(Array.isArray(saved)?saved:[]);
  return records;
 });
 return loadingPromise;
}
function currentRows(){
 const q=query.trim().toLocaleLowerCase();
 const filtered=q?records.filter(r=>[r.japanese,r.furigana,r.romaji,r.english,r.sinhala].some(v=>String(v||'').toLocaleLowerCase().includes(q))):records.filter(r=>{const s=SECTIONS[part-1];const n=Number(r.id.slice(3));return n>=s.start&&n<=s.end;});
 return filtered;
}
function card(r){
 const back=flipped.has(r.id);
 return '<article class="vocab-card '+(back?'is-flipped':'')+'"><button class="vocab-flip" type="button" data-vocab-flip="'+esc(r.id)+'" aria-label="Flip '+esc(r.english)+'"><span class="vocab-card-top"><span class="vocab-id">'+esc(r.id)+'</span><span class="vocab-actions"><span class="vocab-fav '+(favourites.has(r.id)?'active':'')+'" aria-hidden="true">★</span></span></span>'+(back?'<span class="vocab-english">'+esc(r.english)+'</span><span class="vocab-sinhala">'+esc(r.sinhala)+'</span><span class="vocab-romaji">'+esc(r.romaji)+'</span>':'<span class="vocab-japanese">'+esc(r.japanese)+'</span><span class="vocab-furigana">'+esc(r.furigana)+'</span><span class="vocab-hint">Tap to reveal meaning</span>')+'</button><button class="vocab-favourite" type="button" data-vocab-fav="'+esc(r.id)+'" aria-label="Toggle favourite">'+(favourites.has(r.id)?'★ Saved':'☆ Save')+'</button></article>';
}
function renderContent(){
 const root=document.getElementById('vocabulary-root');if(!root)return;
 const rows=currentRows(),searching=!!query.trim(),totalParts=SECTIONS.length,section=SECTIONS[part-1];
 root.innerHTML='<div class="vocab-master-overview"><div><strong>MASTER VOCABULARY</strong><span>All 623 master words · 12 topic sections · preliminary grouping</span></div><div class="vocab-set-grid">'+SECTIONS.map(s=>'<button type="button" class="vocab-set-chip '+(part===s.number&&!searching?'active':'')+'" data-vocab-set="'+s.number+'"><strong>SET '+String(s.number).padStart(2,'0')+'</strong><span>'+s.count+' words</span><small>#'+String(s.start).padStart(4,'0')+'–'+String(s.end).padStart(4,'0')+'</small></button>').join('')+'</div></div><div class="vocab-toolbar"><div class="vocab-search-wrap"><span>⌕</span><input id="vocab-search" type="search" placeholder="Search Japanese, English, Romaji or Sinhala…" value="'+esc(query)+'" autocomplete="off"></div><label class="vocab-part-label">STUDY SET <select id="vocab-part" '+(searching?'disabled':'')+'>'+Array.from({length:totalParts},(_,i)=>{const n=i+1,count=Math.min(PAGE_SIZE,records.length-i*PAGE_SIZE);return '<option value="'+n+'" '+(part===n?'selected':'')+'>Part '+n+' · '+count+' words</option>'}).join('')+'</select></label></div><div class="vocab-summary"><strong>'+(searching?rows.length+' results':'SECTION '+String(part).padStart(2,'0')+' / '+totalParts)+'</strong><span>'+(searching?'Search across all 623 words':'Showing '+section.count+' words · '+section.title)+'</span><span class="vocab-total">'+records.length+' TOTAL</span></div><div class="vocab-grid">'+(rows.length?rows.map(card).join(''):'<div class="empty-state">No matching vocabulary found.</div>')+'</div>'+(searching?'':'<div class="vocab-pagination"><button type="button" data-vocab-prev '+(part===1?'disabled':'')+'>← Previous</button><span>Part '+part+' / '+totalParts+'</span><button type="button" data-vocab-next '+(part===totalParts?'disabled':'')+'>Next →</button></div>')+'<p class="vocab-footnote">Japanese and furigana appear first. Tap a card to reveal Romaji, English and Sinhala meanings.</p>';
 const input=document.getElementById('vocab-search');if(input){input.focus({preventScroll:true});input.setSelectionRange(query.length,query.length);}
}
function bindEvents(){
 const root=document.getElementById('vocabulary-root');if(!root||root.dataset.bound)return;root.dataset.bound='1';
 root.addEventListener('input',e=>{if(e.target.id==='vocab-search'){query=e.target.value;renderContent();}});
 root.addEventListener('change',e=>{if(e.target.id==='vocab-part'){part=Number(e.target.value)||1;flipped.clear();renderContent();}});
 root.addEventListener('click',async e=>{\n  if(e.target.closest('[data-vocab-retry]')){loadingPromise=null;root.innerHTML='<div class="empty-state">Retrying vocabulary load…</div>';loadVocabulary().then(renderContent).catch(err=>{root.innerHTML='<div class="empty-state"><strong>Vocabulary could not be loaded.</strong><br>'+esc(err.message)+'<br><button type="button" data-vocab-retry>Retry</button></div>';});return;}
  const flip=e.target.closest('[data-vocab-flip]');if(flip){const id=flip.dataset.vocabFlip;flipped.has(id)?flipped.delete(id):flipped.add(id);renderContent();return;}
  const fav=e.target.closest('[data-vocab-fav]');if(fav){const id=fav.dataset.vocabFav;favourites.has(id)?favourites.delete(id):favourites.add(id);renderContent();try{await window.ReadyToFlyProgress?.save?.('vocabulary:favourites',[...favourites]);}catch(err){console.warn('Favourite sync failed',err);}return;}
  const set=e.target.closest('[data-vocab-set]');if(set){part=Number(set.dataset.vocabSet)||1;query='';flipped.clear();renderContent();return;}
  if(e.target.closest('[data-vocab-prev]')){part=Math.max(1,part-1);flipped.clear();renderContent();}
  if(e.target.closest('[data-vocab-next]')){part=Math.min(Math.ceil(records.length/PAGE_SIZE),part+1);flipped.clear();renderContent();}
 });
}
export function renderVocabulary(){
 return '<section class="welcome"><p class="eyebrow">JAPANESE TECHNICAL LANGUAGE</p><h1>Vocabulary Center</h1><p class="muted">623 master words · 12 topic sections · Japanese, Furigana, Romaji, English and Sinhala</p></section><section class="panel vocabulary-panel"><div id="vocabulary-root"><div class="empty-state">Loading all 623 vocabulary records…</div></div></section><script></script>'.replace('<script></script>','')+(typeof document!=='undefined'?(queueMicrotask(()=>{bindEvents();loadVocabulary().then(()=>{bindEvents();renderContent();}).catch(err=>{loadingPromise=null;const root=document.getElementById('vocabulary-root');if(root)root.innerHTML='<div class="empty-state"><strong>Vocabulary could not be loaded.</strong><br>'+esc(err.message)+'<br><button type="button" data-vocab-retry>Retry</button></div>';});}), ''):'');
}
