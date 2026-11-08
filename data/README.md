# Study Data

This directory stores structured study content extracted from the Ground Handling source materials.

## Data rules

- Keep source wording and original sequence traceable.
- Preserve the source syllabus version; do not merge old and revised syllabi.
- Every published record must include a source reference.
- Unknown or unsupported fields must remain `null` or `PENDING`; never invent values.
- Do not mark a lesson, question, answer, translation, audio link, or image mapping verified without evidence.
- Keep source records and app-ready normalized data distinguishable.

## Planned collections

| Collection | File | Status |
|---|---|---|
| Syllabus catalogue | `catalog.json` | Structure created; source mapping pending |
| Lessons | `lessons/index.json` | Pending source extraction |
| Vocabulary | `vocabulary/index.json` | Pending source extraction |
| Questions | `questions/index.json` | Pending source extraction |
| Media mappings | `mappings/index.json` | Pending evidence-based mapping |

A collection index with zero records is an explicit empty/pending index, not a claim that the source contains no content.
