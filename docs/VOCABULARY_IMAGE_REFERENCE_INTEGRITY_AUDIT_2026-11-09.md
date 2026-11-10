# Vocabulary Image Reference Integrity Audit

**Date:** 2026-11-09  
**Branch:** `feature/zero-cost-auth-autosave-v2`  
**Inputs:** `assets/data/vocabulary_master.json` (623 records) and the complete recursive Git tree for this branch (750 files).  
**Method:** Exact path comparison only. No filename normalization, renaming, inferred page association, or visual-content matching.

## Results

| Metric | Result |
|---|---:|
| Vocabulary records | 623 |
| Total image-reference occurrences | 2,579 |
| Unique referenced image paths | 230 |
| Unique paths present exactly in repository tree | 87 |
| Unique paths absent exactly from repository tree | 143 |
| Missing reference occurrences | 1,095 |
| Missing unique paths whose basename exists somewhere else in repo | 19 |
| Question-bank visual references checked | 2 |
| Question-bank visual references absent from tree | 2 |

## Interpretation

- A reference is counted as present only when its full repository-relative path exactly matches a tracked file path.
- The 19 same-basename cases are **not** treated as valid mappings: a file with the same basename in another directory may be a different image.
- Missing question visual refs are `GH_Sample_Questions_page2_Fig1` and `GH_Sample_Questions_page2_Fig2` (used by `SMP-05` and `SMP-06`). These identifiers are not file paths in the repository tree.
- The audit establishes path integrity only. It does not prove that a present image depicts the referenced vocabulary item, page, or question.

## Revision separation and safety

Repository image folders exist for Rev 1 Ground Handling, Rev 1 Safety & Quality, Rev 2 Safety & Quality, Rev 2 Ground Handling, and Aircraft Maintenance Books 1–3. Their original folder names and filenames must remain unchanged. Do not map a missing Rev 2 reference to a similarly numbered Rev 1 image, or map images between Ground Handling and Safety & Quality based on numeric similarity.

## Required follow-up

1. Inspect the exact missing paths against the original source workbook and source PDFs.
2. Produce candidate corrections in a separate review manifest with source evidence and human approval; do not rewrite `vocabulary_master.json` automatically.
3. Visually inspect every candidate image and verify its content and revision before marking any mapping VERIFIED.
4. Resolve the two sample-paper figure references against the original sample-question source before enabling those questions.

## Preservation

No vocabulary record, image filename, image file, question, or image reference was modified. No image was renamed or remapped. No app-facing data was promoted. No D1 migration, production deployment, or PR merge was performed.