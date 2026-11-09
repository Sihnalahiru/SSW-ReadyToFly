# Vocabulary Master Structural & Script Audit

**Date:** 2026-11-09  
**Source:** `assets/data/vocabulary_master.json`  
**Scope:** Read-only structural and character-script validation of all 623 records. No readings, translations, sources, or mappings were changed.

## Summary

| Check | Result |
|---|---:|
| Total records | 623 |
| Missing Japanese / furigana / romaji / English / Sinhala fields | 0 |
| Missing source provenance | 0 |
| Missing study-page references | 115 |
| Missing image references | 194 |
| Duplicate Japanese headwords (exact match) | 0 |
| Furigana containing Sinhala script | 4 |
| Romaji containing non-ASCII character | 1 |
| Furigana / romaji with repeated internal spaces | 1 |

## Exact script anomalies

### Furigana contains Sinhala characters — must be reviewed against the source

| ID | Japanese | Stored furigana |
|---|---|---|
| GHV0387 | 有無 | `うむ こうくうきけんいんしゃගුවන්` |
| GHV0391 | 銃砲刀剣類 | `じゅうほうとうけんるいතුවක්කු` |
| GHV0539 | 航空輸送の品質 ことば | `ගුවන් よみかた` |
| GHV0620 | 極低温液体 | `えきたい からのかくりතාප` |

### Romaji contains a non-ASCII punctuation character

| ID | Japanese | Stored romaji |
|---|---|---|
| GHV0463 | グランドパワー車 エア・スタータ車 | `gurandopawa-sha・ea・suta-tasha` |

### Repeated internal spacing

| ID | Furigana | Romaji |
|---|---|---|
| GHV0622 | `ぶ っ し つ` | `bu  shi tsu` |

These are **flagged for source verification**, not silently corrected. The stored value may contain a transcription, column-alignment, or copy/paste problem; the correct reading must be established from the original workbook/source evidence.

## Interpretation and next gates

1. All 623 records have non-empty Japanese, furigana, romaji, English, Sinhala and source fields. This is a completeness check, not proof that their meanings/readings are accurate.
2. 115 records lack `study_page_refs`; 194 lack `image_refs`. Absence of a reference must not be filled by guessing from adjacent IDs or similar filenames.
3. Exact Japanese headword duplicate scan found zero duplicate strings. This does not rule out semantic duplicates or variant spellings.
4. Review the six script/spacing anomalies above against the original spreadsheet and relevant source revision.
5. Verify page/image references revision by revision before promoting records to the app-facing vocabulary collection.

## Preservation

The original `vocabulary_master.json` remains unchanged. No readings, translations, image references, page references, or app-facing index records were modified. No migration, production deployment, or PR merge was performed.
