import process from "node:process";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const databaseId = "363d4ade-f519-4f67-8f17-66e8b5fd7293";
if (!accountId || !apiToken) throw new Error("Missing Cloudflare account credentials.");

const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

async function query(sql, params = []) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(payload.errors ?? payload)}`);
  }
  return payload.result?.[0]?.results ?? [];
}

const expected = {
  users: ["id", "email", "display_name", "password_hash", "password_salt", "email_verified", "disabled_at", "created_at", "updated_at"],
  sessions: ["id", "user_id", "token_hash", "csrf_hash", "created_at", "expires_at", "last_seen_at"],
  email_tokens: ["id", "user_id", "purpose", "token_hash", "expires_at", "created_at"],
  study_progress: ["user_id", "record_key", "payload_json", "updated_at"],
  auth_rate_limits: ["bucket_key", "attempts", "window_started_at", "blocked_until"],
  syllabus_versions: ["id", "version_key", "label", "audit_status", "notes", "created_at", "updated_at"],
  source_documents: ["id", "syllabus_version_id", "title", "original_filename", "source_type", "source_uri", "source_sha256", "page_count", "audit_status", "audit_notes", "created_at", "updated_at"],
  source_pages: ["id", "source_document_id", "page_number", "extracted_text", "extraction_status", "content_sha256", "reviewer_notes"],
  study_lessons: ["id", "syllabus_version_id", "source_document_id", "source_lesson_key", "title", "sort_order", "page_start", "page_end", "content_json", "evidence_status", "created_at", "updated_at"],
  vocabulary_terms: ["id", "syllabus_version_id", "source_document_id", "lesson_id", "term", "reading", "meaning_en", "meaning_si", "technical_note", "source_page", "source_excerpt", "evidence_status", "created_at", "updated_at"],
  exam_questions: ["id", "syllabus_version_id", "source_document_id", "lesson_id", "question_type", "question_text", "options_json", "answer_key", "explanation", "source_page", "source_excerpt", "evidence_status", "created_at", "updated_at"],
  media_assets: ["id", "source_document_id", "original_filename", "storage_key", "media_type", "mime_type", "file_size", "sha256", "alt_text", "audit_status", "audit_notes", "created_at", "updated_at"],
  evidence_mappings: ["id", "syllabus_version_id", "source_document_id", "media_asset_id", "target_type", "target_id", "source_page", "mapping_basis", "evidence_reference", "mapping_status", "reviewer_notes", "created_at", "updated_at"],
  content_import_batches: ["id", "batch_name", "source_manifest_sha256", "started_at", "completed_at", "imported_records", "rejected_records", "status", "report_json"],
};

async function assertSchema() {
  const tables = new Set((await query("SELECT name FROM sqlite_master WHERE type='table'")).map(row => row.name));
  const missingTables = [];
  const missingColumns = [];
  for (const [table, columns] of Object.entries(expected)) {
    if (!tables.has(table)) {
      missingTables.push(table);
      continue;
    }
    const actual = new Set((await query(`PRAGMA table_info("${table}")`)).map(row => row.name));
    for (const column of columns) if (!actual.has(column)) missingColumns.push(`${table}.${column}`);
  }
  if (missingTables.length || missingColumns.length) {
    throw new Error(`Schema preflight stopped safely. Missing tables: ${missingTables.join(", ") || "none"}. Missing columns: ${missingColumns.join(", ") || "none"}. No migration history or schema was changed.`);
  }
}

await assertSchema();

const migrationTable = (await query("SELECT name FROM sqlite_master WHERE type='table' AND name='d1_migrations'")).length > 0;
if (!migrationTable) {
  await query("CREATE TABLE IF NOT EXISTS d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL)");
}

const applied = new Set((await query("SELECT name FROM d1_migrations")).map(row => row.name));
for (const baseline of ["0001_auth_and_progress.sql", "0002_content_library.sql"]) {
  if (!applied.has(baseline)) {
    await query("INSERT OR IGNORE INTO d1_migrations (name) VALUES (?)", [baseline]);
    console.log(`Recorded verified existing schema baseline: ${baseline}`);
  }
}

console.log("Preflight PASS: existing 0001/0002 schema verified; Wrangler can safely apply outstanding migrations.");
