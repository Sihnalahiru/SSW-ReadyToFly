-- ReadyToFly Authentication V2: admin-assisted password reset.
-- Additive only. Existing users, sessions and study progress are preserved.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_secret_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','approved','rejected','completed','expired')),
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER,
  reviewed_by TEXT,
  expires_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_reset_requests_status_created
  ON password_reset_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reset_requests_user_created
  ON password_reset_requests(user_id, created_at);

CREATE TABLE IF NOT EXISTS auth_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_username TEXT,
  action TEXT NOT NULL,
  request_id TEXT,
  created_at INTEGER NOT NULL,
  details_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_log(created_at);
