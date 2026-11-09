# Authentication & Progress Security Review — 2026-11-09

**Branch:** `feature/zero-cost-auth-autosave-v2`  
**Scope:** Static source review of Worker, auth migrations, and browser progress-sync implementation. No live D1 query, production request, migration, or deployment was performed.

## Changes made during this review

### Four-account registration limit

The frozen master specification requires four separate user accounts with server-side enforcement. Public registration previously had no total account cap. The registration INSERT now uses a conditional SQLite INSERT ... SELECT ... WHERE (SELECT COUNT(*) FROM users) < 4 RETURNING id. The count check is part of the INSERT statement, avoiding a separate count-then-insert race. When no row is inserted, the Worker returns ACCOUNT_LIMIT_REACHED (HTTP 409). The configured administrator username is also reserved from public self-registration.

**Important:** This does not delete or disable existing accounts. The actual current user count in live D1 has not been inspected. If live D1 already contains more than four accounts, the new registration path simply blocks further registrations.

## Static review findings

| Area | Finding | Status |
|---|---|---|
| Password storage | PBKDF2-HMAC-SHA-256, 310,000 iterations, random 16-byte salt | Present in code; runtime not tested |
| Session cookies | Secure, HttpOnly session cookie; SameSite=Lax; 7-day lifetime | Present in code |
| CSRF | CSRF cookie + request header + stored hash check for state-changing authenticated endpoints | Present in code |
| Session revocation | Password reset deletes all sessions for affected user | Present in code |
| Admin identity | Worker secret ADMIN_USERNAME; admin routes check authenticated session | Present in code |
| Admin self-registration | Configured admin username reserved | Fixed in branch |
| Account cap | Maximum four user rows for new registrations | Fixed in branch; live count unknown |
| Progress isolation | Progress queries and writes are scoped by authenticated session.user_id | Present in code |
| Progress payload | Maximum 100 items per request, key validation, 8,000-character per-record payload | Present in code |
| Reset notification | Telegram credentials read from Worker secrets; notification is best-effort | Present in code; not configured/verified |
| Audit trail | Reset request/review/completion and notification failure audit inserts | Present in code; live schema not verified |
| Browser auto-save | Queue, local cache, retry and sync infrastructure exists | Not integrated into current study/quiz/exam/vocabulary/progress modules |

## Remaining concerns / verification gates

1. **Live D1 schema and migration history are unverified.** Inspect d1_migrations, PRAGMA table_info(users), and PRAGMA table_info(syllabus_versions) in the Cloudflare dashboard before applying any migration. No migration should be applied from this review.
2. The reset-status and complete-reset endpoints rely on high-entropy request ID/secret pairs and have no separate rate-limit bucket in the current Worker. Add endpoint-level abuse controls before public launch if practical; do not weaken the existing secret validation.
3. Telegram delivery has not been tested because Worker secrets/configuration and a real notification were not verified in this source review.
4. The four-account limit counts all user rows, including disabled users. Confirm that this matches the intended account lifecycle before production launch; no account deletion or recycling behavior is implemented here.
5. Progress queue is not yet called by actual learning activities. Do not describe learning progress as auto-saving until study, vocabulary, quiz, and CBT modules emit verified progress updates.
6. No end-to-end browser, multi-user isolation, session-expiry, admin approval, concurrent registration, or D1 integration test was run.
7. The current PR must remain unmerged until the mergeable=false condition is understood and a complete verification pass is successful.

## Production safety

- No live D1 data was read or changed.
- No D1 migration was applied.
- No production Worker was deployed.
- No PR was merged.
- Existing study data and all 654 question records / 14 paper references were left unchanged.
- No paid services or paid upgrades were used.