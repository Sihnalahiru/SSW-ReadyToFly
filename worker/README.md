# ReadyToFly Cloudflare Authentication

This package is the first implementation slice for account registration, email verification, sign-in/out, password reset, and per-user study progress sync.

## Architecture

- Cloudflare Worker: `worker/src/index.js`
- Cloudflare D1: users, sessions, one-time email tokens, study progress
- D1 migration: `migrations/0001_auth_and_progress.sql`
- Wrangler config: `wrangler.toml`
- Transactional email: Resend API called from the Worker; API key is a Worker secret.

## Security choices

- Passwords are salted PBKDF2-HMAC-SHA-256 hashes (310,000 iterations); plaintext passwords are never stored.
- Session bearer tokens are random, stored only as SHA-256 hashes in D1, and sent in Secure, HttpOnly, SameSite=Lax cookies.
- CSRF protection is required on authenticated state-changing requests using a readable CSRF cookie, matching request header, and stored hash.
- Email verification and password reset tokens are random, hashed at rest, purpose-bound, single-use and expire.
- Password reset invalidates all active sessions.
- Progress queries and writes are always scoped by the authenticated session's user id.
- API responses are no-store; email enumeration is avoided on registration and password reset.
- Only same-origin browser requests are accepted when an Origin header is present.

## API routes

- POST `/api/auth/register` — { email, displayName, password }
- POST `/api/auth/verify` — { token }
- POST `/api/auth/login` — { email, password }
- GET `/api/auth/me`
- POST `/api/auth/logout`
- POST `/api/auth/forgot-password` — { email }
- POST `/api/auth/reset-password` — { token, password }
- GET/PUT `/api/progress` — authenticated per-user progress

## Configure and deploy

1. Create a D1 database: `npx wrangler d1 create readytofly-auth`.
2. Put the returned database id into `wrangler.toml`.
3. Set `APP_ORIGIN` to the exact deployed Pages origin (no trailing slash).
4. Set `MAIL_FROM` to a sender address verified with Resend.
5. Add the Resend secret: `npx wrangler secret put RESEND_API_KEY`.
6. Apply the migration: `npx wrangler d1 migrations apply readytofly-auth --remote`.
7. Deploy the Worker: `npx wrangler deploy`.
8. Add a Pages/Worker route or same-origin proxy so the frontend can call `/api/*` on the app origin.

Do not apply migrations to production until the D1 database id, environment and backup plan are confirmed. Keep a separate staging D1 database for testing.

## Important deployment blockers / hardening before public launch

- Configure Cloudflare rate limiting/WAF rules for register, login, verify, forgot-password and reset-password endpoints.
- Set a verified sending domain and test email deliverability.
- Configure the actual Pages origin and Worker route.
- Add automated tests for password handling, token expiry/reuse, session expiry, CSRF, origin validation and cross-user progress isolation.
- Review the password policy and operational monitoring.
- This repository commit does not create a Cloudflare D1 database, configure secrets, or deploy the Worker.

## Progress data contract

The client should use stable keys such as `lesson:<lesson-id>`, `vocabulary:<entry-id>`, `exam:<attempt-id>`. Do not send the entire study source library as user progress. Keep source content in the repository; only personal completion, bookmarks, notes and attempts belong in per-user progress.
