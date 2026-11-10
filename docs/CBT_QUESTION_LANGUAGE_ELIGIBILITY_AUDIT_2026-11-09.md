# CBT Question-Level Language Eligibility Audit

**Date:** 2026-11-09  
**Branch:** `feature/zero-cost-auth-autosave-v2`  
**Source:** `assets/data/exam_question_bank.json`  
**Scope:** Read-only audit of all existing 654 question records. The source JSON and all 14 paper manifests were left unchanged.

## Decision summary

| Eligibility class | Count | Decision |
|---|---:|---|
| `JA_ONLY` | 0 | No question is certified for Japanese-only CBT from the current metadata. |
| `EN_ONLY` | 0 | No question is certified for English-only CBT from the current metadata. |
| `PENDING` | 654 | All records require language-field, answer-key, and source review before CBT inclusion. |

This is a conservative **certification** result, not a claim that all 654 records are unusable. The bank has no explicit `language` field on any record. Script detection alone is insufficient to certify a CBT language mode, particularly where Japanese prompts, English option labels, and separate Japanese/English/Sinhala metadata fields coexist.

## Structural inventory

- Total records: **654**
- Source type `existing_quiz_vocabulary_bank`: **623**
- Source type `uploaded_sample_or_notes`: **31**
- Types: **648** single-choice, **5** true/false, **1** short-answer
- Exact question text `Select the correct English meaning.`: **623**
- Missing option arrays / empty options: **1** (`SMP-05`, short-answer)
- Non-empty option sets where `correct_answer` does not equal any `options[].value`: **20** (`OPS-01`–`OPS-20`)
- Missing both `source` and `source_vocabulary_id`: **0**
- Explicit `language` metadata: **0** records

## Candidate cohorts (not approved)

### Cohort A — vocabulary recognition (623)

IDs: `GH-VOCAB-01-Q01` through `GH-VOCAB-13-Q23` (623 records; exact IDs remain in the source bank).

- Prompt is the English instruction “Select the correct English meaning.”
- Each record has a Japanese term and furigana field, and English option labels.
- Therefore these are **English-instruction vocabulary-recognition candidates**, not verified English-only CBT questions. Japanese source terms are part of the question data, and source/answer correctness has not been independently checked against the relevant revision of the source material.
- Do not simply hide Japanese fields and label the remaining question English-only without defining and testing the intended exam presentation.

### Cohort B — sample / uploaded-source records (31)

IDs: `SMP-01`, `SMP-02`, `SMP-03`, `SMP-04`, `SMP-05`, `SMP-06`, `PR-01`, `PR-02`, `PR-03`, `PR-04`, `PR-05`, `OPS-01`, `OPS-02`, `OPS-03`, `OPS-04`, `OPS-05`, `OPS-06`, `OPS-07`, `OPS-08`, `OPS-09`, `OPS-10`, `OPS-11`, `OPS-12`, `OPS-13`, `OPS-14`, `OPS-15`, `OPS-16`, `OPS-17`, `OPS-18`, `OPS-19`, `OPS-20`.

- Mixed content includes Japanese-script prompts, English prompts/answer content, and Japanese option symbols (○/×).
- 11 records contain Japanese script in the question field; 4 records have Japanese-script option labels (including ○/×).
- The Japanese text, English translations, explanations, and source references are not consistently sufficient to certify either language mode.
- `SMP-05` is short-answer and has no options; it needs a distinct interaction type and source/image check.
- Airport-code questions use Japanese prompts and Latin airport-code options; this is not automatically an English-only or Japanese-only question.

### Cohort C — OPS answer-key blockers (20)

IDs: `OPS-01`, `OPS-02`, `OPS-03`, `OPS-04`, `OPS-05`, `OPS-06`, `OPS-07`, `OPS-08`, `OPS-09`, `OPS-10`, `OPS-11`, `OPS-12`, `OPS-13`, `OPS-14`, `OPS-15`, `OPS-16`, `OPS-17`, `OPS-18`, `OPS-19`, `OPS-20`.

- The stored `correct_answer` does not match any `options[].value` for all 20 records.
- Keep these out of scored CBT until the key is reconciled against the source.
- Do not auto-correct by guessing the intended option.

## Required release gates

1. Add explicit, audited language metadata at the **record and field level** (question, options, answer, explanation); do not infer from script alone.
2. Verify each record against the correct source revision and page/figure evidence.
3. Reconcile all 20 OPS answer keys against source evidence.
4. Verify the 623 vocabulary-derived prompts and the referenced vocabulary records; distinguish vocabulary drills from exam-style questions.
5. Confirm how `SMP-05` should be rendered and verify its referenced figure.
6. Re-run paper-reference integrity checks for all 14 unofficial papers after eligibility review.
7. Only then promote individually approved records to the relevant app-facing collection.

## Preservation

No source question, option, answer, explanation, paper reference, vocabulary record, or image mapping was edited. No records were promoted to `JA_ONLY` or `EN_ONLY`. No migration, production deployment, or PR merge was performed.
