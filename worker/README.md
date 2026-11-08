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

- POST `/api/auth/register` — create a username/password account and return a one-time recovery code.
- POST `/api/auth/login` — sign in with username and password.
- POST `/api/auth/recover-password` — reset the password using username and recovery code; rotate the recovery code and revoke all active sessions.
- GET `/api/auth/me` — restore the current session.
- POST `/api/auth/logout` — revoke the current session.
- GET/PUT `/api/progress` — read/write private progress items scoped to the authenticated user.

## Security design

- Passwords use PBKDF2-HMAC-SHA-256 with 310,000 iterations and a per-user random salt.
- Recovery codes contain 128 bits of cryptographically secure randomness. Only a SHA-256 hash is stored in D1.
- A recovery code is single-use: successful recovery rotates it and invalidates every active session.
- Recovery codes are returned only at account creation and successful recovery. The UI displays each code once and does not store it in browser storage.
- Session tokens are random and stored only as SHA-256 hashes. Session cookies are Secure, HttpOnly and SameSite=Lax.
- CSRF tokens are validated against a hash stored in D1.
- Login, registration and recovery attempts are rate-limited in D1.
- API responses use no-store caching.
- Source learning data remains in GitHub. Personal progress is stored in D1 and scoped to the authenticated user.

## Existing D1 compatibility

The existing `users.email` column is NOT NULL in the deployed schema. Username-only accounts therefore receive a reserved `.invalid` internal address (for example, `student@accounts.readytofly.invalid`) solely to satisfy the legacy column. It is never used to send or receive email. The app exposes usernames, not this internal value.

The live D1 users table was checked and contained zero accounts before this migration. The migration adds nullable username and recovery hash columns and unique indexes without deleting existing tables or progress data.

## Deployment

1. Confirm the `DB` binding points to `readytofly-db`.
2. Apply `migrations/0003_username_recovery_auth.sql` to the remote D1 database.
3. Deploy the Worker and PWA assets.
4. Test account creation, sign-in, one-time recovery-code rotation, logout and two-user progress isolation.
5. Remove any old `EMAIL` binding from the Worker dashboard; email is no longer used.

Example Wrangler commands from the repository root:

```bash
npx wrangler d1 migrations apply readytofly-db --remote
npx wrangler deploy
```

Do not manually run the new migration in D1 Console and then run Wrangler migrations without first reconciling migration history. Use one migration application method consistently.

## Limitations

- If a user loses both their password and their current recovery code, the account cannot be recovered through this self-service flow. Keep the recovery code offline and private.
- End-to-end tests against the live Cloudflare account must be completed before public launch.
- Configure Cloudflare WAF/rate limiting and monitor authentication endpoints before public launch.
