# CBT Question Bank Audit — 2026-11-08

## Scope and source files
- `assets/data/exam_question_bank.json` — blob SHA: `d23d287c93e8659049e732e67d1c106b97b10bbb`
- `assets/data/exam_papers.json` — blob SHA: `a2d02872328df57b487405ffda37fdb1167ea259`
- Audit method: structural JSON inspection, field completeness checks, answer-key-to-option matching, language-script screening, paper-reference integrity checks.
- This is a structural/language screening audit. It is **not** a source-PDF content certification or a Japanese translation/readings verification.

## Inventory
| Check | Result |
|---|---:|
| Question bank declared total | 654 |
| Actual question records | 654 |
| Vocabulary-bank inherited records | 623 |
| Uploaded-source/sample records | 31 |
| Question types | 5 true/false; 648 single-choice; 1 short-answer |
| Practice papers | 14 |
| Paper question references | 654 |
| Duplicate paper references | 0 |
| Missing paper references | 0 |
| Paper sizes | 13 × 50 questions; final paper 4 questions |
| Paper timer | Disabled / duration pending on all 14 papers |

## Language screening
- No explicit language-mode field exists in any of the 654 records.
- 623/654 vocabulary records use the prompt “Select the correct English meaning.” and English-labelled answer options. These records are **not eligible** for strict Japanese-only mode in their current form.
- 11/31 source/sample questions contain Japanese script in the question text.
- 22/31 source/sample questions contain Latin-script English in the question text.
- Source/sample records use English explanations. The current bank does not provide a complete, verified Japanese question + Japanese answer + Japanese explanation set.
- The vocabulary records carry Japanese headwords and furigana, but that does not make the question/answer interaction Japanese-only.

## Structural / answer-key findings
- Records with missing/empty question text: 0.
- Records with missing correct_answer: 0.
- Records with missing/empty explanation: 0.
- Records with missing source field: 623 (the 623 inherited vocabulary records use source_vocabulary_id and study_page_refs instead).
- Records with missing/empty options: 1 (SMP-05). These require a short-answer renderer or verified conversion; do not silently treat them as MCQ.
- Records whose correct_answer does not match any option.value: 20 (OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06, OPS-07, OPS-08, OPS-09, OPS-10, OPS-11, OPS-12, OPS-13, OPS-14, OPS-15, OPS-16, OPS-17, OPS-18, OPS-19, OPS-20). These are answer-key schema mismatches; normalize only after source verification.
- Vocabulary records have no standalone source field; their provenance is via source_vocabulary_id and study_page_refs.
- Visual references are sparse/uneven and are not certified by this audit.

## Existing paper rules conflict
The 14 paper records are explicitly classified as **unofficial practice papers**, not official exam papers. Their current rules include:
- `english_answer_choices_for_vocabulary_recognition: true`
- `show_romaji: false`, `show_sinhala_translation: false`, `show_english_translation: false`
- Timer disabled pending verified duration.

The English answer-choice rule conflicts with the newly frozen strict Japanese-only CBT mode. Preserve these paper definitions as legacy data; do not activate them as Japanese-only mode without a reviewed language-safe question set. Do not assign official exam timing to the 50-question papers.

## CBT readiness decision
| Mode | Current status | Reason |
|---|---|---|
| Japanese-only official-style mode | BLOCKED / PENDING | No complete verified Japanese-only set; 623 vocabulary prompts/options are English; explanations are English; Japanese furigana field is null for the 31 source/sample records. |
| English-only international mode | PARTIAL / PENDING | Some source/sample records are English, but the bank is mixed-language and needs record-by-record language purity and answer-key validation. |
| Existing 14 practice papers | STRUCTURALLY LINKED; LANGUAGE REVIEW REQUIRED | All references resolve with no duplicates, but legacy paper rules explicitly allow English vocabulary choices. |

## Required next actions
1. Preserve the existing 654 records and all 14 paper definitions unchanged during this audit phase.
2. Build a question-level audit manifest with explicit mode eligibility: `JA_ONLY`, `EN_ONLY`, or `PENDING`; do not infer translations.
3. Verify all 31 source/sample questions against their cited source PDFs, including exact wording, correct answers, and source page.
4. Resolve the 20 answer-key mismatches and the 1 short-answer record using source evidence.
5. For vocabulary records, source and verify separate Japanese-language exam-style prompts/options and English-only prompt/options before marking either mode eligible. Do not translate automatically and mark as verified.
6. Keep official No. 1 simulation format (30 written / 45 min; 15 practical / 30 min; each section independently passes at 20/30 and 10/15) separate from these unofficial 50-question papers.

## Integrity statement
No question bank or paper content was changed by this audit. All existing questions, answer keys, paper references, and source metadata remain preserved. No new translations, questions, answers, or mappings were invented.
