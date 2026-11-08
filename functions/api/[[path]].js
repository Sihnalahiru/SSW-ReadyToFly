const SESSION_COOKIE = "__Host-readytofly_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const RESET_SECONDS = 60 * 30;
const PBKDF2_ITERATIONS = 310000;
const encoder = new TextEncoder();

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...headers } });
}
function cookieValue(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}
function setCookie(value, maxAge = SESSION_SECONDS) {
  return `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}
function clearCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
function randomToken(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return [...data].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function toBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function fromBase64(value) {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
async function passwordHash(password, salt, iterations = PBKDF2_ITERATIONS) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: fromBase64(salt), iterations }, key, 256);
  return toBase64(new Uint8Array(bits));
}
function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function bodyJson(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 16000) throw new Error("Request too large");
  try { return await request.json(); } catch { throw new Error("Invalid JSON body"); }
}
function validEmail(email) {
  return typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validPassword(password) {
  return typeof password === "string" && password.length >= 10 && password.length <= 128 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
}
function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}
async function rateLimit(db, key, maxAttempts = 8, windowSeconds = 900) {
  const now = Math.floor(Date.now() / 1000);
  const row = await db.prepare("SELECT attempts, window_started_at, blocked_until FROM auth_rate_limits WHERE bucket_key = ?").bind(key).first();
  if (row?.blocked_until && row.blocked_until > now) return false;
  if (!row || now - row.window_started_at >= windowSeconds) {
    await db.prepare("INSERT INTO auth_rate_limits(bucket_key,attempts,window_started_at,blocked_until) VALUES(?,0,?,NULL) ON CONFLICT(bucket_key) DO UPDATE SET attempts=0,window_started_at=excluded.window_started_at,blocked_until=NULL").bind(key, now).run();
    return true;
  }
  if (row.attempts >= maxAttempts) {
    await db.prepare("UPDATE auth_rate_limits SET blocked_until=? WHERE bucket_key=?").bind(now + windowSeconds, key).run();
    return false;
  }
  return true;
}
async function failAttempt(db, key, maxAttempts = 8, windowSeconds = 900) {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare("INSERT INTO auth_rate_limits(bucket_key,attempts,window_started_at) VALUES(?,1,?) ON CONFLICT(bucket_key) DO UPDATE SET attempts=attempts+1").bind(key, now).run();
  const row = await db.prepare("SELECT attempts,window_started_at FROM auth_rate_limits WHERE bucket_key=?").bind(key).first();
  if (row && row.attempts >= maxAttempts && now - row.window_started_at < windowSeconds) {
    await db.prepare("UPDATE auth_rate_limits SET blocked_until=? WHERE bucket_key=?").bind(now + windowSeconds, key).run();
  }
}
async function createSession(db, userId) {
  const token = randomToken();
  const now = Math.floor(Date.now() / 1000);
  await db.prepare("INSERT INTO sessions(id,user_id,token_hash,created_at,expires_at,last_seen_at) VALUES(?,?,?,?,?,?)")
    .bind(crypto.randomUUID(), userId, await sha256(token), now, now + SESSION_SECONDS, now).run();
  return token;
}
async function currentUser(request, env) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  const now = Math.floor(Date.now() / 1000);
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare("SELECT u.id,u.email,u.created_at,s.id AS session_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?")
    .bind(tokenHash, now).first();
  if (row) await env.DB.prepare("UPDATE sessions SET last_seen_at=? WHERE id=?").bind(now, row.session_id).run();
  return row || null;
}
async function sendResetEmail(env, email, token, origin) {
  if (!env.EMAIL || !env.AUTH_EMAIL_FROM) return false;
  const link = `${origin}/?reset=${encodeURIComponent(token)}`;
  const text = `We received a request to reset your ReadyToFly password. This link expires in 30 minutes. If you did not request this, ignore this email.\n\nReset password: ${link}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#15243a"><h2>Reset your ReadyToFly password</h2><p>This secure link expires in 30 minutes.</p><p><a href="${link}" style="display:inline-block;padding:13px 20px;background:#2867d9;color:#fff;text-decoration:none;border-radius:8px">Reset password</a></p><p>If you did not request this, you can ignore this email.</p></div>`;
  await env.EMAIL.send({ to: email, from: env.AUTH_EMAIL_FROM, subject: "ReadyToFly password reset", text, html });
  return true;
}
async function register(request, env) {
  if (!sameOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const data = await bodyJson(request);
  const email = String(data.email || "").trim().toLowerCase();
  const password = data.password;
  if (!validEmail(email)) return json({ error: "Enter a valid email address." }, 400);
  if (!validPassword(password)) return json({ error: "Use 10–128 characters with uppercase, lowercase and a number." }, 400);
  const key = await sha256("register:" + (request.headers.get("CF-Connecting-IP") || "unknown"));
  if (!(await rateLimit(env.DB, key, 5, 3600))) return json({ error: "Too many attempts. Try again later." }, 429);
  const exists = await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
  if (exists) return json({ error: "An account with this email already exists. Try signing in." }, 409);
  const salt = toBase64(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await passwordHash(password, salt);
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  try {
    await env.DB.prepare("INSERT INTO users(id,email,password_hash,password_salt,password_iterations,created_at,updated_at) VALUES(?,?,?,?,?,?,?)")
      .bind(id, email, hash, salt, PBKDF2_ITERATIONS, now, now).run();
    await env.DB.prepare("INSERT INTO user_progress(user_id,progress_json,revision,updated_at) VALUES(?,?,1,?)")
      .bind(id, "{}", now).run();
  } catch (error) {
    if (String(error).includes("UNIQUE")) return json({ error: "An account with this email already exists." }, 409);
    throw error;
  }
  const token = await createSession(env.DB, id);
  return json({ user: { id, email }, message: "Account created." }, 201, { "set-cookie": setCookie(token) });
}
async function login(request, env) {
  if (!sameOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const data = await bodyJson(request);
  const email = String(data.email || "").trim().toLowerCase();
  const password = data.password;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = await sha256("login:" + ip + ":" + email);
  if (!(await rateLimit(env.DB, key, 8, 900))) return json({ error: "Too many sign-in attempts. Try again in 15 minutes." }, 429);
  const user = await env.DB.prepare("SELECT id,email,password_hash,password_salt,password_iterations FROM users WHERE email=?").bind(email).first();
  const candidate = user ? await passwordHash(String(password || ""), user.password_salt, user.password_iterations) : "";
  if (!user || !constantTimeEqual(candidate, user.password_hash)) {
    await failAttempt(env.DB, key, 8, 900);
    return json({ error: "Email or password is incorrect." }, 401);
  }
  await env.DB.prepare("DELETE FROM auth_rate_limits WHERE bucket_key=?").bind(key).run();
  const token = await createSession(env.DB, user.id);
  return json({ user: { id: user.id, email: user.email } }, 200, { "set-cookie": setCookie(token) });
}
async function logout(request, env) {
  if (!sameOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const token = cookieValue(request, SESSION_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha256(token)).run();
  return json({ ok: true }, 200, { "set-cookie": clearCookie() });
}
async function me(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ user: null }, 401);
  return json({ user: { id: user.id, email: user.email, created_at: user.created_at } });
}
async function requestReset(request, env) {
  if (!sameOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const data = await bodyJson(request);
  const email = String(data.email || "").trim().toLowerCase();
  if (!validEmail(email)) return json({ error: "Enter a valid email address." }, 400);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = await sha256("reset:" + ip + ":" + email);
  if (!(await rateLimit(env.DB, key, 4, 3600))) return json({ message: "If the account exists, a reset email will be sent." });
  const user = await env.DB.prepare("SELECT id,email FROM users WHERE email=?").bind(email).first();
  if (user) {
    const token = randomToken();
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare("DELETE FROM password_reset_tokens WHERE user_id=? OR expires_at<?").bind(user.id, now).run();
    await env.DB.prepare("INSERT INTO password_reset_tokens(id,user_id,token_hash,created_at,expires_at) VALUES(?,?,?,?,?)")
      .bind(crypto.randomUUID(), user.id, await sha256(token), now, now + RESET_SECONDS).run();
    try {
      const sent = await sendResetEmail(env, user.email, token, new URL(request.url).origin);
      if (!sent) console.error("Password reset email is not configured: bind EMAIL and set AUTH_EMAIL_FROM.");
    } catch (error) {
      console.error("Password reset email send failed:", error);
    }
  }
  return json({ message: "If the account exists and email delivery is configured, a reset link will be sent." });
}
async function resetPassword(request, env) {
  if (!sameOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const data = await bodyJson(request);
  if (typeof data.token !== "string" || data.token.length !== 64) return json({ error: "This reset link is invalid or expired." }, 400);
  if (!validPassword(data.password)) return json({ error: "Use 10–128 characters with uppercase, lowercase and a number." }, 400);
  const now = Math.floor(Date.now() / 1000);
  const tokenHash = await sha256(data.token);
  const row = await env.DB.prepare("SELECT id,user_id FROM password_reset_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>?")
    .bind(tokenHash, now).first();
  if (!row) return json({ error: "This reset link is invalid or expired." }, 400);
  const salt = toBase64(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await passwordHash(data.password, salt);
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET password_hash=?,password_salt=?,password_iterations=?,updated_at=? WHERE id=?").bind(hash,salt,PBKDF2_ITERATIONS,now,row.user_id),
    env.DB.prepare("UPDATE password_reset_tokens SET used_at=? WHERE id=?").bind(now,row.id),
    env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(row.user_id)
  ]);
  return json({ ok: true, message: "Password updated. Please sign in again." }, 200, { "set-cookie": clearCookie() });
}
async function getProgress(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Sign in required." }, 401);
  const row = await env.DB.prepare("SELECT progress_json,revision,updated_at FROM user_progress WHERE user_id=?").bind(user.id).first();
  let progress = {};
  try { progress = row ? JSON.parse(row.progress_json) : {}; } catch { progress = {}; }
  return json({ progress, revision: row?.revision || 0, updated_at: row?.updated_at || null });
}
async function saveProgress(request, env) {
  if (!sameOrigin(request)) return json({ error: "Invalid request origin." }, 403);
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Sign in required." }, 401);
  const data = await bodyJson(request);
  if (!data.progress || typeof data.progress !== "object" || Array.isArray(data.progress)) return json({ error: "Progress must be a JSON object." }, 400);
  const serialized = JSON.stringify(data.progress);
  if (serialized.length > 100000) return json({ error: "Progress data is too large." }, 413);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("INSERT INTO user_progress(user_id,progress_json,revision,updated_at) VALUES(?,?,1,?) ON CONFLICT(user_id) DO UPDATE SET progress_json=excluded.progress_json,revision=user_progress.revision+1,updated_at=excluded.updated_at")
    .bind(user.id, serialized, now).run();
  const row = await env.DB.prepare("SELECT revision,updated_at FROM user_progress WHERE user_id=?").bind(user.id).first();
  return json({ ok: true, revision: row.revision, updated_at: row.updated_at });
}
export async function onRequest(context) {
  const { request, env, params } = context;
  if (!env.DB) return json({ error: "Database binding DB is not configured." }, 503);
  const route = Array.isArray(params.path) ? params.path.join("/") : String(params.path || "");
  try {
    if (route === "auth/register" && request.method === "POST") return await register(request, env);
    if (route === "auth/login" && request.method === "POST") return await login(request, env);
    if (route === "auth/logout" && request.method === "POST") return await logout(request, env);
    if (route === "auth/me" && request.method === "GET") return await me(request, env);
    if (route === "auth/password/request" && request.method === "POST") return await requestReset(request, env);
    if (route === "auth/password/reset" && request.method === "POST") return await resetPassword(request, env);
    if (route === "progress" && request.method === "GET") return await getProgress(request, env);
    if (route === "progress" && request.method === "PUT") return await saveProgress(request, env);
    return json({ error: "Not found." }, 404);
  } catch (error) {
    console.error("ReadyToFly API error:", error);
    return json({ error: "A server error occurred. Please try again." }, 500);
  }
}
