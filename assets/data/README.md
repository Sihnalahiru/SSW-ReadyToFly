# Ground Handling Quiz + My Exam JSON Pack

## Build contents
- Vocabulary master: 623 entries from the supplied V8 workbook.
- Flashcards: 13 sets (12 x 50 + 23).
- Vocabulary quiz: 623 questions (12 x 50 + 23).
- Additional source-based practice: 31 questions:
  - 6 questions from the uploaded Japanese official sample-question handout (transcribed as sample-source questions; not a claim that these alone represent the full exam).
  - 5 airport-code questions from Ground Handling Part 2 with answers stated by the question/answer options and verified from the source.
  - 20 questions derived from Notes on Airport Operations.
- Combined quiz practice: 654 questions across 14 sets.
- My Exam: 1 unofficial mock paper containing 31 auto-graded questions.
- Part 1 worksheet: 29 original True/False statements preserved separately; its answer column is blank in the uploaded PDF, so answer keys remain PENDING and these statements are not included in auto-graded paper counts.
- Ground Handling Part 2 visual-dependent questions 06-15 are listed in `visual_question_pending.json`; they require page-image extraction and answer verification before inclusion.
- Duplicate sample PDF (`GH_Sample Questions_2(2).pdf`) was not counted twice.

## Files
- `vocabulary_master.json`
- `vocabulary_sets_50.json`
- `quiz_practice_sets.json`
- `exam_question_bank.json`
- `exam_papers.json`
- `my_exam_config.json`
- `wrong_answer_review.json`
- `source_review_part1.json`
- `visual_question_pending.json`
- `study_note_visual_map.json`
- `quiz_config.json`
- `BUILD_SUMMARY.json`

## Integration
Place the JSON files in `assets/data/generated/` (or update app paths accordingly).
Image references in `study_note_visual_map.json` are repository-relative. A portion of legacy image paths still requires final path reconciliation; do not mark all study-note images as verified until that audit is complete.

## Exam mode constraints
The paper is an unofficial practice mock, not an official exam paper. The uploaded files do not establish a verified official exam duration or complete exam blueprint, so the timer is not enabled and official equivalence is not claimed. Japanese/furigana display is retained where available; romaji and Sinhala translations are hidden in exam mode.


## Updated My Exam build
- My Exam uses all 654 questions in the combined bank.
- 13 non-overlapping unofficial practice papers are generated.
- Paper counts: 12 papers x 50 questions, final paper 54 questions.
- 623 vocabulary questions are reused from Quiz Practice.
- 31 source-based questions are reused from the uploaded-source question bank.
- No question repeats across papers.
- Official exam duration is unverified; timer is disabled.
- Vocabulary recognition items retain English answer choices from the original quiz format.
