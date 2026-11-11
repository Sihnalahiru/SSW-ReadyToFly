const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function renderDashboard(user = {}) {
 const username = String(user.username || 'Pilot');
 const safeUsername = escapeHtml(username);
 const progress = window.ReadyToFlyProgress?.get?.() || {};
 const avatarOptions = [
  {id:'pilot',icon:'👨‍✈️',label:'Male pilot'},
  {id:'pilot-f',icon:'👩‍✈️',label:'Female pilot'},
  {id:'crew',icon:'🧑‍✈️',label:'Cabin crew'},
  {id:'ground',icon:'🦺',label:'Ground crew'},
  {id:'engineer',icon:'🧑‍🔧',label:'Engineer'},
  {id:'operations',icon:'🎧',label:'Operations'},
  {id:'traveller',icon:'🧑‍💼',label:'Airport staff'},
  {id:'aircraft',icon:'✈️',label:'Aircraft'}
 ];
 const selectedAvatar = progress['profile-avatar']?.id || 'pilot';
 const avatar = avatarOptions.find(option=>option.id===selectedAvatar) || avatarOptions[0];
 const entries = Object.entries(progress);
 const reviewed = entries.filter(([key,value])=>key.startsWith('study-page:') && value?.reviewed).length;
 const learned = entries.filter(([key,value])=>key.startsWith('vocabulary-known:') && value?.known).length;
 const attempts = entries.filter(([key,value])=>key.startsWith('quiz-attempt:') && value && typeof value.correct==='boolean');
 const correct = attempts.filter(([,value])=>value.correct).length;
 const accuracy = attempts.length ? Math.round(correct/attempts.length*100) : null;
 const totalActivity = reviewed + learned + attempts.length;
 const wordProgress = Math.min(100,Math.round(learned/623*100));
 const avatarMarkup = avatarOptions.map(option=>`<button type="button" class="rtf-avatar-option ${selectedAvatar===option.id?'is-selected':''}" data-avatar-choice="${option.id}" aria-label="Choose ${option.label}" aria-pressed="${selectedAvatar===option.id}"><span>${option.icon}</span><small>${option.label}</small></button>`).join('');
 return `
 <style>
 .rtf-home{--home-ink:#14264a;--home-muted:#687b99;--home-line:#dce6f4;--home-blue:#1678dc;--home-card:#fff;color:var(--home-ink);font-family:'DM Sans',system-ui,sans-serif}
 .rtf-home *{box-sizing:border-box}
 .rtf-home .home-welcome{position:relative;isolation:isolate;display:flex;align-items:center;gap:22px;min-height:174px;overflow:hidden;padding:24px 28px;border-radius:22px;background:linear-gradient(105deg,#102c59 0%,#1d4c82 52%,#426d91 100%);color:#fff;box-shadow:0 14px 34px rgba(20,54,100,.18)}
 .rtf-home .home-welcome:before{content:"";position:absolute;z-index:-1;inset:0;background:radial-gradient(ellipse at 85% 15%,rgba(255,190,125,.65),transparent 25%),linear-gradient(115deg,transparent 42%,rgba(255,255,255,.12) 43%,transparent 44%),repeating-linear-gradient(165deg,transparent 0 30px,rgba(255,255,255,.035) 31px 32px);opacity:.9}
 .rtf-home .welcome-avatar{width:102px;height:102px;flex:0 0 102px;display:grid;place-items:center;border:3px solid rgba(255,255,255,.72);border-radius:50%;background:linear-gradient(145deg,#b9e5ff,#4d91d4);font-size:56px;box-shadow:0 8px 24px rgba(0,0,0,.2)}
 .rtf-home .welcome-copy{min-width:0;position:relative;z-index:1}
 .rtf-home .welcome-copy .eyebrow{margin:0 0 8px;color:#bfe4ff;font-size:10px;font-weight:800;letter-spacing:1.8px}
 .rtf-home .welcome-copy h1{margin:0;font:800 clamp(23px,3vw,34px)/1.2 Manrope,sans-serif;letter-spacing:-.8px}
 .rtf-home .welcome-copy p{margin:8px 0 0;color:#d7e9ff;font-size:13px}
 .rtf-home .welcome-active{position:absolute;right:20px;top:18px;padding:8px 12px;border-radius:99px;background:#baf5cb;color:#11643d;font-size:10px;font-weight:800}
 .rtf-home .welcome-aircraft{position:absolute;right:8%;bottom:-24px;font-size:142px;line-height:1;opacity:.19;transform:rotate(-9deg);pointer-events:none}
 .rtf-home .home-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin:17px 0}
 .rtf-home .home-stat,.rtf-home .home-panel,.rtf-home .home-quick{background:var(--home-card);border:1px solid var(--home-line);border-radius:17px;box-shadow:0 7px 22px rgba(26,60,106,.055)}
 .rtf-home .home-stat{display:flex;align-items:center;gap:13px;min-width:0;padding:15px}
 .rtf-home .home-stat-icon{width:43px;height:43px;flex:0 0 43px;display:grid;place-items:center;border-radius:13px;background:#e6f3ff;color:#1678dc;font-size:21px}
 .rtf-home .home-stat strong,.rtf-home .home-stat small{display:block}
 .rtf-home .home-stat strong{font:800 25px Manrope;color:#14264a}
 .rtf-home .home-stat small{margin-top:3px;color:var(--home-muted);font-size:10px}
 .rtf-home .home-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(245px,.85fr);gap:15px}
 .rtf-home .home-panel{padding:18px;min-width:0}
 .rtf-home .home-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}
 .rtf-home .home-panel-head h2{margin:0;font:800 17px Manrope;color:#14264a}
 .rtf-home .home-panel-head p{margin:0 0 4px;color:#7486a2;font-size:9px;font-weight:800;letter-spacing:1.2px}
 .rtf-home .home-track{display:flex;align-items:center;gap:14px;padding:12px;border:1px solid #e5edf7;border-radius:14px;background:#f8fbff}
 .rtf-home .home-track-icon{width:58px;height:58px;flex:0 0 58px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(145deg,#dceeff,#b8d9ff);font-size:29px;color:#176fc3}
 .rtf-home .home-track-copy{flex:1;min-width:0}
 .rtf-home .home-track-copy strong{display:block;font:750 13px Manrope;color:#17294b}
 .rtf-home .home-track-copy small{display:block;margin-top:5px;color:#71839d;font-size:10px;line-height:1.5}
 .rtf-home .home-track button,.rtf-home .home-action{border:0;border-radius:10px;background:#1678dc;color:white;padding:10px 14px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}
 .rtf-home .home-track-list{display:grid;gap:9px}
 .rtf-home .home-streak-number{font:800 28px Manrope;color:#14264a}
 .rtf-home .home-streak-days{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:12px}
 .rtf-home .home-streak-days span{display:grid;place-items:center;aspect-ratio:1;border-radius:50%;background:#eef3fa;color:#8b9bb1;font-size:10px}
 .rtf-home .home-streak-days span.done{background:#d9f6e7;color:#13834c}
 .rtf-home .home-streak-labels{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:5px;text-align:center;color:#8291a8;font-size:8px}
 .rtf-home .home-quick-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
 .rtf-home .home-quick{display:flex;align-items:center;gap:10px;padding:12px;text-align:left;cursor:pointer;color:#17294b;transition:transform .16s,border-color .16s}
 .rtf-home .home-quick:hover{transform:translateY(-2px);border-color:#9fc8f3}
 .rtf-home .home-quick-icon{width:38px;height:38px;flex:0 0 38px;display:grid;place-items:center;border-radius:11px;background:#e5f3ff;color:#1378d8;font-size:19px}
 .rtf-home .home-quick strong,.rtf-home .home-quick small{display:block}
 .rtf-home .home-quick strong{font:750 11px Manrope}
 .rtf-home .home-quick small{margin-top:3px;color:#7586a0;font-size:9px}
 .rtf-home .home-progress-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin:12px 0;color:#405575;font-size:11px}
 .rtf-home .home-progress-track{grid-column:1/-1;height:8px;border-radius:99px;background:#eaf0f8;overflow:hidden}
 .rtf-home .home-progress-track i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#1689e8,#51b7ed)}
 .rtf-home .home-activity-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
 .rtf-home .home-activity-grid div{padding:11px;border-radius:12px;background:#f5f8fd}
 .rtf-home .home-activity-grid strong{display:block;font:800 19px Manrope;color:#14264a}
 .rtf-home .home-activity-grid small{display:block;margin-top:3px;color:#73839c;font-size:9px}
 .rtf-home .home-avatars{margin-top:14px;padding-top:12px;border-top:1px solid var(--home-line)}
 .rtf-home .home-avatars>p{margin:0 0 8px;color:#7486a2;font-size:9px;font-weight:800;letter-spacing:1.2px}
 .rtf-home .home-avatar-grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:7px}
 .rtf-home .rtf-avatar-option{display:flex;flex-direction:column;align-items:center;gap:4px;padding:7px 3px;border:1px solid #e1eaf5;border-radius:11px;background:#f8fbff;cursor:pointer}
 .rtf-home .rtf-avatar-option span{font-size:22px}
 .rtf-home .rtf-avatar-option small{font-size:8px;color:#657995}
 .rtf-home .rtf-avatar-option.is-selected{border-color:#3995e8;background:#e8f4ff;box-shadow:inset 0 0 0 1px #3995e8}
 .rtf-home .home-empty{padding:11px;border-radius:12px;background:#f6f9fd;color:#71839d;font-size:10px;line-height:1.6}
 @media(max-width:1050px){.rtf-home .home-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.rtf-home .home-quick-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:760px){.rtf-home .home-welcome{min-height:145px;padding:18px;gap:13px}.rtf-home .welcome-avatar{width:72px;height:72px;flex-basis:72px;font-size:39px}.rtf-home .welcome-active{right:10px;top:10px;font-size:8px}.rtf-home .welcome-copy p{font-size:11px}.rtf-home .welcome-aircraft{font-size:95px;right:2%}.rtf-home .home-grid{grid-template-columns:1fr}.rtf-home .home-track{align-items:flex-start;flex-wrap:wrap}.rtf-home .home-track button{margin-left:72px}.rtf-home .home-avatar-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
 @media(max-width:480px){.rtf-home .home-stats{gap:8px}.rtf-home .home-stat{padding:10px;gap:8px}.rtf-home .home-stat-icon{width:34px;height:34px;flex-basis:34px;font-size:17px}.rtf-home .home-stat strong{font-size:20px}.rtf-home .home-stat small{font-size:9px}.rtf-home .home-quick-grid{grid-template-columns:1fr 1fr}.rtf-home .home-panel{padding:13px}}
 </style>
 <div class="rtf-home">
  <section class="home-welcome">
   <div class="welcome-avatar" role="img" aria-label="Selected profile avatar">${avatar.icon}</div>
   <div class="welcome-copy"><p class="eyebrow">YOUR PERSONAL LEARNING SPACE</p><h1>Welcome back, ${safeUsername}. 👋</h1><p>Airport Ground Handling · Japanese Technical Training</p></div>
   <span class="welcome-active">✓ ACCOUNT ACTIVE</span><span class="welcome-aircraft" aria-hidden="true">✈</span>
  </section>
  <section class="home-stats" aria-label="Learning overview">
   <article class="home-stat"><span class="home-stat-icon">▤</span><div><strong>623</strong><small>Vocabulary words</small></div></article>
   <article class="home-stat"><span class="home-stat-icon">▱</span><div><strong>13</strong><small>Vocabulary sets</small></div></article>
   <article class="home-stat"><span class="home-stat-icon">▣</span><div><strong>14</strong><small>Practice papers</small></div></article>
   <article class="home-stat"><span class="home-stat-icon">◫</span><div><strong>654</strong><small>Question references</small></div></article>
  </section>
  <div class="home-grid">
   <div class="home-main-column">
    <section class="home-panel">
     <div class="home-panel-head"><div><p>LEARNING SPACE</p><h2>Continue your journey</h2></div><span aria-hidden="true">✦</span></div>
     <div class="home-track-list">
      <article class="home-track"><span class="home-track-icon">✈</span><div class="home-track-copy"><strong>Airport Ground Handling · Legacy</strong><small>Original Ground Handling V1 and Safety & Quality V1 source track. Kept separate from revised syllabus.</small></div><button type="button" data-view="study">Open Study</button></article>
      <article class="home-track"><span class="home-track-icon">🛫</span><div class="home-track-copy"><strong>Airport Ground Handling · Revised</strong><small>Revised Ground Handling 2.1 and Safety & Quality Rev 2 source track. Separate learning version.</small></div><button type="button" data-view="study">Open Study</button></article>
     </div>
    </section>
    <section class="home-panel" style="margin-top:14px">
     <div class="home-panel-head"><div><p>QUICK ACCESS</p><h2>Pick up where you need</h2></div></div>
     <div class="home-quick-grid">
      <button class="home-quick" type="button" data-view="study"><span class="home-quick-icon">▤</span><span><strong>Study Center</strong><small>Lessons & syllabus</small></span></button>
      <button class="home-quick" type="button" data-view="vocabulary"><span class="home-quick-icon">あ</span><span><strong>Vocabulary</strong><small>623 technical terms</small></span></button>
      <button class="home-quick" type="button" data-view="quiz"><span class="home-quick-icon">◇</span><span><strong>Quiz Center</strong><small>Topic practice</small></span></button>
      <button class="home-quick" type="button" data-view="exam"><span class="home-quick-icon">✓</span><span><strong>CBT Practice</strong><small>14 practice papers</small></span></button>
     </div>
    </section>
    <section class="home-panel" style="margin-top:14px">
     <div class="home-panel-head"><div><p>YOUR LEARNING PROGRESS</p><h2>Saved activity overview</h2></div></div>
     <div class="home-progress-row"><span>Vocabulary learned</span><strong>${learned} / 623 · ${wordProgress}%</strong><div class="home-progress-track"><i style="width:${wordProgress}%"></i></div></div>
     <div class="home-activity-grid"><div><strong>${reviewed}</strong><small>Study pages reviewed</small></div><div><strong>${learned}</strong><small>Words marked learned</small></div><div><strong>${attempts.length}</strong><small>Saved quiz attempts</small></div></div>
    </section>
   </div>
   <aside class="home-side-column">
    <section class="home-panel">
     <div class="home-panel-head"><div><p>ACCOUNT ACTIVITY</p><h2>Your study snapshot</h2></div><span>◷</span></div>
     <div class="home-streak-number">${totalActivity}</div><p style="margin:2px 0 0;color:#71839d;font-size:10px">Recorded learning actions</p>
     <div class="home-activity-grid"><div><strong>${reviewed}</strong><small>Pages reviewed</small></div><div><strong>${learned}</strong><small>Words learned</small></div><div><strong>${accuracy===null?'—':accuracy+'%'}</strong><small>Quiz accuracy</small></div></div>
     <p class="home-empty" style="margin-top:12px">${attempts.length?attempts.length+' saved quiz attempts, '+correct+' correct.':'Quiz accuracy will appear after your first saved quiz attempt.'} No study hours or streaks are estimated.</p>
    </section>
    <section class="home-panel" style="margin-top:14px">
     <div class="home-panel-head"><div><p>PERSONAL PROFILE</p><h2>Choose your avatar</h2></div></div>
     <div class="home-avatars"><div class="home-avatar-grid">${avatarMarkup}</div></div>
    </section>
   </aside>
  </div>
 </div>`;
}
