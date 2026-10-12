import type { ErColumn, ErEntity, ErSpec } from "../types";

/** Verified against migrations/versions/0001–0012, migrations/legacy_schema.py, migrations/v2_schema.py, api/models.py, api/care_models.py, api/lifetime_models.py, api/share_models.py, api/vitals_models.py, api/password_reset.py, api/email_verification.py. */
const c = (name: string, type?: string, key?: ErColumn["key"], guarded = false): ErColumn => ({ name, type, key, protected: guarded });
const id = c("id", "int", "PK");
const patient = c("patient_id", "int", "FK");
const sourceDocument = c("source_document_id", "int", "FK");

const X = [40, 316, 592, 868, 1144] as const;

const entities: ErEntity[] = [
  // Identity and account
  { id: "users", x: X[0], y: 86, name: "users", tone: "accent", columns: [id, c("email", "text", "UQ"), c("password_salt", "pbkdf2", undefined, true), c("password_hash", "pbkdf2", undefined, true), c("email_verified_at", "datetime"), c("created_at", "datetime")] },
  { id: "sessions", x: X[0], y: 272, name: "sessions", columns: [id, c("user_id", "int", "FK"), c("token_hash", "sha-256", "UQ", true), c("expires_at", "datetime")] },
  { id: "email_verification_tokens", x: X[0], y: 424, name: "email_verification_tokens", columns: [id, c("user_id", "int", "FK"), c("token_hash", "sha-256", "UQ", true), c("expires_at", "datetime"), c("used_at", "datetime")] },
  { id: "password_reset_tokens", x: X[0], y: 593, name: "password_reset_tokens", columns: [id, c("user_id", "int", "FK"), c("token_hash", "sha-256", "UQ", true), c("expires_at", "datetime"), c("used_at", "datetime")] },
  { id: "audit", x: X[0], y: 762, name: "audit", columns: [id, c("user_id", "int", "FK"), c("patient_id", "int", "FK"), c("action", "text"), c("entity", "text"), c("entity_id", "int"), c("at", "datetime")] },
  { id: "push_devices", x: X[0], y: 965, name: "push_devices", columns: [id, c("user_id", "int", "FK"), c("token_hash", "sha-256", "UQ", true), c("enabled", "bool")] },
  // Profiles and documents
  { id: "patients", x: X[1], y: 86, name: "patients", tone: "accent", columns: [id, c("user_id", "int", "FK"), c("name", "enc text"), c("dob", "date"), c("tz", "text"), c("sex", "text"), c("relationship", "text")], more: "+ modules_json, created_at" },
  { id: "caregiver_access", x: X[1], y: 304, w: 150, name: "caregiver_access", columns: [id, patient, c("user_id", "int", "FK"), c("role", "text")] },
  { id: "documents", x: X[1], y: 456, name: "documents", tone: "accent", columns: [id, patient, c("title", "enc text"), c("category", "text"), c("record_date", "date"), c("mime", "text"), c("sha256", "sha-256"), c("storage_name", "text", "UQ"), c("extraction_status", "text")], more: "+ extracted_cipher, page_count…" },
  { id: "extraction_reviews", x: X[1], y: 708, name: "extraction_reviews", columns: [id, c("document_id", "int", "FK"), c("payload", "enc json"), c("status", "text"), c("version", "int"), c("confirmed_at", "datetime")] },
  { id: "care_settings", x: X[1], y: 894, name: "care_settings", columns: [id, c("patient_id", "int", "FK"), c("wet_diaper_threshold_per_day", "int")], more: "+ fluid and colour settings" },
  // Medical history
  { id: "medicines", x: X[2], y: 86, name: "medicines", columns: [id, patient, sourceDocument, c("name", "text"), c("status", "text"), c("version", "int")], more: "+ dosage, frequency, route, dates…" },
  { id: "vaccines", x: X[2], y: 287, name: "vaccines", columns: [id, patient, sourceDocument, c("name", "text"), c("dose_label", "text"), c("due_date", "date"), c("given_date", "date")], more: "+ confirmed, batch, facility, schedule" },
  { id: "observations", x: X[2], y: 505, name: "observations", columns: [id, patient, sourceDocument, c("test_name", "text"), c("value", "text"), c("unit", "text"), c("record_date", "date")], more: "+ verified, reference_range…" },
  { id: "episodes", x: X[2], y: 723, name: "episodes", columns: [id, patient, sourceDocument, c("title", "text"), c("started_on", "date"), c("ended_on", "date")], more: "+ documented_diagnosis, links_json" },
  { id: "admissions", x: X[2], y: 924, name: "admissions", columns: [id, patient, sourceDocument, c("discharge_document_id", "int", "FK"), c("facility", "text"), c("admitted_on", "date"), c("discharged_on", "date")] },
  // Daily care
  { id: "care_days", x: X[3], y: 86, name: "care_days", columns: [id, patient, c("local_date", "date"), c("day_note", "enc text")], more: "unique (patient_id, local_date)" },
  { id: "stool_entries", x: X[3], y: 253, name: "stool_entries", columns: [id, patient, c("recorded_by", "int", "FK"), c("illness_episode_id", "int", "FK"), c("at", "datetime"), c("local_date", "date"), c("colour", "text"), c("consistency", "text")], more: "+ status, version, client_key, AI fields" },
  { id: "stool_photos", x: X[3], y: 488, name: "stool_photos", columns: [id, patient, c("stool_entry_id", "int", "FK"), c("storage_name", "text", "UQ"), c("sha256", "sha-256"), c("mime", "text"), c("taken_at", "datetime")] },
  { id: "vitals_entries", x: X[3], y: 691, name: "vitals_entries", columns: [id, patient, c("recorded_by", "int", "FK"), c("at", "datetime"), c("local_date", "date"), c("systolic", "num"), c("diastolic", "num")], more: "+ heart_rate, spo2, glucose, weight…" },
  { id: "record_revisions", x: X[3], y: 909, name: "record_revisions", columns: [id, patient, c("user_id", "int", "FK"), c("entity", "text"), c("entity_id", "int"), c("snapshot_json", "enc json")], more: "+ changed_at" },
  // Sharing, reminders, notifications
  { id: "share_packages", x: X[4], y: 86, name: "share_packages", columns: [id, patient, c("created_by", "int", "FK"), c("scope_json", "enc json"), c("token_hash", "sha-256", "UQ", true), c("pin_hash", "pbkdf2", undefined, true), c("expires_at", "datetime"), c("revoked_at", "datetime")], more: "+ access_count, pin_salt, flags" },
  { id: "share_access_log", x: X[4], y: 321, name: "share_access_log", columns: [id, c("package_id", "int", "FK"), c("at", "datetime"), c("event", "text"), c("ip_hash", "sha-256", undefined, true)] },
  { id: "reminders", x: X[4], y: 490, name: "reminders", columns: [id, patient, c("kind", "text"), c("item_id", "int"), c("title", "text"), c("due_at", "datetime"), c("status", "text")] },
  { id: "notifications", x: X[4], y: 693, name: "notifications", columns: [id, c("reminder_id", "int", "FK"), c("user_id", "int", "FK"), c("device_id", "int", "FK"), c("channel", "text"), c("status", "text"), c("dedupe_key", "text", "UQ")], more: "+ attempts, next_attempt_at, receipt_id" },
];

