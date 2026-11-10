# ReadyToFly Authentication & Progress Lifecycle Edge-Case Audit
Date: 2026-11-09
Branch: `feature/zero-cost-auth-autosave-v2`
Scope: Static review of `worker/src/index.js`, `public/app.js`, and migrations `0001`, `0003`, `0004`.
Status: REPORT-ONLY. No application code, migration, D1 data, or production deployment changed.

## Executive result

The reviewed source has several sound controls: password hashing uses PBKDF2-HMAC-SHA-256 (310,000 iterations); session tokens are random and stored as hashes; session cookies are Secure/HttpOnly/SameSite=Lax; mutating authenticated endpoints check a CSRF cookie/header against the session hash; progress rows are scoped by the authenticated session's user ID; and the account limit is enforced in the registration INSERT.

This is a static code review, not a live security certification. D1 schema/history, deployed Worker secrets, browser behavior, concurrent requests, and account isolation have not been runtime-tested.

## Findings

### F-01 — Progress sync can race an account transition
Severity: HIGH (potential cross-account queue handling / unsaved progress); runtime reproduction pending.

Evidence:
- `flushProgress()` uses module-global `saveInFlight` and repeatedly reads `currentUser` indirectly through `queueStorageKey()`, `readPendingQueue()`, and the cache key.
- It awaits each `api('progress', PUT)` batch, then re-reads and writes the pending queue using the then-current `currentUser`.
- The sign-out handler calls `await flushProgress()`, but `flushProgress()` immediately returns `false` when another flush already has `saveInFlight === true`; sign-out then proceeds to logout and clears `currentUser`.
- A subsequent sign-in can change `currentUser` while the original flush is still unwinding.

Impact:
- The original flush can inspect or modify the newly signed-in account's local queue after an await, including deleting same-key/same-value entries from that queue.
- Subsequent batches may run with whichever session cookie is current at request time; a request after logout can fail, leaving the old account's queue unsent.
- This is a client-side lifecycle race. The server-side progress endpoint still scopes each accepted write to the session user ID, which limits server-side cross-account writes.

Safe remediation direction (not applied):
- Capture immutable `userId` and a session/account generation at flush start.
- Read/write only that captured user's queue/cache throughout the operation.
- Serialize account transitions against active flushes; do not treat an already-running flush as completed.
- Before each next batch, verify the same account generation is still active; otherwise stop without touching another account's local state.
- Add deterministic tests for sign-out during an in-flight PUT, rapid account switch, two accounts with identical progress keys/values, and retry after re-login.

### F-02 — Local-storage failures can interrupt progress persistence
Severity: MEDIUM; browser/device behavior pending.

Evidence:
- `writePendingQueue()`, `saveProgress()`, cache writes in `loadProgress()` and `flushProgress()`, and theme persistence call `localStorage.setItem()`.
- Some reads are guarded by `try/catch`, but writes in the save path are not consistently guarded.
- Browser storage can throw (for example, quota exhaustion or storage restrictions).

Impact:
- A storage exception can reject a save before it is queued/scheduled, or interrupt a flush after the server accepted a batch.
- User-facing study modules are not yet integrated with this save API, so practical learning-data impact must be tested after integration.

Safe remediation direction (not applied):
- Wrap storage operations and surface an explicit “local save unavailable” state.
- Do not report a change as safely queued when persistence failed.
- Add tests with storage methods throwing and with quota-like failures.

### F-03 — Reset-status and reset-completion endpoints have no dedicated rate-limit bucket
Severity: LOW–MEDIUM; static observation.

Evidence:
- `reset-request` has an IP+username 15-minute attempt bucket.
- `reset-status` and `complete-admin-reset` validate a request ID plus a 256-bit random secret (stored as a SHA-256 hash), but do not use a separate rate-limit bucket.
- The completion endpoint also requires a valid password and an approved, unexpired request; the reset is one-time and the previous sessions are deleted.

Impact:
- The high-entropy secret makes blind guessing impractical. Nevertheless, the endpoints can be called repeatedly by a party already holding a request ID/secret, and they are not independently throttled.
- No evidence in this static review establishes practical exploitability.

Safe remediation direction (not applied):
- Consider lightweight per-IP and per-request throttling with privacy-preserving keys and bounded cleanup.
- Keep reset status responses non-enumerating and do not log raw secrets.
- Test expiry, duplicate completion, parallel completion, and repeated status polling.

### F-04 — Page-exit progress flush is best-effort only
Severity: MEDIUM; browser lifecycle limitation.

Evidence:
- The `pagehide` listener calls asynchronous `flushProgress()`.
- A browser may suspend or terminate the page before the fetch completes; the code does not use a completion guarantee.

Impact:
- Pending progress may remain in local storage until the next online/focus/sign-in retry. The page-exit event alone cannot guarantee delivery.

Safe remediation direction (not applied):
- Treat page-exit flushing as a best-effort retry, not a save guarantee.
- Prefer normal debounced/background saves while the page is active and show pending-sync status clearly.
- Verify browser behavior on iOS Safari and Android Chrome.

## Controls observed

- Password hashing: PBKDF2-HMAC-SHA-256, 310,000 iterations, 16-byte random salt.
- Session token: random 32-byte token; only SHA-256 hash stored in D1.
- CSRF: random token cookie plus request header, validated against the stored session hash.
- Session cookie: Secure, HttpOnly, SameSite=Lax; CSRF cookie is Secure, SameSite=Lax and readable by the app.
- Origin: requests with an Origin header are rejected unless it exactly matches `APP_ORIGIN`; requests without Origin are allowed.
- Registration: configured admin username is reserved; four-account cap is part of the INSERT statement.
- Progress API: requires a session; writes require CSRF; records are stored under the authenticated `session.user_id`; each item key and payload size are validated.
- Logout: attempts a progress flush before server logout, then clears in-memory user state. Per-user local queue/cache keys are intentionally retained by current code; whether to clear them on shared devices is a product/privacy decision, not changed here.

## Test plan required before sign-off

1. Create two test accounts; save different values under the same progress key; verify server and local data remain isolated.
2. Start a deliberately delayed progress PUT, sign out, sign in as the second account, then release the PUT; inspect both accounts' queues and D1 progress.
3. Repeat with 2+ batches and a network failure between batches.
4. Force localStorage get/set to throw; verify the UI does not claim “queued” or “saved”.
5. Test iOS Safari tab close/background, Android Chrome background, offline-to-online recovery, and reload with pending queue.
6. Test reset request for existing and non-existing usernames; confirm public responses do not reveal account existence.
7. Test reset expiry boundary, repeated status checks, two simultaneous completion requests, and old-session invalidation.
8. Verify Origin rejection, missing/wrong CSRF token, and unauthenticated progress access.
9. Inspect live D1 migration history and schema before any migration or data change.

## Explicitly not verified

- Live D1 migration history, table schema, current users, or progress rows.
- Production Worker environment variables/secrets, including `APP_ORIGIN`, `ADMIN_USERNAME`, and Telegram credentials.
- Telegram delivery.
- Cloudflare D1 transaction/batch behavior under real concurrent requests.
- Runtime browser behavior, cross-account race reproduction, and end-to-end auth tests.
- Whether the four-account cap should count disabled accounts.

## Decision

Do not merge or deploy based on this audit alone. F-01 should be addressed and tested before learning modules begin writing progress. All findings are documented without modifying application behavior or user data.
