# SSW ReadyToFly — Master Source Repository

This repository is the source-of-truth workspace for the Japan SSW Airport Ground Handling study project.

## Repository purpose

- Preserve original source materials and their filenames.
- Store verified syllabus, lesson, activity, vocabulary, question, answer, and media data.
- Keep audit evidence and validation reports alongside the data they describe.
- Keep the legacy/old syllabus distinct from any future revised syllabus.
- Provide traceable source references for the companion study application.

## Current repository status

This README establishes the repository structure and working rules. It does **not** certify that the study content or audits are complete.

| Area | Status |
|---|---|
| Existing uploaded assets | Present under `assets/`; inventory pending |
| Source-document inventory | Pending verification |
| Syllabus and lesson extraction | Pending source-by-source audit |
| Structured study data (JSON) | Pending validation |
| Question and answer bank | Pending source verification |
| Media-to-content mappings | Pending; do not infer relationships |
| Audit and validation reports | Pending |
| Companion app integration | Managed separately in the app repository |

## Intended directory structure

```text
SSW-ReadyToFly/
├── README.md
├── assets/
│   ├── animations/
│   ├── images/
│   ├── audio/
│   └── source-documents/
├── sources/
│   ├── syllabus/
│   ├── textbooks/
│   └── official-references/
├── data/
│   ├── syllabus/
│   ├── lessons/
│   ├── vocabulary/
│   ├── questions/
│   └── mappings/
├── audits/
│   ├── source-inventory/
│   ├── content-validation/
│   └── media-mapping/
├── schemas/
└── validation/
```

Directories will be added when their contents are ready; empty or placeholder folders are not evidence that content has been completed.

## Evidence and data rules

1. Use official or user-supplied source material as the basis for extracted study content.
2. Preserve original filenames, page references, terminology, and source order.
3. Never fabricate missing text, answers, page numbers, audio links, or media associations.
4. Mark unsupported or uncertain fields as `PENDING` and explain what evidence is missing.
5. Keep each syllabus version separate; do not silently merge old and revised material.
6. Validate JSON syntax and schema before marking a data file verified.
7. Record audit scope, counts, exceptions, and validation date in each report.
8. Do not include QR-code content in study media unless the project owner explicitly changes that rule.

## Completion standard

A section is complete only when its source files are inventoried, extracted data is traceable to those sources, mappings are evidenced, validation passes, and the corresponding audit report records the result.

The presence of a file in GitHub alone does not mean it has been audited or verified.
