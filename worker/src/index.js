const SESSION_DAYS = 7;
const VERIFY_MINUTES = 30;
const RESET_MINUTES = 20;
const PBKDF2_ITERATIONS = 310000;
const encoder = new TextEncoder();

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
}
function cookieMap(request) {
  return Object.fromEntries((request.headers.get("Cookie") || "").split(";").map(v => v.trim()).filter(Boolean).map(v => { const i=v.indexOf("="); return [v.slice(0,i), decodeURIComponent(v.slice(i+1))]; }));
}
function cookie(name, value, maxAge, httpOnly = true) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; Secure; SameSite=Lax${httpOnly ? "; HttpOnly" : ""}`;
}
function clearCookie(name, httpOnly = true) { return cookie(name, "", 0, httpOnly); }
function randomToken(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function hex(buffer) { return [...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,"0")).join(""); }
async function sha256(value) { return hex(await crypto.subtle.digest("SHA-256", encoder.encode(value))); }
async function passwordHash(password, saltHex) {
  const salt = saltHex ? Uint8Array.from(saltHex.match(/.{2}/g), b=>parseInt(b,16)) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name:"PBKDF2", hash:"SHA-256", salt, iterations:PBKDF2_ITERATIONS }, key, 256);
  return { salt:hex(salt), hash:hex(bits) };
}
function validEmail(email) { return typeof email==="string" && email.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function validPassword(password) { return typeof password==="string" && password.length>=12 && password.length<=128 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password); }
async function readJson(request, max=12000) {
  const length=Number(request.headers.get("content-length")||0);
  if(length>max) throw new Error("REQUEST_TOO_LARGE");
  const text=await request.text();
  if(text.length>max) throw new Error("REQUEST_TOO_LARGE");
  return JSON.parse(text);
}
function originAllowed(request, env) {
  const origin=request.headers.get("Origin");
  return !origin || origin===env.APP_ORIGIN;
}
function requireOrigin(request, env) {
  if(!originAllowed(request,env)) return json({error:"ORIGIN_NOT_ALLOWED"},403);
  return null;
}
async function csrfValid(request, env, session) {
  const cookies=cookieMap(request);
  const header=request.headers.get("X-CSRF-Token");
  if(!header || !cookies.rtf_csrf || header!==cookies.rtf_csrf) return false;
  return (await sha256(header))===session.csrf_hash;
}
async function currentSession(request, env) {
  const token=cookieMap(request).rtf_session;
  if(!token) return null;
  const tokenHash=await sha256(token);
  const row=await env.DB.prepare("SELECT s.id,s.user_id,s.csrf_hash,s.expires_at,u.email,u.display_name,u.email_verified FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.disabled_at IS NULL").bind(tokenHash,Date.now()).first();
  return row||null;
}
async function sendEmail(env, to, subject, html) {
  if(!env.RESEND_API_KEY || !env.MAIL_FROM) throw new Error("EMAIL_NOT_CONFIGURED");
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:env.MAIL_FROM,to:[to],subject,html})});
  if(!response.ok) throw new Error("EMAIL_DELIVERY_FAILED");
}
async function issueEmailToken(env, user, purpose, minutes, subject, buildHtml) {
  const token=randomToken(32), tokenHash=await sha256(token), expires=Date.now()+minutes*60*1000;
  await env.DB.prepare("DELETE FROM email_tokens WHERE user_id=? AND purpose=?").bind(user.id,purpose).run();
  await env.DB.prepare("INSERT INTO email_tokens(id,user_id,purpose,token_hash,expires_at,created_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),user.id,purpose,tokenHash,expires,Date.now()).run();
  const link=`${env.APP_ORIGIN}/?auth=${purpose}&token=${encodeURIComponent(token)}`;
  await sendEmail(env,user.email,subject,buildHtml(link));
}
async function createSession(env,user,request) {
  const token=randomToken(32),csrf=randomToken(24),now=Date.now(),expires=now+SESSION_DAYS*86400000;
  await env.DB.prepare("INSERT INTO sessions(id,user_id,token_hash,csrf_hash,created_at,expires_at,last_seen_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),user.id,await sha256(token),await sha256(csrf),now,expires,now).run();
  return {sessionCookie:cookie("rtf_session",token,SESSION_DAYS*86400),csrfCookie:cookie("rtf_csrf",csrf,SESSION_DAYS*86400,false),user:{id:user.id,email:user.email,displayName:user.display_name,emailVerified:Boolean(user.email_verified)}};
}
async function handle(request,env) {
  const url=new URL(request.url),path=url.pathname.replace(/\/$/,"")||"/";
  if(path.startsWith("/api/") && request.method==="OPTIONS") return new Response(null,{status:204,headers:{"Allow":"GET, POST, PUT, OPTIONS"}});
  if(!path.startsWith("/api/")) return json({service:"ReadyToFly Auth API",status:"ok"});
  if(!env.DB) return json({error:"DATABASE_NOT_CONFIGURED"},503);
  if(!originAllowed(request,env)) return json({error:"ORIGIN_NOT_ALLOWED"},403);
  try {
    if(path==="/api/auth/register" && request.method==="POST") {
      const body=await readJson(request),email=String(body.email||"").trim().toLowerCase(),name=String(body.displayName||"").trim().slice(0,80),password=body.password;
      if(!validEmail(email)||!validPassword(password)||!name) return json({error:"INVALID_REGISTRATION",message:"Enter a valid email, name and a password of at least 12 characters with uppercase, lowercase and a number."},400);
      const exists=await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
      if(exists) return json({ok:true,message:"If this address can be registered, a verification email will be sent."},202);
      const id=crypto.randomUUID(),pw=await passwordHash(password),now=Date.now();
      await env.DB.prepare("INSERT INTO users(id,email,display_name,password_hash,password_salt,email_verified,created_at,updated_at) VALUES(?,?,?,?,?,0,?,?)").bind(id,email,name,pw.hash,pw.salt,now,now).run();
      try { await issueEmailToken(env,{id,email},"verify",VERIFY_MINUTES,"Verify your ReadyToFly account",link=>`<p>Welcome to ReadyToFly.</p><p><a href="${link}">Verify your email address</a>. This link expires in 30 minutes.</p>`); }
      catch(e){ await env.DB.prepare("DELETE FROM users WHERE id=?").bind(id).run(); throw e; }
      return json({ok:true,message:"Check your email for the verification link."},201);
    }
    if(path==="/api/auth/verify" && request.method==="POST") {
      const body=await readJson(request),token=String(body.token||"");
      if(token.length<30||token.length>100) return json({error:"INVALID_OR_EXPIRED_TOKEN"},400);
      const row=await env.DB.prepare("SELECT id,user_id FROM email_tokens WHERE token_hash=? AND purpose='verify' AND expires_at>?").bind(await sha256(token),Date.now()).first();
      if(!row) return json({error:"INVALID_OR_EXPIRED_TOKEN"},400);
      await env.DB.batch([env.DB.prepare("UPDATE users SET email_verified=1,updated_at=? WHERE id=?").bind(Date.now(),row.user_id),env.DB.prepare("DELETE FROM email_tokens WHERE id=?").bind(row.id)]);
      return json({ok:true,message:"Email verified. You can now sign in."});
    }
    if(path==="/api/auth/login" && request.method==="POST") {
      const body=await readJson(request),email=String(body.email||"").trim().toLowerCase(),password=String(body.password||"");
      const user=await env.DB.prepare("SELECT id,email,display_name,password_hash,password_salt,email_verified FROM users WHERE email=? AND disabled_at IS NULL").bind(email).first();
      if(!user) return json({error:"INVALID_CREDENTIALS"},401);
      const pw=await passwordHash(password,user.password_salt);
      if(pw.hash!==user.password_hash) return json({error:"INVALID_CREDENTIALS"},401);
      if(!user.email_verified) return json({error:"EMAIL_NOT_VERIFIED"},403);
      const session=await createSession(env,user,request);
      return json({ok:true,user:session.user},{status:200,headers:{"Set-Cookie":[session.sessionCookie,session.csrfCookie].join(", ")}});
    }
    if(path==="/api/auth/me" && request.method==="GET") {
      const session=await currentSession(request,env);
      if(!session) return json({authenticated:false},200,{ "Set-Cookie":[clearCookie("rtf_session"),clearCookie("rtf_csrf",false)] });
      return json({authenticated:true,user:{id:session.user_id,email:session.email,displayName:session.display_name,emailVerified:Boolean(session.email_verified)},csrfToken:cookieMap(request).rtf_csrf});
    }
    if(path==="/api/auth/logout" && request.method==="POST") {
      const session=await currentSession(request,env);
      if(session) {
        if(!await csrfValid(request,env,session)) return json({error:"CSRF_CHECK_FAILED"},403);
        await env.DB.prepare("DELETE FROM sessions WHERE id=?").bind(session.id).run();
      }
      return json({ok:true},{status:200,headers:{"Set-Cookie":[clearCookie("rtf_session"),clearCookie("rtf_csrf",false)].join(", ")}});
    }
    if(path==="/api/auth/forgot-password" && request.method==="POST") {
      const body=await readJson(request),email=String(body.email||"").trim().toLowerCase();
      if(validEmail(email)) {
        const user=await env.DB.prepare("SELECT id,email FROM users WHERE email=? AND email_verified=1 AND disabled_at IS NULL").bind(email).first();
        if(user) await issueEmailToken(env,user,"reset",RESET_MINUTES,"Reset your ReadyToFly password",link=>`<p>A password reset was requested for your ReadyToFly account.</p><p><a href="${link}">Reset password</a>. This link expires in 20 minutes. If you did not request this, ignore this email.</p>`);
      }
      return json({ok:true,message:"If the account exists, a password reset link will be sent."});
    }
    if(path==="/api/auth/reset-password" && request.method==="POST") {
      const body=await readJson(request),token=String(body.token||""),password=body.password;
      if(token.length<30||token.length>100||!validPassword(password)) return json({error:"INVALID_REQUEST"},400);
      const row=await env.DB.prepare("SELECT id,user_id FROM email_tokens WHERE token_hash=? AND purpose='reset' AND expires_at>?").bind(await sha256(token),Date.now()).first();
      if(!row) return json({error:"INVALID_OR_EXPIRED_TOKEN"},400);
      const pw=await passwordHash(password),now=Date.now();
      await env.DB.batch([env.DB.prepare("UPDATE users SET password_hash=?,password_salt=?,updated_at=? WHERE id=?").bind(pw.hash,pw.salt,now,row.user_id),env.DB.prepare("DELETE FROM email_tokens WHERE user_id=?").bind(row.user_id),env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(row.user_id)]);
      return json({ok:true,message:"Password updated. Please sign in again."});
    }
    if(path==="/api/progress" && (request.method==="GET"||request.method==="PUT")) {
      const session=await currentSession(request,env);
      if(!session) return json({error:"UNAUTHENTICATED"},401);
      if(request.method==="GET") {
        const rows=await env.DB.prepare("SELECT record_key,payload_json,updated_at FROM study_progress WHERE user_id=? ORDER BY updated_at DESC").bind(session.user_id).all();
        return json({items:(rows.results||[]).map(r=>({key:r.record_key,data:JSON.parse(r.payload_json),updatedAt:r.updated_at}))});
      }
      if(!await csrfValid(request,env,session)) return json({error:"CSRF_CHECK_FAILED"},403);
      const body=await readJson(request,20000),items=Array.isArray(body.items)?body.items:[];
      if(items.length>100) return json({error:"TOO_MANY_ITEMS"},400);
      const now=Date.now(),statements=[];
      for(const item of items) {
        const key=String(item.key||"");
        if(!/^[a-zA-Z0-9:_-]{1,120}$/.test(key)) return json({error:"INVALID_PROGRESS_KEY"},400);
        const payload=JSON.stringify(item.data??null);
        if(payload.length>8000) return json({error:"PROGRESS_ITEM_TOO_LARGE"},400);
        statements.push(env.DB.prepare("INSERT INTO study_progress(user_id,record_key,payload_json,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,record_key) DO UPDATE SET payload_json=excluded.payload_json,updated_at=excluded.updated_at").bind(session.user_id,key,payload,now));
      }
      if(statements.length) await env.DB.batch(statements);
      return json({ok:true,saved:statements.length});
    }
    return json({error:"NOT_FOUND"},404);
  } catch(error) {
    console.error("ReadyToFly API error:",error.message);
    const status=error.message==="REQUEST_TOO_LARGE"?413:500;
    return json({error:status===413?"REQUEST_TOO_LARGE":"INTERNAL_ERROR"},status);
  }
}
export default { fetch(request,env) { return handle(request,env); } };
