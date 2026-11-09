# Progress Sync Account-Isolation Fix — Implementation Note
Date: 2026-11-09
Branch: `feature/zero-cost-auth-autosave-v2`
Status: STATIC IMPLEMENTATION COMPLETE; BROWSER/D1 RUNTIME TESTS PENDING.

## Change

Updated `public/app.js` to address the account-transition race identified in `AUTH_PROGRESS_LIFECYCLE_EDGE_CASE_AUDIT_2026-11-09.md`.

1. A single shared `savePromise` is returned to concurrent flush callers. Sign-out therefore waits for the active flush instead of receiving an immediate `false` while another flush is running.
2. The flush captures the initiating `userId` and uses explicit per-user queue/cache keys throughout its operation.
3. After each asynchronous API request, the flush verifies that the same account is still active before reading or mutating local queue state.
4. Queue cleanup compares the current value with the exact uploaded value, preserving a newer edit made while the batch was in flight.
5. If a successful snapshot leaves newer queued edits, a follow-up flush is scheduled. Failed network flushes are not put into an automatic tight retry loop.
6. `loadProgress()` captures the account ID and ignores a late response if the active account has changed.

## Scope and preservation

- No study content, question bank, vocabulary data, account records, or D1 migrations changed.
- No storage keys were renamed; existing per-user queue/cache data remains readable.
- No queue/cache is deleted at logout.
- No production deployment or D1 operation was performed.

## Static verification

- Reviewed the updated function block on the feature branch.
- Confirmed the existing sign-out handler still awaits `flushProgress()` before calling the logout endpoint and clearing `currentUser`.
- Confirmed the flush uses the captured account key for queue reads, writes, and cache writes.
- Confirmed the server endpoint still scopes writes to the authenticated session user ID.

## Required runtime tests — not yet performed

1. Delay an in-flight PUT, click sign-out, and confirm logout waits for the same flush promise.
2. While a PUT is delayed, save a newer value for the same key; confirm the newer value remains queued and is sent in the follow-up pass.
3. Use two test accounts with identical progress keys and values; confirm no queue is read/deleted across accounts.
4. Force a failed PUT; confirm pending queue is retained and there is no automatic retry loop.
5. Test offline/online recovery, iOS Safari background/pagehide, and browser storage quota/security exceptions.
6. Confirm D1 rows remain separated by `user_id`.

This is a source-level fix only. It is not a claim of browser, concurrency, or production verification.
