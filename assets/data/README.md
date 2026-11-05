# Ground Handling PWA — Quiz, My Exam & Vocabulary JSON Pack

## Files
- `vocabulary_master.json`: all 623 rows from the supplied V8 workbook, preserved as records.
- `vocabulary_sets_50.json`: 12 full sets of 50 and one final set of 23 for flip flashcards.
- `quiz_practice_sets.json`: 623 vocabulary recognition questions in 50-question practice sets.
- `study_note_visual_map.json`: 139 source page records, original study text and exact mapped image paths.
- `quiz_config.json`: practice display, linked study-note/image, auto-advance and progress-count behavior.
- `my_exam_config.json`: My Exam simulation behavior and official exam blueprint fields.
- `approved_exam_question_bank.json`: intentionally empty until official sample questions are supplied.
- `wrong_answer_review.json`: persistent wrong-answer review data contract.

## Suggested GitHub location
Place all files in `assets/data/generated/`. The image paths in the JSON are repository-relative and refer to existing `assets/data/Rev 1 Sinhala/...` image assets.

## Important
The uploaded archive contains study material and vocabulary, not an official sample-question bank or verified exam blueprint. Therefore the JSON does **not** invent official exam question counts, section counts, duration, or scoring. My Exam settings are ready, but official paper generation must consume verified question records in `approved_exam_question_bank.json`.

Practice quiz questions are vocabulary-meaning drills, not official exam questions. In practice mode, show Japanese, furigana, romaji, English and Sinhala, and load linked study notes/images when an exact mapping exists. In My Exam mode, show Japanese with furigana; hide romaji and translations, except English support for foreign/loan words as configured.

## Validation
All JSON files are UTF-8 and parse successfully. Vocabulary rows are retained in workbook order. Decks are sequential and non-overlapping.