export const dataModelEr: ErSpec = {
  kind: "er",
  id: "data-model-er",
  title: "Database entity-relationship diagram (core tables)",
  description: "Twenty-five of the schema's fifty tables, grouped by domain. Every history, daily-care and sharing table hangs off patients; documents act as provenance through source_document_id; tokens and session identifiers are stored only as hashes and personal text as Fernet ciphertext. Crow's-foot ends mark the many side, a bar the one side and a circle an optional side.",
  relationships: [
    "users 1 — 0..* sessions, email_verification_tokens, password_reset_tokens and push_devices (user_id, ON DELETE CASCADE); only SHA-256 token hashes are stored.",
    "users 1 — 0..* patients through patients.user_id (the primary guardian, CASCADE); users and patients are also joined many-to-many by caregiver_access, unique per (patient_id, user_id).",
    "patients 1 — 0..* documents, medicines, vaccines, observations, episodes, admissions, care_days, stool_entries, stool_photos, vitals_entries, record_revisions, share_packages and reminders (patient_id, CASCADE); patients 1 — 0..1 care_settings.",
    "documents 1 — 0..1 extraction_reviews (unique document_id) and documents 0..1 — 0..* medicines, vaccines, observations, episodes and admissions through source_document_id (SET NULL); admissions also reference a discharge document.",
    "episodes 0..1 — 0..* stool_entries (illness_episode_id, SET NULL); stool_entries 1 — 0..* stool_photos (CASCADE).",
    "share_packages 1 — 0..* share_access_log (CASCADE); reminders 1 — 0..* notifications (CASCADE), which also reference users and push_devices.",
    "audit and record_revisions point at any record through (entity, entity_id) without a database foreign key; recorded_by, created_by, reviewed_by and verified_by columns reference users with SET NULL.",
    "Not drawn: medicine_revisions, medication_events, hospital_visits, treatment_administrations, growth, fever_episodes, antibiotic_courses, antibiotic_administrations, parent_health_entries, lifetime_evidence, invitations, cameras, camera_observations, stool_intake, fluid_entries, diaper_entries, symptom_entries, activity_entries, sleep_entries, medication_administrations, worker_heartbeat, rate_windows, file_ticket_uses, mail_relay_nonces and mail_relay_sends.",
  ],
  width: 1380,
  height: 1190,
  groups: [
    { id: "g-identity", x: 20, y: 30, w: 236, h: 1070, title: "Identity & account", subtitle: "0001, 0002, 0010, 0011" },
    { id: "g-profiles", x: 296, y: 30, w: 236, h: 1070, title: "Profiles & documents", subtitle: "0001, 0002, 0004, 0007, 0009" },
    { id: "g-history", x: 572, y: 30, w: 236, h: 1070, title: "Medical history", subtitle: "0001, 0002 · provenance via documents" },
    { id: "g-care", x: 848, y: 30, w: 236, h: 1070, title: "Daily care & vitals", subtitle: "0003, 0007, 0008, 0009" },
    { id: "g-sharing", x: 1124, y: 30, w: 236, h: 1070, title: "Sharing & reminders", subtitle: "0002, 0006" },
  ],
  entities,
  relations: [
    { id: "users-sessions", from: "users", to: "sessions", fromCard: "1", toCard: "0..*", fromSide: "bottom", toSide: "top" },
    { id: "users-patients", from: "users", to: "patients", fromCard: "1", toCard: "0..*", fromSide: "right", fromAt: (140 - 154) / 136, toSide: "left", toAt: (140 - 170) / 168 },
    { id: "users-caregiver", from: "users", to: "caregiver_access", fromCard: "1", toCard: "0..*", fromSide: "right", fromAt: (200 - 154) / 136, toSide: "left", via: 284 },
    { id: "users-verify", from: "users", to: "email_verification_tokens", fromCard: "1", toCard: "0..*", fromSide: "right", fromAt: (170 - 154) / 136, toSide: "right", via: 268 },
    { id: "users-reset", from: "users", to: "password_reset_tokens", fromCard: "1", toCard: "0..*", fromSide: "right", fromAt: (185 - 154) / 136, toSide: "right", via: 276 },
    { id: "patients-caregiver", from: "patients", to: "caregiver_access", fromCard: "1", toCard: "0..*", fromSide: "bottom", fromAt: (375 - 414) / 196, toSide: "top", toAt: (375 - 391) / 150 },
    { id: "patients-documents", from: "patients", to: "documents", fromCard: "1", toCard: "0..*", fromSide: "bottom", fromAt: (490 - 414) / 196, toSide: "top", toAt: (490 - 414) / 196 },
    { id: "documents-reviews", from: "documents", to: "extraction_reviews", fromCard: "1", toCard: "0..1", fromSide: "bottom", toSide: "top" },
    { id: "patients-settings", from: "patients", to: "care_settings", fromCard: "1", toCard: "0..1", fromSide: "left", fromAt: (230 - 170) / 168, toSide: "left", via: 262 },
    { id: "patients-medicines", from: "patients", to: "medicines", fromCard: "1", toCard: "0..*", fromSide: "right", fromAt: (120 - 170) / 168, toSide: "left", toAt: (120 - 161.5) / 151 },
    { id: "doc-medicines", from: "documents", to: "medicines", fromCard: "0..1", toCard: "0..*", fromSide: "right", fromAt: -0.4, toSide: "left", toAt: (200 - 161.5) / 151, via: 540 },
    { id: "doc-vaccines", from: "documents", to: "vaccines", fromCard: "0..1", toCard: "0..*", fromSide: "right", fromAt: -0.2, toSide: "left", via: 546 },
    { id: "doc-observations", from: "documents", to: "observations", fromCard: "0..1", toCard: "0..*", fromSide: "right", fromAt: 0, toSide: "left", via: 552 },
    { id: "doc-episodes", from: "documents", to: "episodes", fromCard: "0..1", toCard: "0..*", fromSide: "right", fromAt: 0.2, toSide: "left", via: 558 },
    { id: "doc-admissions", from: "documents", to: "admissions", fromCard: "0..1", toCard: "0..*", fromSide: "right", fromAt: 0.4, toSide: "left", via: 564 },
    { id: "patients-caredays", from: "patients", to: "care_days", fromCard: "1", toCard: "0..*", fromSide: "top", fromAt: -0.1, toSide: "top", via: 56 },
    { id: "episodes-stool", from: "episodes", to: "stool_entries", fromCard: "0..1", toCard: "0..*", fromSide: "right", toSide: "left", via: 828 },
    { id: "stool-photos", from: "stool_entries", to: "stool_photos", fromCard: "1", toCard: "0..*", fromSide: "bottom", toSide: "top" },
    { id: "share-log", from: "share_packages", to: "share_access_log", fromCard: "1", toCard: "0..*", fromSide: "bottom", toSide: "top" },
    { id: "reminders-notifications", from: "reminders", to: "notifications", fromCard: "1", toCard: "0..*", fromSide: "bottom", toSide: "top" },
  ],
  notes: [
    { id: "n1", x: 20, y: 1122, w: 1340, text: [
      "Not drawn: patient_id on every table of the history, daily-care and sharing groups (CASCADE); recorded_by, created_by and user_id on journal, sharing and audit tables → users (SET NULL); source_document_id on fever, antibiotic and growth tables → documents.",
      "Journal tables sharing stool_entries' shape (patient_id, recorded_by, at, local_date, note, status, version, unique client_key): fluid_entries · diaper_entries · symptom_entries · activity_entries · sleep_entries · medication_administrations · vitals_entries.",
      "Also in the schema (50 tables in total): medicine_revisions, medication_events, hospital_visits, treatment_administrations, growth, fever_episodes, antibiotic_courses, antibiotic_administrations, parent_health_entries, lifetime_evidence,",
      "invitations, cameras, camera_observations, stool_intake, worker_heartbeat, rate_windows, file_ticket_uses, and the PostgreSQL-only mail_relay_nonces and mail_relay_sends used by the email relay guard.",
    ] },
  ],
  legend: [
    { style: "solid", label: "Foreign key · crow's foot = many, bar = exactly one, circle = optional" },
    { style: "accent", label: "Italic gold type = stored as a hash or Fernet ciphertext" },
    { style: "box-store", label: "Group subtitles list the Alembic migrations that created the tables" },
  ],
};
