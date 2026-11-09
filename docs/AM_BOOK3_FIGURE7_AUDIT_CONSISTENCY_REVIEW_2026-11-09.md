# AM Book 3 Figure 7 — Audit-Artifact Consistency Review

**Date:** 2026-11-09  
**Scope:** Cross-check the six existing Figure 7 audit JSON artifacts for overlapping counts, status wording, and claim boundaries. This review does not re-open the PDF or modify the source assets.

## Reconciled evidence

| Evidence item | Current defensible status | Basis |
|---|---|---|
| Figure 7 subject on physical pages 11–13 | VERIFIED | Existing full-page context and PDF placement audit |
| Page 11 page-level component groups | VERIFIED | Rudder, Elevator, Horizontal Stabilizer, Vertical Stabilizer |
| Page 11 two specific arrow callouts | VERIFIED | Full-page diagram evidence for Rudder and Elevator |
| Page 12–13 page-level label-to-component relationships | 14 VERIFIED | Existing page-level mapping artifact |
| Legible label text crops | 19 VERIFIED as text | Label-text verification update |
| All individual fragment-to-target / arrow endpoint associations | PENDING | 0 exact arrow endpoint mappings recorded |
| 30 small Japanese text crops to exact glyph association | PENDING | Source-page text exists, but per-crop association is not proven |
| 71 page 12–13 fragments classified by visual type | CLASSIFIED; target association PENDING | Fragment type inventory |

## Count reconciliation — do not add overlapping totals

- The 93 extracted fragments cover physical pages 11–13: 22 + 49 + 22.
- The 19 verified label-text assets are a subset of those 93 fragments.
- The 14 verified page 12–13 label-to-component mappings overlap with the 19 legible label-text assets; they are not additional independent assets.
- Page 11 has 4 page-level component groups and 2 specifically verified arrow callouts. The 22 page 11 fragments are not 22 independent callouts.
- The 30 Japanese crop assets are a subset of the 93 fragments and overlap the page 12–13 fragment inventory.
- The 71 page 12–13 assets equal 49 + 22 and are a subset of the 93 total.

## Status wording conflict found

The page 11 mapping artifact reports `remaining_fragment_identity_or_subfigure_role_pending: 0`, while the individual-fragment placement audit and label-text update report all 93 individual fragment-to-label/arrow associations as PENDING.

These statements can coexist only if the page 11 value is interpreted narrowly as **page-level group/role classification**, not individual arrow-endpoint verification. The master status must therefore retain:
- Page 11 page-level component groups: VERIFIED.
- Page 11 two identified callout arrows: VERIFIED.
- Any other per-fragment target association not explicitly evidenced: PENDING.
- Overall 93 individual arrow/target associations: PENDING (0 exact endpoint-to-component associations certified).

The page 11 field name is broader than the evidence supports and should not be used to claim that all individual fragment identities are fully resolved. The original JSON was not edited in this audit.

## Additional boundary checks

- The 31 Japanese terms/phrases are transcribed from the source page context; they are not 31 verified crop-to-glyph matches.
- OCR output is auxiliary and cannot override the source PDF text/page geometry.
- A label being readable does not prove the arrow endpoint or exact aircraft surface it identifies.
- Pixel matching proves an extracted asset is present in the PDF, not what instructional concept it teaches.

## Next verification sequence

1. Render the complete physical pages 11–13 and preserve original page coordinates.
2. Overlay each original crop's recorded PDF placement rectangle on its full page.
3. For each proposed mapping, record crop filename, page, bounding box, visible text, leader-line continuity, target component, and evidence status.
4. Promote only direct, unambiguous page-geometry matches. Leave ambiguous line intersections and partial glyph crops PENDING.
5. Reconcile the page 11 status wording in a future source-backed update; do not silently overwrite the historical audit.

## Preservation

No PDF, image, JSON source, label, or mapping was changed. No fabricated associations were added. No D1 migration, content import, production deployment, or PR merge was performed.
