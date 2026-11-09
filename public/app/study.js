const DATA_URL = '../assets/data/study_note_visual_map.json';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));

const trackOf = page => page.source_json?.includes('Rev 1 Sinhala') ? 'rev1' : 'rev2';
const trackLabel = track => track === 'rev1' ? 'Legacy · Revision 1' : 'Revised · Revision 2';
const trackNotice = track => track === 'rev1'
 ? 'Extracted from the Revision 1 working study JSON. PDF page-by-page alignment and translations still require final source review.'
 : 'Extracted from the Revision 2 working study JSON. PDF page alignment, image mapping and language review are still pending.';

let pages = [];
let activeTrack = 'rev1';
let activePageId = '';
let searchTerm = '';
let loadError = '';

function currentPages() {
 const term = searchTerm.trim().toLocaleLowerCase();
 return pages.filter(page => trackOf(page) === activeTrack && (
  !term || [
   page.title_sinhala,page.title_japanese,page.title_english,page.id,
   ...(page.study_sections || []).flatMap(section => [
    section.japanese,section.english,section.sinhala,section.romaji
   ])
  ].some(value => String(value || '').toLocaleLowerCase().includes(term))
 ));
}

function renderPage(page) {
 if (!page) return '<div class="empty-state">No matching study pages. Try another search.</div>';
 const sections = (page.study_sections || []).map((section,index) => `
  <article class="panel study-content-card">
   <div class="study-content-meta"><span>${escapeHtml(section.type || 'study note')}</span><span>Section ${index+1}</span></div>
   <h3>${escapeHtml(section.japanese || 'Japanese source text unavailable')}</h3>
   ${section.furigana ? `<p class="study-reading"><strong>Reading:</strong> ${escapeHtml(section.furigana)}</p>` : ''}
   ${section.romaji ? `<p class="study-romaji">${escapeHtml(section.romaji)}</p>` : ''}
   <div class="study-language-block"><span>ENGLISH</span><p>${escapeHtml(section.english || 'English text pending')}</p></div>
   <div class="study-language-block study-sinhala"><span>SINHALA</span><p>${escapeHtml(section.sinhala || 'සිංහල අර්ථකථනය තවම නොමැත')}</p></div>
  </article>
 `).join('');
 return `
  <div class="study-page-heading"><div><p class="eyebrow">SOURCE PAGE ${escapeHtml(page.page_number)}</p><h2>${escapeHtml(page.title_japanese || page.title_sinhala || 'Study page')}</h2><p class="muted">${escapeHtml(page.title_sinhala || '')}</p></div><button class="secondary-button" type="button" data-study-complete="${escapeHtml(page.id)}">Mark page reviewed</button></div>
  ${sections || '<div class="empty-state">No study sections are recorded for this source page.</div>'}
 `;
}

function mountStudy(root) {
 const trackPages = currentPages();
 const active = trackPages.find(page => page.id === activePageId) || trackPages[0] || null;
 if (active) activePageId = active.id;
 const nav = trackPages.map(page => `
  <button type="button" class="study-page-link ${active?.id === page.id ? 'active' : ''}" data-study-page="${escapeHtml(page.id)}">
   <span>Page ${escapeHtml(page.page_number)}</span><small>${escapeHtml(page.title_sinhala || page.title_japanese || 'Study page')}</small>
  </button>
 `).join('');
 root.innerHTML = `
  <section class="welcome"><p class="eyebrow">SOURCE-BASED LEARNING</p><h1>Study Center</h1><p class="muted">Read the existing Japanese source text with English and Sinhala study explanations. Source versions remain separate.</p></section>
  <section class="study-toolbar panel">
   <div class="study-track-tabs">
    <button type="button" data-study-track="rev1" class="${activeTrack === 'rev1' ? 'active' : ''}">Legacy · Rev 1</button>
    <button type="button" data-study-track="rev2" class="${activeTrack === 'rev2' ? 'active' : ''}">Revised · Rev 2</button>
   </div>
   <label class="study-search-label" for="study-search">Search this source</label>
   <input id="study-search" type="search" placeholder="Search Japanese, English or Sinhala…" value="${escapeHtml(searchTerm)}">
   <p class="study-source-notice">${escapeHtml(trackNotice(activeTrack))}</p>
   <div class="study-source-count">${trackLabel(activeTrack)} · ${trackPages.length} extracted pages</div>
  </section>
  <div class="study-reader-layout">
   <aside class="study-page-list" aria-label="Study pages">${nav || '<p class="muted">No pages found.</p>'}</aside>
   <section class="study-page-content" aria-live="polite">${renderPage(active)}</section>
  </div>
 `;
 root.querySelectorAll('[data-study-track]').forEach(button => button.addEventListener('click', () => {
  activeTrack = button.dataset.studyTrack; activePageId = ''; searchTerm = ''; mountStudy(root);
 }));
 root.querySelector('#study-search')?.addEventListener('input', event => {
  searchTerm = event.target.value; const cursor = searchTerm; mountStudy(root);
  const input = root.querySelector('#study-search'); input?.focus(); input?.setSelectionRange(cursor.length,cursor.length);
 });
 root.querySelectorAll('[data-study-page]').forEach(button => button.addEventListener('click', () => {
  activePageId = button.dataset.studyPage; mountStudy(root);
 }));
 root.querySelector('[data-study-complete]')?.addEventListener('click', event => {
  const pageId = event.currentTarget.dataset.studyComplete;
  window.dispatchEvent(new CustomEvent('readytofly:progress',{detail:{
   key:'study-page:'+pageId,value:{reviewed:true,reviewedAt:new Date().toISOString(),track:activeTrack}
  }}));
  event.currentTarget.textContent = 'Reviewed ✓';
  event.currentTarget.disabled = true;
 });
}

export function renderStudy() {
 queueMicrotask(async () => {
  const root = document.getElementById('study-root');
  if (!root) return;
  if (loadError) { root.innerHTML = `<div class="empty-state">${escapeHtml(loadError)}</div>`; return; }
  if (!pages.length) {
   root.innerHTML = '<div class="panel"><p class="muted">Loading study source…</p></div>';
   try {
    const response = await fetch(DATA_URL,{cache:'no-store'});
    if (!response.ok) throw new Error('Study source could not be loaded.');
    const data = await response.json();
    if (!Array.isArray(data.pages)) throw new Error('Study source format is not supported.');
    pages = data.pages;
   } catch (error) {
    loadError = error.message || 'Study source could not be loaded. Please try again while online.';
    root.innerHTML = `<div class="empty-state">${escapeHtml(loadError)}</div>`;
    return;
   }
  }
  mountStudy(root);
 });
 return '<section id="study-root" class="study-root"><div class="panel"><p class="muted">Loading study source…</p></div></section>';
}
