# Rev 2 Ground Handling and Safety & Quality JSON Structural Audit

**Date:** 2026-11-09  
**Branch:** `feature/zero-cost-auth-autosave-v2`  
**Scope:** Nine Rev 2 JSON batch files only: six Airport Ground Handling batches and three Safety & Quality batches. This is a structural audit against the repository tree, not a PDF content certification or visual image review.

## 1. Coverage and structure

| Metric | Airport Ground Handling Rev 2.1 | Safety & Quality Rev 2 |
|---|---:|---:|
| Batch files | 6 | 3 |
| JSON page records | 31 | 31 |
| Page numbers covered | 1–31, no gaps | 1–31, no gaps |
| Duplicate page numbers within this track | 0 | 0 |
| Study sections | 31 | 31 |
| Vocabulary highlights | 81 | 62 |
| Pages with an audio narration text block | 31 | 31 |
| Pages with zero mapped image refs | 9 | 0 |

Audio narration entries are text/script records; this audit does not establish that playable audio assets exist.

## 2. Japanese text and reading integrity flags

| Check | Airport Ground Handling | Safety & Quality |
|---|---:|---:|
| Furigana fields containing ellipses | 5 pages | 1 page |
| Romaji fields containing ellipses | 16 pages | 8 pages |
| Romaji field containing Japanese script | 1 page (page 4) | 0 |
| Missing core Japanese/English/Sinhala fields in a study section | 0 | 0 |

Airport Ground Handling page 4 contains mixed romaji/Japanese script: `Koukuuki ga teishi shita chokugo, kitai ga katte ni ugokidasanai you ni chokkusu wo soushakuしなければならない。` This is flagged for source verification; no correction was made.

Ellipses indicate the reading/romaji fields are visibly incomplete in the stored JSON. The original Japanese text field does not contain ellipses in these records. The missing reading/romaji must not be reconstructed from guesswork.

## 3. Image-reference integrity

### Airport Ground Handling Rev 2.1

- 68 mapped image-reference occurrences; all 68 exact repository paths exist.
- Nine page records (pages 1–5, 8, 14, 17, 18) contain no mapped image references.
- The source image folder contains 84 tracked image files; therefore this JSON mapping does not account for every image file.
- Exact path existence does not establish that the image is correctly associated with the page or content. Visual/source review remains pending.

### Safety & Quality Rev 2

- 62 mapped image-reference occurrences across 31 pages; two references per page.
- All 62 stored references use zero-padded filenames such as `001.jpg`.
- The actual repository folder contains the corresponding numeric filenames without zero padding (for example `1.jpg`, not `001.jpg`). Exact path matching therefore fails for all 62 references.
- The image folder contains 141 tracked image files. Numeric filename similarity is not sufficient to rewrite the references automatically; no file was renamed or mapped.

## 4. Source page-number risk

The Safety & Quality JSON uses page numbers 1–31. The existing source audit records 26 physical PDF pages and 22 printed content pages, and previously identified that JSON pages 1–5 do not correspond to the PDF's printed content pages 1–5. This structural audit does not reconcile that discrepancy. The JSON page numbers must not be treated as verified PDF printed page numbers.

## 5. Release status

| Area | Status |
|---|---|
| JSON parse and batch coverage | STRUCTURALLY VERIFIED |
| Page-to-PDF content alignment | PENDING |
| Japanese readings and romaji | PENDING SOURCE REVIEW |
| English/Sinhala translation accuracy | PENDING SOURCE REVIEW |
| Image visual content and page association | PENDING VISUAL REVIEW |
| Playable audio assets and timing | PENDING |
| Promotion into app-facing lesson index | BLOCKED_PENDING_SOURCE_VERIFICATION |

## 6. Required follow-up

1. Obtain a readable original Rev 2 PDF payload for page-by-page comparison; repository connector metadata alone is not a PDF content review.
2. Review the 9 Ground Handling pages with no image refs and the 84-file image folder without guessing mappings.
3. Inspect the 141 Safety & Quality images visually and establish evidence-backed page/figure relationships.
4. Verify every ellipsis-affected furigana/romaji field against the source text and a reliable Japanese reading source.
5. Resolve the Safety & Quality PDF physical/printed page numbering before importing page references.
6. Keep all Rev 1, Rev 2, Ground Handling, Safety & Quality and Aircraft Maintenance records separate.

## Preservation

No source PDF, JSON batch, vocabulary item, image file, image filename, reading, translation, or mapping was changed. No missing content was reconstructed. No app-facing index was populated. No D1 migration, production deployment, or PR merge was performed.