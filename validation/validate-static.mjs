import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const roots = ['public', 'worker/src'];
const jsonFiles = [
  'public/manifest.json',
  'assets/data/study_note_visual_map.json',
  'assets/data/vocabulary_master.json',
  'assets/data/quiz_config.json',
  'assets/data/exam_question_bank.json',
  'assets/data/exam_papers.json'
];

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(path));
    else if (entry.isFile() && path.endsWith('.js')) output.push(path);
  }
  return output;
}

let failed = false;
for (const root of roots) {
  for (const file of await walk(root)) {
    const source = await readFile(file, 'utf8');
    const result = spawnSync(process.execPath, ['--input-type=module', '--check'], {
      input: source, encoding: 'utf8'
    });
    if (result.status !== 0) {
      failed = true;
      console.error('FAIL JavaScript:', relative('.', file), result.stderr.trim());
    } else console.log('PASS JavaScript:', relative('.', file));
  }
}

for (const file of jsonFiles) {
  try {
    JSON.parse(await readFile(file, 'utf8'));
    console.log('PASS JSON:', file);
  } catch (error) {
    failed = true;
    console.error('FAIL JSON:', file, error.message);
  }
}

if (failed) process.exitCode = 1;
else console.log('ReadyToFly static validation passed. This does not replace browser, D1, or live Worker tests.');
