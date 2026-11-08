-- Email-free ReadyToFly username authentication and one-time recovery codes.
-- Additive only: preserves users, sessions, progress and all learning content.
-- Existing users table was verified empty before this migration.

ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN recovery_code_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
  ON users(username COLLATE NOCASE);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_recovery_code_hash
  ON users(recovery_code_hash);
