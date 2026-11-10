# Aircraft Maintenance Books 1–3 Asset Inventory and Source-Reconciliation Audit

**Date:** 2026-11-09  
**Branch:** `feature/zero-cost-auth-autosave-v2`  
**Scope:** Recheck the live branch tree against the existing PDF/image reconciliation artifacts. This audit does not repeat or replace the pixel-comparison work in those artifacts.

## Live repository inventory

| Book | PDF physical pages (existing audit) | Image files in branch | JPG | PNG | Empty files |
|---|---:|---:|---:|---:|---:|
| Book 1 — Basic Skills | 26 | 42 | 23 | 19 | 0 |
| Book 2 — Occupational Safety and Maintenance Quality | 20 | 45 | 30 | 15 | 0 |
| Book 3 — Airplane General | 24 | 109 | 93 | 16 | 0 |
| **Total** | **70** | **196** | **146** | **50** | **0** |

All 196 image files are present in their expected book-specific directories in the inspected branch. No duplicate filenames were found within an individual book directory.

## Duplicate content and separation

- 196 file paths resolve to 190 unique Git blob contents.
- Three duplicate-blob groups were found, each containing the same file content in all three book folders:
  - `0.jpg`
  - Book 1 `1222.jpg`, Book 2 `44.jpg`, Book 3 `108.jpg`
  - Book 1 `3.jpg`, Book 2 `3.jpg`, Book 3 `2.jpg`
- These are cross-book byte-identical assets, not evidence that the books should be merged. They remain in their original folders and retain their original filenames.

## Existing source-PDF image reconciliation

The existing per-book audits report:
- Book 1: 42 exact decoded-pixel matches; 0 near; 0 unmatched; 0 missing.
- Book 2: 38 exact matches; 7 near-pixel-equivalent matches; 0 unmatched; 0 missing.
- Book 3: 108 exact matches; 1 near-pixel-equivalent match; 0 unmatched; 0 missing.

Combined: **188 exact + 8 near-equivalent = 196 accounted-for archive images**, with 0 reported unmatched and 0 missing.

This conclusion is limited to the existing image-to-PDF pixel-comparison evidence. It does not certify semantic meaning, captions, lesson relationships, or question/answer relationships.

## Figure 7 — Book 3 status retained

The existing reconciliation records:
- Page-level component groups and label-to-component mappings are partly verified.
- 19 legible label-text assets were recorded, but individual crop-to-glyph association remains pending.
- 30 Japanese text crops remain pending crop-to-glyph association.
- 93 arrow-endpoint mappings remain pending; 0 exact individual arrow-endpoint-to-component mappings were verified.
- Do not count overlapping crop, label, and component sets as independent totals.

## Promotion decision

**SOURCE IMAGE INVENTORY / PDF PRESENCE: VERIFIED BY EXISTING AUDITS AND BRANCH TREE RECHECK.**  
**SEMANTIC IMAGE-TO-TOPIC / ACTIVITY / QUESTION / ANSWER MAPPING: PARTLY VERIFIED OR PENDING; NOT PROMOTED BY THIS AUDIT.**

## Preservation and safety

No image, PDF, filename, folder, JSON record, or mapping was modified. All three Aircraft Maintenance books remain separate from one another and from Airport Ground Handling. No production deployment, D1 migration, data import, or PR merge was performed.
