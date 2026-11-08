const SESSION_DAYS = 7;
const PBKDF2_ITERATIONS = 310000;
const encoder = new TextEncoder();

function json(data, status = 200, headers = {}) {
  const outputHeaders = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "set-cookie" && Array.isArray(value)) {
      value.forEach(cookieValue => outputHeaders.append("Set-Cookie", cookieValue));
    } else outputHeaders.set(key, value);
  }
  return new Response(JSON.stringify(data), { status, headers: outputHeaders });
}

function cookieMap(request) {
  return Object.fromEntries((request.headers.get("Cookie") || "").split(";")
    .map(v => v.trim()).filter(Boolean).map(v => {
      const i = v.indexOf("=");
      return [v.slice(0, i), decodeURIComponent(v.slice(i + 1))];
    }));
}
function cookie(name, value, maxAge, httpOnly = true) {
  return name + "=" + encodeURIComponent(value) + "; Path=/; Max-Age=" + maxAge +
    "; Secure; SameSite=Lax" + (httpOnly ? "; HttpOnly" : "");
}
function clearCookie(name, httpOnly = true) { return cookie(name, "", 0, httpOnly); }
function randomToken(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function hex(buffer) {
  return [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function sha256(value) {
  return hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}
function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function passwordHash(password, saltHex) {
  const salt = saltHex
    ? Uint8Array.from(saltHex.match(/.{2}/g), b => parseInt(b, 16))
    : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS
  }, key, 256);
  return { salt: hex(salt), hash: hex(bits) };
}
function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function validUsername(value) {
  return typeof value === "string" && /^[a-z0-9._-]{3,32}$/.test(value);
}
function validPassword(value) {
  return typeof value === "string" && value.length >= 12 && value.length <= 128 &&
    /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
}
function generateRecoveryCode() {
  const raw = hex(crypto.getRandomValues(new Uint8Array(16))).toUpperCase();
  return {
    normalized: "RTF" + raw,
    display: "RTF-" + raw.match(/.{4}/g).join("-")
  };
}
function normalizeRecoveryCode(value) {
  if (typeof value !== "string") return "";
  const normalized = value.toUpperCase().replace(/[\s-]/g, "");
  return /^RTF[0-9A-F]{32}$/.test(normalized) ? normalized : "";
}
async function readJson(request, max = 12000) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > max) throw new Error("REQUEST_TOO_LARGE");
  const text = await request.text();
  if (text.length > max) throw new Error("REQUEST_TOO_LARGE");
  return JSON.parse(text);
}
function originAllowed(request, env) {
  const origin = request.headers.get("Origin");
  return !origin || origin === env.APP_ORIGIN;
}
async function csrfValid(request, session) {
  const cookies = cookieMap(request);
  const header = request.headers.get("X-CSRF-Token");
  if (!header || !cookies.rtf_csrf || header !== cookies.rtf_csrf) return false;
  return (await sha256(header)) === session.csrf_hash;
}
async function currentSession(request, env) {
  const token = cookieMap(request).rtf_session;
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    "SELECT s.id,s.user_id,s.csrf_hash,s.expires_at,u.username,u.disabled_at " +
    "FROM sessions s JOIN users u ON u.id=s.user_id " +
    "WHERE s.token_hash=? AND s.expires_at>? AND u.disabled_at IS NULL"
  ).bind(tokenHash, Date.now()).first();
  return row || null;
}
async function createSession(env, user) {
  const token = randomToken(32);
  const csrf = randomToken(24);
  const now = Date.now();
  const expires = now + SESSION_DAYS * 86400000;
  await env.DB.prepare(
    "INSERT INTO sessions(id,user_id,token_hash,csrf_hash,created_at,expires_at,last_seen_at) VALUES(?,?,?,?,?,?,?)"
  ).bind(crypto.randomUUID(), user.id, await sha256(token), await sha256(csrf), now, expires, now).run();
  return {
    sessionCookie: cookie("rtf_session", token, SESSION_DAYS * 86400),
    csrfCookie: cookie("rtf_csrf", csrf, SESSION_DAYS * 86400, false),
    user: { id: user.id, username: user.username, displayName: user.username, isAdmin: Boolean(env.ADMIN_USERNAME && user.username.toLowerCase() === String(env.ADMIN_USERNAME).trim().toLowerCase()) }
  };
}
async function rateLimited(env, key) {
  const now = Date.now();
  const row = await env.DB.prepare(
    "SELECT attempts,window_started_at,blocked_until FROM auth_rate_limits WHERE bucket_key=?"
  ).bind(key).first();
  if (!row || now - row.window_started_at >= 15 * 60 * 1000) {
    await env.DB.prepare(
      "INSERT INTO auth_rate_limits(bucket_key,attempts,window_started_at,blocked_until) VALUES(?,0,?,NULL) " +
      "ON CONFLICT(bucket_key) DO UPDATE SET attempts=0,window_started_at=excluded.window_started_at,blocked_until=NULL"
    ).bind(key, now).run();
    return false;
  }
  return Boolean(row.blocked_until && row.blocked_until > now) || row.attempts >= 8;
}
async function recordFailure(env, key) {
  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO auth_rate_limits(bucket_key,attempts,window_started_at,blocked_until) VALUES(?,1,?,NULL) " +
    "ON CONFLICT(bucket_key) DO UPDATE SET attempts=attempts+1"
  ).bind(key, now).run();
  const row = await env.DB.prepare(
    "SELECT attempts,window_started_at FROM auth_rate_limits WHERE bucket_key=?"
  ).bind(key).first();
  if (row && row.attempts >= 8 && now - row.window_started_at < 15 * 60 * 1000) {
    await env.DB.prepare("UPDATE auth_rate_limits SET blocked_until=? WHERE bucket_key=?")
      .bind(now + 15 * 60 * 1000, key).run();
  }
}

