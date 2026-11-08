# ReadyToFly Cloudflare Authentication

Cloudflare Worker authentication backend for the ReadyToFly SSW Ground Handling PWA.

## Architecture

- Worker entry: `worker/src/index.js`
- Static PWA assets: `public/`
- D1 database: `readytofly-db` (bind as `DB`)
- Migration: `migrations/0001_auth_and_progress.sql`
- Transactional email: Cloudflare Email Service binding `EMAIL`

## Implemented API

- POST `/api/auth/register` — create an account and send email verification
- POST `/api/auth/verify` — verify the single-use email token
- POST `/api/auth/login` — sign in with email and password
- GET `/api/auth/me` — restore the current session
- POST `/api/auth/logout` — revoke the current session
- POST `/api/auth/forgot-password` — request a password reset email
- POST `/api/auth/reset-password` — set a new password; revoke all sessions
- GET/PUT `/api/progress` — read/write private progress items scoped to the authenticated user

## Security design

- Passwords use PBKDF2-HMAC-SHA-256 with 310,000 iterations and a per-user random salt.
- Session tokens and email verification/reset tokens are random and stored only as SHA-256 hashes.
- Session cookies are Secure, HttpOnly and SameSite=Lax; the CSRF cookie is readable by the client and validated against a hash stored in D1.
- Email verification and reset tokens are purpose-bound, single-use and expire.
- Password reset invalidates every active session for that user.
- Progress records are always queried and written with the authenticated session's user id.
- Login failures are throttled in D1; API responses use no-store caching.
- Source learning data remains in GitHub. Only personal progress is stored in D1.

## Cloudflare configuration

The repository config uses the existing D1 database id recorded for `readytofly-db`. Before deploying:

1. Confirm the D1 database exists in the same Cloudflare account and that its ID matches `wrangler.toml`.
2. Onboard the email sending domain in Cloudflare Email Service and configure SPF, DKIM and DMARC.
3. Replace `APP_ORIGIN` with the exact production app origin (scheme + hostname, no trailing slash).
4. Replace `MAIL_FROM` with an authorized sender address on the onboarded domain.
5. Apply the migration to the intended D1 environment.
6. Deploy the Worker and test registration, verification, login, logout, password reset and two-user progress isolation.

Commands:

```bash
npx wrangler d1 migrations apply readytofly-db --remote
npx wrangler deploy
```

Do not deploy while the APP_ORIGIN or MAIL_FROM placeholders remain. Do not run the production migration until the database ID and target environment have been confirmed in the Cloudflare dashboard.

## Current limitations

- Cloudflare resources are not changed by GitHub commits. D1 migration, Email Service domain onboarding, bindings and Worker deployment still require Cloudflare-side setup.
- End-to-end tests against the live Cloudflare account have not yet been run.
- Study modules and their verified content are still being audited; progress sync infrastructure is ready for stable lesson, vocabulary and exam keys, but the study UI must emit progress events when those learning interactions are implemented.
- Configure Cloudflare WAF/rate limiting and monitor authentication endpoints before public launch.
