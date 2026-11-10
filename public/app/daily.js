const pad=n=>String(n).padStart(2,'0');
export const dayKey=(date=new Date())=>date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate());
const yesterdayKey=()=>{const d=new Date();d.setDate(d.getDate()-1);return dayKey(d)};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderDailyTasks(){
 const data=window.ReadyToFlyProgress?.get?.()||{},today=dayKey(),yday=yesterdayKey();
 const record=data['daily:tasks:'+today]||{tasks:{}},previous=data['daily:tasks:'+yday]||{tasks:{}};
 const defaults=[{id:'study',label:'Study today’s lesson',detail:'Continue your Ground Handling learning'},{id:'vocabulary',label:'Vocabulary practice',detail:'Review and learn key terms'},{id:'quiz',label:'Knowledge check',detail:'Strengthen recall with practice'}];
 const tasks=defaults.map(t=>({...t,done:!!record.tasks?.[t.id]}));
 const revision=defaults.filter(t=>previous.tasks?.[t.id]);
 const revisionDone=!!record.revisionDone;
 const done=tasks.filter(t=>t.done).length+(revision.length&&revisionDone?1:0),total=tasks.length+(revision.length?1:0),pct=Math.round(done/total*100);
 return '<section class="dashboard-section daily-task-section"><div class="section-heading"><div><p class="eyebrow">DAILY LEARNING CYCLE</p><h2>Today’s tasks</h2></div><span class="daily-date">'+new Date().toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'})+'</span></div><article class="panel daily-task-panel"><div class="daily-progress-head"><div><strong>'+done+' / '+total+'</strong><span> tasks completed</span></div><b>'+pct+'%</b></div><div class="daily-progress-track"><span style="width:'+pct+'%"></span></div><div class="daily-task-list">'+tasks.map(t=>'<label class="daily-task-row"><input type="checkbox" data-daily-task="'+t.id+'" '+(t.done?'checked':'')+'><span class="daily-task-copy"><strong>'+t.label+'</strong><small>'+t.detail+'</small></span><span class="daily-task-state">'+(t.done?'Done':'To do')+'</span></label>').join('')+'</div>'+(revision.length?'<div class="revision-block"><div class="revision-heading"><span>↻</span><div><strong>Previous day revision</strong><small>Revise what you completed yesterday</small></div></div>'+revision.map(t=>'<div class="revision-item"><span>✓</span>'+t.label+'</div>').join('')+'<label class="revision-complete"><input type="checkbox" data-daily-revision '+(revisionDone?'checked':'')+'> I have completed yesterday’s revision</label></div>':'<div class="revision-empty">Yesterday’s completed study tasks will automatically appear here for revision tomorrow.</div>')+'</article></section>';
}