async function isAdminSession(session, env) {
  return Boolean(session && env.ADMIN_USERNAME &&
    session.username.toLowerCase() === String(env.ADMIN_USERNAME).trim().toLowerCase());
}
async function notifyAdminTelegram(env, message) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_ADMIN_CHAT_ID) {
    console.warn("Telegram notification skipped: secrets are not configured.");
    return false;
  }
  const response = await fetch("https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_ADMIN_CHAT_ID,
      text: message,
      disable_web_page_preview: true
    })
  });
  if (!response.ok) console.error("Telegram notification failed:", response.status);
  return response.ok;
}

async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";
  if (path.startsWith("/api/") && request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Allow": "GET, POST, PUT, OPTIONS" } });
  }
  if (!path.startsWith("/api/")) {
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return json({ service: "ReadyToFly Auth API", status: "ok" });
  }
  if (!env.DB) return json({ error: "DATABASE_NOT_CONFIGURED" }, 503);
  if (!originAllowed(request, env)) return json({ error: "ORIGIN_NOT_ALLOWED" }, 403);

  try {
    if (path === "/api/auth/register" && request.method === "POST") {
      const body = await readJson(request);
      const username = normalizeUsername(body.username);
      const password = body.password;
      if (!validUsername(username) || !validPassword(password)) {
        return json({
          error: "INVALID_REGISTRATION",
          message: "Username must be 3–32 characters using letters, numbers, dot, underscore or hyphen. Password must be 12–128 characters with uppercase, lowercase and a number."
        }, 400);
      }
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const rateKey = await sha256("register:" + ip);
      if (await rateLimited(env, rateKey)) {
        return json({ error: "TOO_MANY_ATTEMPTS", message: "Too many account creation attempts. Please wait 15 minutes." }, 429);
      }
      const existing = await env.DB.prepare("SELECT id FROM users WHERE username=? COLLATE NOCASE")
        .bind(username).first();
      if (existing) {
        await recordFailure(env, rateKey);
        return json({ error: "USERNAME_UNAVAILABLE", message: "That username is unavailable. Choose another one." }, 409);
      }
      const recovery = generateRecoveryCode();
      const recoveryHash = await sha256(recovery.normalized);
      const pw = await passwordHash(password);
      const id = crypto.randomUUID();
      const now = Date.now();
      // The legacy email column is NOT NULL in the existing D1 schema.
      // A reserved .invalid address keeps the schema compatible and is never used for messaging.
      const internalEmail = username + "@accounts.readytofly.invalid";
      await env.DB.prepare(
        "INSERT INTO users(id,email,display_name,password_hash,password_salt,email_verified,created_at,updated_at,username,recovery_code_hash) " +
        "VALUES(?,?,?,?,?,1,?,?,?,?)"
      ).bind(id, internalEmail, username, pw.hash, pw.salt, now, now, username, recoveryHash).run();
      await env.DB.prepare("DELETE FROM auth_rate_limits WHERE bucket_key=?").bind(rateKey).run();
      return json({
        ok: true,
        user: { id, username, displayName: username },
        recoveryCode: recovery.display,
        message: "Account created. Save your recovery code now; it will not be shown again."
      }, 201);
    }

    if (path === "/api/auth/login" && request.method === "POST") {
      const body = await readJson(request);
      const username = normalizeUsername(body.username);
      const password = String(body.password || "");
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const rateKey = await sha256("login:" + ip + ":" + username);
      if (await rateLimited(env, rateKey)) {
        return json({ error: "TOO_MANY_ATTEMPTS", message: "Too many sign-in attempts. Please wait 15 minutes." }, 429);
      }
      const user = validUsername(username)
        ? await env.DB.prepare(
            "SELECT id,username,password_hash,password_salt FROM users WHERE username=? COLLATE NOCASE AND disabled_at IS NULL"
          ).bind(username).first()
        : null;
      if (!user) {
        await passwordHash(password || "invalid-login", "00112233445566778899aabbccddeeff");
        await recordFailure(env, rateKey);
        return json({ error: "INVALID_CREDENTIALS", message: "Username or password is incorrect." }, 401);
      }
      const pw = await passwordHash(password, user.password_salt);
      if (!constantTimeEqual(pw.hash, user.password_hash)) {
        await recordFailure(env, rateKey);
        return json({ error: "INVALID_CREDENTIALS", message: "Username or password is incorrect." }, 401);
      }
      await env.DB.prepare("DELETE FROM auth_rate_limits WHERE bucket_key=?").bind(rateKey).run();
      const session = await createSession(env, user);
      return json({ ok: true, user: session.user }, 200, {
        "Set-Cookie": [session.sessionCookie, session.csrfCookie]
      });
    }

    if (path === "/api/auth/recover-password" && request.method === "POST") {
      const body = await readJson(request);
      const username = normalizeUsername(body.username);
      const suppliedCode = normalizeRecoveryCode(body.recoveryCode);
      const newPassword = body.newPassword;
      if (!validUsername(username) || !validPassword(newPassword) || !suppliedCode) {
        return json({
          error: "INVALID_RECOVERY_REQUEST",
          message: "Enter a valid username, recovery code and a password meeting the password requirements."
        }, 400);
      }
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const rateKey = await sha256("recovery:" + ip + ":" + username);
      if (await rateLimited(env, rateKey)) {
        return json({ error: "TOO_MANY_ATTEMPTS", message: "Too many recovery attempts. Please wait 15 minutes." }, 429);
      }
      const user = await env.DB.prepare(
        "SELECT id,username,recovery_code_hash FROM users WHERE username=? COLLATE NOCASE AND disabled_at IS NULL"
      ).bind(username).first();
      const suppliedHash = await sha256(suppliedCode);
      if (!user || !user.recovery_code_hash || !constantTimeEqual(suppliedHash, user.recovery_code_hash)) {
        await recordFailure(env, rateKey);
        return json({ error: "INVALID_RECOVERY", message: "Username or recovery code is incorrect." }, 401);
      }
      const replacement = generateRecoveryCode();
      const replacementHash = await sha256(replacement.normalized);
      const pw = await passwordHash(newPassword);
      const now = Date.now();
      const results = await env.DB.batch([
        env.DB.prepare(
          "UPDATE users SET password_hash=?,password_salt=?,recovery_code_hash=?,updated_at=? " +
          "WHERE id=? AND recovery_code_hash=?"
        ).bind(pw.hash, pw.salt, replacementHash, now, user.id, user.recovery_code_hash),
        env.DB.prepare(
          "DELETE FROM sessions WHERE user_id=? AND EXISTS " +
          "(SELECT 1 FROM users WHERE id=? AND recovery_code_hash=?)"
        ).bind(user.id, user.id, replacementHash),
        env.DB.prepare("DELETE FROM auth_rate_limits WHERE bucket_key=?").bind(rateKey)
      ]);
      const changed = results[0] && results[0].meta ? results[0].meta.changes : 0;
      if (!changed) {
        return json({ error: "INVALID_RECOVERY", message: "This recovery code has already been used. Try your newest recovery code." }, 401);
      }
      return json({
        ok: true,
        username: user.username,
        recoveryCode: replacement.display,
        message: "Password updated. Your previous recovery code is now invalid. Save this new code securely."
      });
    }


    if (path === "/api/auth/reset-request" && request.method === "POST") {
      const body = await readJson(request);
      const username = normalizeUsername(body.username);
      if (!validUsername(username)) return json({ error: "INVALID_USERNAME" }, 400);
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const rateKey = await sha256("admin-reset:" + ip + ":" + username);
      if (await rateLimited(env, rateKey)) {
        return json({ error: "TOO_MANY_ATTEMPTS", message: "Please wait before requesting another reset." }, 429);
      }
      const user = await env.DB.prepare(
        "SELECT id,username FROM users WHERE username=? COLLATE NOCASE AND disabled_at IS NULL"
      ).bind(username).first();
      // Return the same public response whether or not the username exists.
      const response = { ok: true, message: "If the account exists, an administrator will review the request." };
      if (!user) return json(response, 202);
      const recent = await env.DB.prepare(
        "SELECT id FROM password_reset_requests WHERE user_id=? AND status IN ('pending','approved') AND created_at>?"
      ).bind(user.id, Date.now() - 30 * 60 * 1000).first();
      if (recent) return json(response, 202);
      const id = crypto.randomUUID();
      const requestSecret = randomToken(32);
      const now = Date.now();
      await env.DB.prepare(
        "INSERT INTO password_reset_requests(id,user_id,request_secret_hash,status,created_at) VALUES(?,?,?,'pending',?)"
      ).bind(id, user.id, await sha256(requestSecret), now).run();
      await env.DB.prepare(
        "INSERT INTO auth_audit_log(id,user_id,action,request_id,created_at) VALUES(?,?, 'password_reset_requested', ?, ?)"
      ).bind(crypto.randomUUID(), user.id, id, now).run();
      await notifyAdminTelegram(env,
        "ReadyToFly password reset request\nUsername: " + user.username +
        "\nRequest ID: " + id + "\nOpen the ReadyToFly Admin Panel to approve or reject.");
      return json({ ...response, requestId: id, requestSecret }, 202);
    }

    if (path === "/api/auth/reset-status" && request.method === "POST") {
      const body = await readJson(request);
      if (typeof body.requestId !== "string" || typeof body.requestSecret !== "string") {
        return json({ error: "INVALID_REQUEST" }, 400);
      }
      const row = await env.DB.prepare(
        "SELECT id,status,expires_at FROM password_reset_requests WHERE id=? AND request_secret_hash=?"
      ).bind(body.requestId, await sha256(body.requestSecret)).first();
      if (!row) return json({ error: "REQUEST_NOT_FOUND" }, 404);
      if (row.status === "approved" && row.expires_at && row.expires_at <= Date.now()) {
        await env.DB.prepare("UPDATE password_reset_requests SET status='expired' WHERE id=? AND status='approved'")
          .bind(row.id).run();
        return json({ status: "expired" });
      }
      return json({ status: row.status, expiresAt: row.expires_at || null });
    }

    if (path === "/api/auth/complete-admin-reset" && request.method === "POST") {
      const body = await readJson(request);
      const { requestId, requestSecret, newPassword } = body;
      if (typeof requestId !== "string" || typeof requestSecret !== "string" || !validPassword(newPassword)) {
        return json({ error: "INVALID_RESET", message: "Enter a valid reset request and a password meeting the requirements." }, 400);
      }
      const row = await env.DB.prepare(
        "SELECT r.id,r.user_id,r.status,r.expires_at,u.username FROM password_reset_requests r " +
        "JOIN users u ON u.id=r.user_id WHERE r.id=? AND r.request_secret_hash=? AND u.disabled_at IS NULL"
      ).bind(requestId, await sha256(requestSecret)).first();
      if (!row || row.status !== "approved" || !row.expires_at || row.expires_at <= Date.now()) {
        return json({ error: "RESET_NOT_APPROVED", message: "This reset has not been approved or has expired." }, 403);
      }
      const pw = await passwordHash(newPassword);
      const now = Date.now();
      const results = await env.DB.batch([
        env.DB.prepare(
          "UPDATE users SET password_hash=?,password_salt=?,updated_at=? WHERE id=(" +
          "SELECT user_id FROM password_reset_requests WHERE id=? AND request_secret_hash=? AND status='approved' AND expires_at>?)"
        ).bind(pw.hash, pw.salt, now, row.id, await sha256(requestSecret), now),
        env.DB.prepare("UPDATE password_reset_requests SET status='completed',reviewed_at=? WHERE id=? AND status='approved' AND expires_at>?")
          .bind(now, row.id, now),
        env.DB.prepare("DELETE FROM sessions WHERE user_id=? AND EXISTS (SELECT 1 FROM password_reset_requests WHERE id=? AND status='completed')")
          .bind(row.user_id, row.id),
        env.DB.prepare("INSERT INTO auth_audit_log(id,user_id,action,request_id,created_at) VALUES(?,?, 'password_reset_completed', ?, ?)")
          .bind(crypto.randomUUID(), row.user_id, row.id, now)
      ]);
      const changed = results[1] && results[1].meta ? results[1].meta.changes : 0;
      if (!changed) return json({ error: "RESET_ALREADY_USED" }, 409);
      return json({ ok: true, message: "Password updated. All previous sessions have been signed out. Please sign in again." });
    }

    if (path === "/api/admin/reset-requests" && request.method === "GET") {
      const session = await currentSession(request, env);
      if (!session || !await isAdminSession(session, env)) return json({ error: "ADMIN_ONLY" }, 403);
      const rows = await env.DB.prepare(
        "SELECT r.id,u.username,r.status,r.created_at,r.reviewed_at,r.expires_at " +
        "FROM password_reset_requests r JOIN users u ON u.id=r.user_id " +
        "WHERE r.status IN ('pending','approved') ORDER BY r.created_at DESC LIMIT 100"
      ).all();
      return json({ requests: rows.results || [] });
    }

    if (path === "/api/admin/reset-review" && request.method === "POST") {
      const session = await currentSession(request, env);
      if (!session || !await isAdminSession(session, env)) return json({ error: "ADMIN_ONLY" }, 403);
      if (!await csrfValid(request, session)) return json({ error: "CSRF_CHECK_FAILED" }, 403);
      const body = await readJson(request);
      if (typeof body.id !== "string" || !["approve","reject"].includes(body.action)) {
        return json({ error: "INVALID_REVIEW" }, 400);
      }
      const now = Date.now();
      const status = body.action === "approve" ? "approved" : "rejected";
      const expiry = body.action === "approve" ? now + 20 * 60 * 1000 : null;
      const result = await env.DB.prepare(
        "UPDATE password_reset_requests SET status=?,reviewed_at=?,reviewed_by=?,expires_at=? WHERE id=? AND status='pending'"
      ).bind(status, now, session.username, expiry, body.id).run();
      const changed = result.meta ? result.meta.changes : 0;
      if (!changed) return json({ error: "REQUEST_ALREADY_REVIEWED" }, 409);
      const row = await env.DB.prepare(
        "SELECT r.user_id,u.username FROM password_reset_requests r JOIN users u ON u.id=r.user_id WHERE r.id=?"
      ).bind(body.id).first();
      await env.DB.prepare(
        "INSERT INTO auth_audit_log(id,user_id,actor_username,action,request_id,created_at) VALUES(?,?,?,?,?,?)"
      ).bind(crypto.randomUUID(), row?.user_id || null, session.username,
        body.action === "approve" ? "password_reset_approved" : "password_reset_rejected", body.id, now).run();
      return json({ ok: true, status, expiresAt: expiry });
    }

    if (path === "/api/auth/me" && request.method === "GET") {
      const session = await currentSession(request, env);
      if (!session) {
        return json({ authenticated: false }, 200, {
          "Set-Cookie": [clearCookie("rtf_session"), clearCookie("rtf_csrf", false)]
        });
      }
      return json({
        authenticated: true,
        user: { id: session.user_id, username: session.username, displayName: session.username, isAdmin: await isAdminSession(session, env) },
        csrfToken: cookieMap(request).rtf_csrf
      });
    }

    if (path === "/api/auth/logout" && request.method === "POST") {
      const session = await currentSession(request, env);
      if (session) {
        if (!await csrfValid(request, session)) return json({ error: "CSRF_CHECK_FAILED" }, 403);
        await env.DB.prepare("DELETE FROM sessions WHERE id=?").bind(session.id).run();
      }
      return json({ ok: true }, 200, {
        "Set-Cookie": [clearCookie("rtf_session"), clearCookie("rtf_csrf", false)]
      });
    }

    if (path === "/api/progress" && (request.method === "GET" || request.method === "PUT")) {
      const session = await currentSession(request, env);
      if (!session) return json({ error: "UNAUTHENTICATED" }, 401);
      if (request.method === "GET") {
        const rows = await env.DB.prepare(
          "SELECT record_key,payload_json,updated_at FROM study_progress WHERE user_id=? ORDER BY updated_at DESC"
        ).bind(session.user_id).all();
        return json({
          items: (rows.results || []).map(r => ({
            key: r.record_key, data: JSON.parse(r.payload_json), updatedAt: r.updated_at
          }))
        });
      }
      if (!await csrfValid(request, session)) return json({ error: "CSRF_CHECK_FAILED" }, 403);
      const body = await readJson(request, 20000);
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length > 100) return json({ error: "TOO_MANY_ITEMS" }, 400);
      const now = Date.now();
      const statements = [];
      for (const item of items) {
        const key = String(item.key || "");
        if (!/^[a-zA-Z0-9:_-]{1,120}$/.test(key)) return json({ error: "INVALID_PROGRESS_KEY" }, 400);
        const payload = JSON.stringify(item.data ?? null);
        if (payload.length > 8000) return json({ error: "PROGRESS_ITEM_TOO_LARGE" }, 400);
        statements.push(env.DB.prepare(
          "INSERT INTO study_progress(user_id,record_key,payload_json,updated_at) VALUES(?,?,?,?) " +
          "ON CONFLICT(user_id,record_key) DO UPDATE SET payload_json=excluded.payload_json,updated_at=excluded.updated_at"
        ).bind(session.user_id, key, payload, now));
      }
      if (statements.length) await env.DB.batch(statements);
      return json({ ok: true, saved: statements.length });
    }

    return json({ error: "NOT_FOUND" }, 404);
  } catch (error) {
    console.error("ReadyToFly API error:", error.message);
    const status = error.message === "REQUEST_TOO_LARGE" ? 413 : 500;
    return json({ error: status === 413 ? "REQUEST_TOO_LARGE" : "INTERNAL_ERROR" }, status);
  }
}

export default { fetch(request, env) { return handle(request, env); } };
