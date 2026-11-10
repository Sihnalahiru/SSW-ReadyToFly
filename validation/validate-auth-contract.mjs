import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const worker = await readFile('worker/src/index.js', 'utf8');
const baseMigration = await readFile('migrations/0001_auth_and_progress.sql', 'utf8');
const usernameMigration = await readFile('migrations/0003_username_recovery_auth.sql', 'utf8');
const resetMigration = await readFile('migrations/0004_admin_password_reset.sql', 'utf8');

const checks = [
  ['registration route', /path === "\/api\/auth\/register"/.test(worker)],
  ['login route', /path === "\/api\/auth\/login"/.test(worker)],
  ['duplicate username protection', /UNIQUE constraint failed/.test(worker) && /COLLATE NOCASE/.test(worker)],
  ['four-account database-level cap', /SELECT COUNT\(\*\) FROM users\) < 4/.test(worker)],
  ['admin username reserved', /configuredAdmin && username === configuredAdmin/.test(worker)],
  ['PBKDF2 password hashing', /PBKDF2/.test(worker) && /310000/.test(worker)],
  ['secure session cookie flags', /Secure; SameSite=Lax/.test(worker) && /HttpOnly/.test(worker)],
  ['reset request route', /path === "\/api\/auth\/reset-request"/.test(worker)],
  ['reset status route', /path === "\/api\/auth\/reset-status"/.test(worker)],
  ['reset completion route', /path === "\/api\/auth\/complete-admin-reset"/.test(worker)],
  ['admin reset review route', /path === "\/api\/admin\/reset-review"/.test(worker)],
  ['admin reset CSRF validation', /csrfValid\(request, session\)/.test(worker)],
  ['reset approval expiry', /20 \* 60 \* 1000/.test(worker)],
  ['previous sessions revoked', /DELETE FROM sessions WHERE user_id=\?/.test(worker)],
  ['Telegram bot secret required', /TELEGRAM_BOT_TOKEN/.test(worker) && /TELEGRAM_ADMIN_CHAT_ID/.test(worker)],
  ['Telegram API response body verified', /telegramResult\.ok === true/.test(worker)],
  ['reset-status throttling', /rateLimited\(env, rateKey, 60\)/.test(worker)],
  ['reset-completion throttling', /rateLimited\(env, rateKey, 8\)/.test(worker)],
  ['base users schema preserves legacy email constraint', /email TEXT NOT NULL UNIQUE/.test(baseMigration)],
  ['username migration is additive', /ALTER TABLE users ADD COLUMN username TEXT/.test(usernameMigration)],
  ['recovery hash migration is additive', /ALTER TABLE users ADD COLUMN recovery_code_hash TEXT/.test(usernameMigration)],
  ['reset requests table migration', /CREATE TABLE IF NOT EXISTS password_reset_requests/.test(resetMigration)],
  ['auth audit table migration', /CREATE TABLE IF NOT EXISTS auth_audit_log/.test(resetMigration)],
  ['reset migration contains no destructive DDL', !/\bDROP\s+TABLE\b|\bDROP\s+COLUMN\b|\bDELETE\s+FROM\s+users\b/i.test(resetMigration)]
];

for (const [name, passed] of checks) {
  assert.equal(passed, true, `FAIL ${name}`);
  console.log(`PASS ${name}`);
}
console.log(`ReadyToFly auth contract validation passed (${checks.length} checks). Live D1, Telegram delivery and browser E2E tests remain separate.`);
