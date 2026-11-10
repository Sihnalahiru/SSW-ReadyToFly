# ReadyToFly Cloudflare Authentication

Cloudflare Worker authentication backend for the ReadyToFly SSW Ground Handling PWA.

## Architecture

- Worker entry: `worker/src/index.js`
- Static PWA assets: `public/`
- D1 database: `readytofly-db` (bind as `DB`)
- Authentication migration: `migrations/0001_auth_and_progress.sql`
- Username/recovery migration: `migrations/0003_username_recovery_auth.sql`
- No email provider, sender domain, or email binding is required.

## Authentication API

- POST `/api/auth/register` — create a username/password account. Password resets use the administrator-approved flow below.
- POST `/api/auth/login` — sign in with username and password.
- POST `/api/auth/reset-request` — submit a username-based password-reset request.
- POST `/api/auth/reset-status` — check a request using its browser-held request secret.
- POST `/api/auth/complete-admin-reset` — set a new password after administrator approval.
- GET `/api/admin/reset-requests` — list pending and approved requests for the administrator.
- POST `/api/admin/reset-review` — approve or reject a request with CSRF validation.
- GET `/api/auth/me` — restore the current session.
- POST `/api/auth/logout` — revoke the current session.
- GET/PUT `/api/progress` — read/write private progress items scoped to the authenticated user.

## Security design

- Passwords use PBKDF2-HMAC-SHA-256 with 310,000 iterations and a per-user random salt.
- Session tokens are random and stored only as SHA-256 hashes. Session cookies are Secure, HttpOnly and SameSite=Lax.
- CSRF tokens are validated against a hash stored in D1.
- Login, registration and password-reset request attempts are rate-limited in D1.
- Password reset requires administrator approval, expires after 20 minutes, and revokes all existing sessions after completion.
- Reset request notifications use Telegram on a best-effort basis; notification failure does not expose account existence or block request creation.
- API responses use no-store caching.
- Source learning data remains in GitHub. Personal progress is stored in D1 and scoped to the authenticated user.

## Existing D1 compatibility

The existing `users.email` column is NOT NULL in the deployed schema. Username-only accounts therefore receive a reserved `.invalid` internal address (for example, `student@accounts.readytofly.invalid`) solely to satisfy the legacy column. It is never used to send or receive email. The app exposes usernames, not this internal value.

The live D1 users table was checked and contained zero accounts before this migration. The migration adds nullable username and recovery hash columns and unique indexes without deleting existing tables or progress data.

## Deployment

1. Confirm the `DB` binding points to `readytofly-db`.
2. Reconcile the live D1 migration history and schema before applying migrations. Do not assume migrations 0001–0003 are unapplied simply because a table or column is absent.
3. Apply only the verified outstanding migrations using one consistent Wrangler migration workflow.
4. Configure the `ADMIN_USERNAME` Worker secret and optional Telegram secrets.
5. Deploy the Worker and PWA assets only after review and tests.
6. Test registration, sign-in, administrator approval, reset expiry, session revocation, logout and two-user progress isolation.
7. Remove any old `EMAIL` binding from the Worker dashboard only if it is no longer used by any deployed code.

Example Wrangler commands from the repository root:

```bash
npx wrangler d1 migrations apply readytofly-db --remote
npx wrangler deploy
```

Do not manually run the new migration in D1 Console and then run Wrangler migrations without first reconciling migration history. Use one migration application method consistently.

## Limitations

- If the administrator account is unavailable, password-reset requests cannot be approved until administrator access is restored.
- End-to-end tests against the live Cloudflare account must be completed before public launch.
- Configure Cloudflare WAF/rate limiting and monitor authentication endpoints before public launch.


## V2: Admin-approved password reset and Telegram notifications

The V2 branch adds:

- POST `/api/auth/reset-request` — submit a username-based reset request. The public response is generic to reduce account enumeration.
- POST `/api/auth/reset-status` — check a reset request using its high-entropy browser-held request secret.
- POST `/api/auth/complete-admin-reset` — set a new password only after admin approval; the approval expires after 20 minutes and prior sessions are revoked.
- GET `/api/admin/reset-requests` — admin-only request list.
- POST `/api/admin/reset-review` — admin-only approve/reject action with CSRF validation.
- Telegram sends a notification to the configured administrator chat. Telegram contains username and request ID only; it never contains passwords, reset secrets or approval tokens.
- The Admin Panel is visible only when the signed-in username matches the `ADMIN_USERNAME` Worker secret.

### Required Worker secrets

Set these in Cloudflare Worker Settings → Variables and Secrets (mark each as a secret):

- `ADMIN_USERNAME` — the exact username of the administrator's ReadyToFly account.
- `TELEGRAM_BOT_TOKEN` — token created with Telegram's official BotFather.
- `TELEGRAM_ADMIN_CHAT_ID` — private chat ID for the administrator's Telegram account.

Never commit these values to GitHub, frontend JavaScript, HTML, or screenshots. The administrator must create their own ReadyToFly account first. Do not share the Telegram bot token or password with anyone.

To obtain the Telegram chat ID: create a bot with BotFather, open the bot chat and press Start, send it a harmless message, then use Telegram's official bot API getUpdates response to identify the private chat ID. Keep the bot token private. A Telegram bot cannot initiate a private conversation until the user has started it.

### V2 migration safety

- New additive migration: `migrations/0004_admin_password_reset.sql`.
- It creates only `password_reset_requests` and `auth_audit_log`; it does not drop or rewrite users or study progress.
- **Do not apply this migration until the live D1 migration history and schema have been checked.** The repository's migration history and live D1 schema previously showed differences. Verify `d1_migrations`, `PRAGMA table_info(users)`, and existing migration files first.
- Apply migrations only through the agreed Wrangler migration workflow after the audit. Do not mix dashboard SQL execution with Wrangler migration application.
- Admin approval does not expose or set the user's password. The user creates their own password in the app after approval.

### Progress auto-save V2

The client now keeps a per-user pending progress queue in local storage, batches syncs to the existing authenticated `/api/progress` endpoint, retries when the browser returns online, and preserves the queue on logout if it could not sync. This is the storage/sync foundation. Study, quiz and vocabulary modules still need to call `ReadyToFlyProgress.save(key, value)` whenever verified learning state changes; the current placeholder modules do not yet emit those events. Do not describe all learning features as auto-saving until those module integrations are tested.

### Strict free-only operating policy

The application is designed to use the existing GitHub and Cloudflare free tiers and Telegram Bot API without paid add-ons. If a free quota is reached, pause the affected operation until the quota resets; do not automatically upgrade or enable billing. This is a project operating rule, not a guarantee that every third-party service will remain free forever. Monitor provider terms and limits. No paid fallback is permitted without the project owner's explicit change to this rule.
