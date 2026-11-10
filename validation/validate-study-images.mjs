import { readFile, access } from 'node:fs/promises';

const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const exists = async path => { try { await access(path); return true; } catch { return false; } };
const study = await readJson('public/assets/data/study_note_visual_map.json');
const vocab = await readJson('public/assets/data/vocabulary_master.json');
const studyUi = await readFile('public/app/study.js', 'utf8');
const serviceWorker = await readFile('public/sw.js', 'utf8');
const cacheMatch = serviceWorker.match(/readytofly-shell-v([0-9]+)/);
const cacheVersion = Number(cacheMatch?.[1] || 0);
if (cacheVersion < 14) {
  throw new Error('Service worker shell cache version must be v14 or newer after Study Center code changes.');
}
if (!serviceWorker.includes("'./assets/data/study_note_visual_map.json'")) {
  throw new Error('Study source JSON must be included in the service worker core assets.');
}
if (!studyUi.includes("const DATA_URL = '/assets/data/study_note_visual_map.json';")) {
  throw new Error('Study data must use an origin-root absolute URL.');
}
if (!studyUi.includes(' setTimeout(async () => {')) {
  throw new Error('Study data loading must start after the router inserts the Study Center root.');
}
if (!studyUi.includes('15000') || !studyUi.includes("error.name === 'AbortError'")) {
  throw new Error('Study source fetch must have a visible timeout failure state.');
}
if (!studyUi.includes("root.addEventListener('error'") || !studyUi.includes("img.matches('[data-study-image]')")) {
  throw new Error('Study image load-error handler must use delegated capture on the persistent root.');
}
if (studyUi.includes("root.querySelectorAll('[data-study-image]').forEach")) {
  throw new Error('Study image error handler must not query images before root.innerHTML is rendered.');
}
const failures = [];
let studyRefs = 0, verifiedImages = 0, vocabularyRefs = 0, pendingRefs = 0;

for (const page of study.pages || []) {
  const mapped = Array.isArray(page.mapped_images) ? page.mapped_images : [];
  const verified = Array.isArray(page.verified_non_qr_images) ? page.verified_non_qr_images : [];
  for (const imagePath of mapped) {
    studyRefs++;
    if (!imagePath.startsWith('assets/data/') || !(await exists(imagePath))) {
      failures.push(`Missing study image: ${page.id} -> ${imagePath}`);
    }
  }
  for (const imagePath of verified) {
    verifiedImages++;
    if (!mapped.includes(imagePath)) failures.push(`Verified image is not in mapped_images: ${page.id} -> ${imagePath}`);
    if (/qr|qrcode/i.test(imagePath)) failures.push(`QR-named image is marked verified: ${page.id} -> ${imagePath}`);
    if (!(await exists(imagePath))) failures.push(`Missing verified study image: ${page.id} -> ${imagePath}`);
  }
}

for (const record of vocab.records || []) {
  for (const imagePath of record.image_refs || []) {
    vocabularyRefs++;
    if (!(await exists(imagePath))) failures.push(`Broken active vocabulary image ref: ${record.id} -> ${imagePath}`);
  }
  for (const imagePath of record.image_refs_pending || []) {
    pendingRefs++;
    if (await exists(imagePath)) failures.push(`Pending vocabulary ref now exists; reconcile audit: ${record.id} -> ${imagePath}`);
  }
}

if (study.pages?.length !== 139) failures.push(`Unexpected study page count: ${study.pages?.length}`);
if (verifiedImages !== 182) failures.push(`Expected 182 visually reviewed non-QR study images, found ${verifiedImages}`);
if (studyRefs !== 200) failures.push(`Expected 200 exact study image mappings, found ${studyRefs}`);

console.log(`Study pages: ${study.pages.length}; exact image references: ${studyRefs}; visually reviewed non-QR images: ${verifiedImages}`);
console.log(`Vocabulary active image paths: ${vocabularyRefs}; preserved unresolved source paths: ${pendingRefs}`);
if (failures.length) {
  for (const failure of failures) console.error('FAIL', failure);
  process.exitCode = 1;
} else {
  console.log('PASS: all active study/vocabulary image paths exist; pending references remain explicitly quarantined.');
}
