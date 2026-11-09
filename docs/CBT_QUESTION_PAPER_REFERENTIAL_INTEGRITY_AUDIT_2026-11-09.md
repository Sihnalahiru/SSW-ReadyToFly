# CBT Question and Practice Paper Referential Integrity Audit

**Date:** 2026-11-09  
**Branch:** `feature/zero-cost-auth-autosave-v2`  
**Files:** `assets/data/exam_question_bank.json`, `assets/data/exam_papers.json`  
**Method:** Parsed both JSON files and checked identifiers and paper references. This is a structural integrity check, not a source-content or answer-key certification.

## Verified structural results

| Check | Result |
|---|---:|
| Question records | 654 / declared 654 |
| Unique question IDs | 654 |
| Duplicate question IDs | 0 |
| Practice papers | 14 / declared 14 |
| Total paper question references | 654 |
| Unique paper question references | 654 |
| References missing from question bank | 0 |
| Question IDs not referenced by any paper | 0 |
| Duplicate references within a paper | 0 |

## Question record distribution

| Type | Count |
|---|---:|
| `true_false` | 5 |
| `single_choice` | 648 |
| `short_answer` | 1 |

| Source type | Count |
|---|---:|
| `existing_quiz_vocabulary_bank` | 623 |
| `uploaded_sample_or_notes` | 31 |

## Paper sizes

- `GH-MOCK-01` through `GH-MOCK-13`: 50 questions each.
- `GH-MOCK-14`: 4 questions.
- All 654 question IDs are referenced exactly once across the 14 papers.
- Every paper has `duration_minutes: null` and `duration_status: PENDING_NO_VERIFIED_EXAM_DURATION`.

## Important distinction

These checks prove that the JSON question IDs and paper references are internally consistent. They do **not** prove that the 654 questions are eligible for Japanese-only or English-only CBT, that every answer key is correct, or that the papers represent official exam papers. The existing language eligibility audit remains authoritative: all 654 records remain PENDING; 20 OPS answer mismatches and the `SMP-05` empty options case remain unresolved. The 14 papers remain unofficial practice material.

## Preservation

No question, answer, paper, duration, or reference was changed. No question was removed, added, or reassigned. No source verification status was upgraded. No D1 migration, production deployment, or PR merge was performed.