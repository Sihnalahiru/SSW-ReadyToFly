-- ReadyToFly content library schema.
-- This migration creates empty, source-traceable content tables only.
-- It does not invent or import any lessons, vocabulary, questions, or media mappings.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS syllabus_versions (
  id TEXT PRIMARY KEY,
  version_key TEXT NOT NULL UNIQUE CHECK(version_key IN ('legacy','revised')),
  label TEXT NOT NULL,
  audit_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(audit_status IN ('PENDING','IN_PROGRESS','PARTIAL','VERIFIED')),
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS source_documents (
  id TEXT PRIMARY KEY,
  syllabus_version_id TEXT REFERENCES syllabus_versions(id),
  title TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_uri TEXT,
  source_sha256 TEXT,
  page_count INTEGER,
  audit_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(audit_status IN ('PENDING','IN_PROGRESS','PARTIAL','VERIFIED','UNAVAILABLE')),
  audit_notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_source_documents_version
  ON source_documents(syllabus_version_id);
CREATE INDEX IF NOT EXISTS idx_source_documents_audit
  ON source_documents(audit_status);

CREATE TABLE IF NOT EXISTS source_pages (
  id TEXT PRIMARY KEY,
  source_document_id TEXT NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL CHECK(page_number > 0),
  extracted_text TEXT,
  extraction_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(extraction_status IN ('PENDING','EXTRACTED','REVIEW_REQUIRED','VERIFIED','UNREADABLE')),
  content_sha256 TEXT,
  reviewer_notes TEXT,
  UNIQUE(source_document_id,page_number)
);
CREATE INDEX IF NOT EXISTS idx_source_pages_document
  ON source_pages(source_document_id,page_number);

CREATE TABLE IF NOT EXISTS study_lessons (
  id TEXT PRIMARY KEY,
  syllabus_version_id TEXT NOT NULL REFERENCES syllabus_versions(id),
  source_document_id TEXT REFERENCES source_documents(id),
  source_lesson_key TEXT,
  title TEXT NOT NULL,
  sort_order INTEGER,
  page_start INTEGER,
  page_end INTEGER,
  content_json TEXT NOT NULL DEFAULT '{}'
    CHECK(json_valid(content_json)),
  evidence_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(evidence_status IN ('PENDING','PARTIAL','VERIFIED')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(syllabus_version_id,source_lesson_key)
);
CREATE INDEX IF NOT EXISTS idx_study_lessons_version
  ON study_lessons(syllabus_version_id,sort_order);

CREATE TABLE IF NOT EXISTS vocabulary_terms (
  id TEXT PRIMARY KEY,
  syllabus_version_id TEXT NOT NULL REFERENCES syllabus_versions(id),
  source_document_id TEXT REFERENCES source_documents(id),
  lesson_id TEXT REFERENCES study_lessons(id) ON DELETE SET NULL,
  term TEXT NOT NULL,
  reading TEXT,
  meaning_en TEXT,
  meaning_si TEXT,
  technical_note TEXT,
  source_page INTEGER,
  source_excerpt TEXT,
  evidence_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(evidence_status IN ('PENDING','PARTIAL','VERIFIED')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vocabulary_version_term
  ON vocabulary_terms(syllabus_version_id,term);
CREATE INDEX IF NOT EXISTS idx_vocabulary_lesson
  ON vocabulary_terms(lesson_id);

CREATE TABLE IF NOT EXISTS exam_questions (
  id TEXT PRIMARY KEY,
  syllabus_version_id TEXT NOT NULL REFERENCES syllabus_versions(id),
  source_document_id TEXT REFERENCES source_documents(id),
  lesson_id TEXT REFERENCES study_lessons(id) ON DELETE SET NULL,
  question_type TEXT NOT NULL DEFAULT 'PENDING',
  question_text TEXT NOT NULL,
  options_json TEXT NOT NULL DEFAULT '[]'
    CHECK(json_valid(options_json)),
  answer_key TEXT,
  explanation TEXT,
  source_page INTEGER,
  source_excerpt TEXT,
  evidence_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(evidence_status IN ('PENDING','PARTIAL','VERIFIED','PRACTICE_AUTHORIZED')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_exam_questions_version
  ON exam_questions(syllabus_version_id,evidence_status);
CREATE INDEX IF NOT EXISTS idx_exam_questions_lesson
  ON exam_questions(lesson_id);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  source_document_id TEXT REFERENCES source_documents(id),
  original_filename TEXT NOT NULL,
  storage_key TEXT,
  media_type TEXT NOT NULL
    CHECK(media_type IN ('image','audio','video','document','animation','other')),
  mime_type TEXT,
  file_size INTEGER,
  sha256 TEXT,
  alt_text TEXT,
  audit_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(audit_status IN ('PENDING','IN_PROGRESS','PARTIAL','VERIFIED','UNAVAILABLE')),
  audit_notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_media_assets_source
  ON media_assets(source_document_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_hash
  ON media_assets(sha256);

CREATE TABLE IF NOT EXISTS evidence_mappings (
  id TEXT PRIMARY KEY,
  syllabus_version_id TEXT NOT NULL REFERENCES syllabus_versions(id),
  source_document_id TEXT REFERENCES source_documents(id),
  media_asset_id TEXT REFERENCES media_assets(id),
  target_type TEXT NOT NULL
    CHECK(target_type IN ('lesson','vocabulary','question','page','other')),
  target_id TEXT NOT NULL,
  source_page INTEGER,
  mapping_basis TEXT,
  evidence_reference TEXT,
  mapping_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(mapping_status IN ('PENDING','REVIEW_REQUIRED','VERIFIED','REJECTED')),
  reviewer_notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evidence_mappings_target
  ON evidence_mappings(target_type,target_id);
CREATE INDEX IF NOT EXISTS idx_evidence_mappings_media
  ON evidence_mappings(media_asset_id);
CREATE INDEX IF NOT EXISTS idx_evidence_mappings_status
  ON evidence_mappings(mapping_status);

CREATE TABLE IF NOT EXISTS content_import_batches (
  id TEXT PRIMARY KEY,
  batch_name TEXT NOT NULL,
  source_manifest_sha256 TEXT,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  imported_records INTEGER NOT NULL DEFAULT 0,
  rejected_records INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','RUNNING','COMPLETED','FAILED','PARTIAL')),
  report_json TEXT NOT NULL DEFAULT '{}'
    CHECK(json_valid(report_json))
);
