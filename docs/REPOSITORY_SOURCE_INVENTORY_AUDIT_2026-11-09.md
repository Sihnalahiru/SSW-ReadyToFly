# ReadyToFly Repository Source Inventory Audit — 2026-11-09

## Scope
Repository tree: `feature/zero-cost-auth-autosave-v2`.
Method: recursive Git tree inventory plus structural inspection of existing JSON manifests and selected audit reports. This is a repository inventory, not a source-PDF page-by-page certification.

## Correction to the earlier app-data summary
The app-facing normalized collections under `data/lessons/index.json`, `data/questions/index.json`, `data/vocabulary/index.json`, and `data/mappings/index.json` currently declare zero records. However, this does **not** mean the repository contains no study data. Substantial source and working datasets exist under `assets/data/`. They have not yet been promoted into the normalized app collections because multiple source, language, page, and media checks remain pending.

## Repository inventory
- Recursive tree: 776 entries (746 files, 30 directories).
- PDF source files: 7.
- JSON files: 60+ (including source batches, manifests, audit reports, question bank, vocabulary bank and app collection indexes).
- Source/working assets under `assets/data/`: 694 files in the audited tree.
- Three Aircraft Maintenance source PDFs and image/audit assets are a separate track; do not merge them into Ground Handling.

## Ground Handling source groups
### Rev 1 Sinhala
- Ground Handling V1 PDF and Safety and Quality V1 PDF are present.
- Existing JSON page batches are present for Ground Handling (pages 1–46) and Safety/Quality (pages 1–31).
- Treat these as Rev 1 source/working data only. Preserve them separately from Rev 2.
- Presence of JSON does not itself prove translation or page-level source accuracy.

### Rev 2 Sinhala
- Safety and Quality Rev 2 PDF: 26 physical PDF pages; 22 printed content pages. Its source manifest contains a page map and chapter/section outline. Translation, audio and image mapping are not certified by that manifest.
- Airport Ground Handling Rev 2.1 PDF is present (binary 4,748,453 bytes). Its source manifest explicitly records PDF extraction as PENDING; page count and source structure must not be inferred from the filename.
- Six Airport Ground Handling Rev 2.1 JSON batches contain 31 page records in total (5+5+5+5+5+6). The structural audit reports 81 vocabulary records and 62 image references.
- The Rev 2.1 structural audit reports 0/62 referenced image paths exist under the referenced names; the directory has 84 files with a different filename set. Do not rename or map by numeric similarity.
- The same audit reports 18 page records with truncated furigana/romaji, one romaji field containing Japanese-script characters, and no source-PDF comparison certification. Keep affected fields/mappings PENDING until checked.

## Question bank
- `assets/data/exam_question_bank.json`: 654 records.
- `assets/data/exam_papers.json`: 14 unofficial practice papers, 654 references; 13 papers of 50 questions and one final paper of 4. Timers remain disabled/pending.
- Existing CBT audit reports 623 inherited vocabulary-derived records and 31 uploaded-source/sample records.
- CBT audit findings: 20 answer-key/option-value mismatches (OPS-01 to OPS-20), one short-answer item with no options (SMP-05), no explicit language-mode field, and no complete verified Japanese-only question/answer/explanation set.
- Preserve all 654 records and all 14 paper definitions unchanged while auditing. Do not present the practice papers as official exam papers.

## Vocabulary bank
- `assets/data/vocabulary_master.json`: 623 records.
- These records have Japanese, furigana, romaji, English and Sinhala fields plus source/image/page references. Their presence is not independent proof that every reading, translation, duplicate or image mapping is correct.
- The normalized app vocabulary collection remains empty pending validation and safe import.

## App integration status
- Normalized app collections currently contain zero records by design/status: lesson, question, vocabulary and media mapping indexes all say PENDING.
- Study, vocabulary, quiz and progress screens remain explicit placeholders. Do not enable fake progress or fabricated content.
- Progress autosave queue infrastructure exists in the app shell, but actual lesson/quiz/vocabulary events are not yet connected to verified learning records.

## Required next work — ordered
1. Extract and compare Rev 2.1 Ground Handling PDF page-by-page; preserve physical and printed page numbering separately.
2. Review Rev 2 Safety/Quality translated JSON against its 26-page PDF; correct only with source evidence.
3. Validate all 623 vocabulary readings, translations, duplicates, provenance and image/page references.
4. Create question-level language eligibility manifest for all 654 questions; resolve 20 answer-key mismatches and SMP-05 only from source evidence.
5. Inspect the 84 Rev 2.1 image files visually and establish exact source-page mappings; do not infer from filenames.
6. Populate normalized app indexes only from approved records, preserving source IDs and revision boundaries.
7. Implement study/quiz/vocabulary interactions and connect real events to per-user progress autosave.
8. Run structural, language, browser, API, account-isolation and offline-shell tests.
9. Reconcile D1 migration history/schema before any migration apply. No D1 changes in this audit.

## Safety and integrity
- No source data, questions, answer keys, vocabulary or images were deleted or rewritten by this inventory.
- No new questions, translations, readings, answer keys or media mappings were invented.
- Rev 1, Rev 2 and Aircraft Maintenance remain separate.
- This audit does not authorize PR merge, D1 migration apply or production deployment.
