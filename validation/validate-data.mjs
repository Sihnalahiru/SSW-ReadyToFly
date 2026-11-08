import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const files = [
  'data/catalog.json',
  'data/lessons/index.json',
  'data/vocabulary/index.json',
  'data/questions/index.json',
  'data/mappings/index.json'
];
let failed = false;
for (const file of files) {
  try {
    const parsed = JSON.parse(await readFile(resolve(file), 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected a JSON object');
    if (file.endsWith('/index.json') && (!Array.isArray(parsed.records) || parsed.record_count !== parsed.records.length)) {
      throw new Error('records must be an array and record_count must match its length');
    }
    console.log('PASS', file);
  } catch (error) {
    failed = true;
    console.error('FAIL', file, error.message);
  }
}
if (failed) process.exitCode = 1;
else console.log('All study data index files passed structural validation.');
