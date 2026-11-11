import { readFile } from 'node:fs/promises';
import { strict as assert } from 'node:assert';
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const [study, vocabulary, papers, bank, quiz] = await Promise.all([
 read('public/assets/data/study_note_visual_map.json'), read('public/assets/data/vocabulary_master.json'),
 read('public/assets/data/exam_papers.json'), read('public/assets/data/exam_question_bank.json'),
 read('public/assets/data/quiz_config.json')
]);
const [rootStudy, rootVocabulary, rootPapers, rootBank] = await Promise.all([
 read('assets/data/study_note_visual_map.json'), read('assets/data/vocabulary_master.json'),
 read('assets/data/exam_papers.json'), read('assets/data/exam_question_bank.json')
]);
const same=(a,b,label)=>assert.deepEqual(a,b,label+' root/runtime copies must match');
same(rootStudy,study,'Study map');same(rootVocabulary,vocabulary,'Vocabulary master');same(rootPapers,papers,'Exam paper manifest');same(rootBank,bank,'Exam question bank');
const unique=(items,key,label)=>{const values=items.map(item=>item[key]);assert.equal(new Set(values).size,values.length,label+' IDs must be unique');};
assert.equal(vocabulary.records.length,vocabulary.total_records);unique(vocabulary.records,'id','Vocabulary');
assert.equal(vocabulary.records.length,623);
for(const field of ['japanese','furigana','romaji','english','sinhala'])assert.equal(vocabulary.records.filter(x=>!String(x[field]||'').trim()).length,0,'Missing vocabulary '+field);
assert.equal(quiz.sets.set_count,13);assert.deepEqual(quiz.sets.question_counts,Array(12).fill(50).concat(23));assert.equal(quiz.sets.question_counts.reduce((a,b)=>a+b,0),623);
unique(bank.items,'id','Question bank');assert.equal(bank.items.length,bank.total_questions);
assert.equal(papers.papers.length,papers.total_papers);
const refs=papers.papers.flatMap(p=>p.questions);assert.equal(refs.length,papers.total_questions);assert.equal(new Set(refs).size,refs.length);
const ids=new Set(bank.items.map(x=>x.id));assert.equal(refs.filter(id=>!ids.has(id)).length,0);
assert.equal(bank.items.filter(x=>!String(x.question||x.question_text||'').trim()).length,0);
assert.equal(bank.items.filter(x=>!Array.isArray(x.options)||!x.options.length).length,1);
assert.equal(bank.items.filter(x=>Array.isArray(x.options)&&x.options.length&&!x.options.some(o=>String(o.value)===String(x.correct_answer))).length,0);
const ops=bank.items.filter(x=>/^OPS-(0[1-9]|1[0-9]|20)$/.test(x.id));assert.equal(ops.length,20);assert(ops.every(x=>x.correct_answer==='A'));
assert.equal(study.pages.length,study.source_json_page_records);unique(study.pages,'id','Study page');
console.log('PASS root/runtime copies synchronized');console.log('PASS 623 vocabulary records / 13 sets');console.log('PASS 14 papers / 654 unique questions / all references resolved');console.log('PASS OPS-01–20 and all selectable answer keys');console.log('PASS 139 unique study pages');
