-- GaitAI billing ledger. One row per account, subscription, payment and
-- webhook event. Nothing here is medical data; GaitAI Care has its own
-- database and the two are never joined.

CREATE TABLE IF NOT EXISTS customers (
  uid TEXT PRIMARY KEY,                 -- Firebase Auth uid
  email TEXT NOT NULL,
  email_verified INTEGER NOT NULL DEFAULT 0,
  provider_customer_id TEXT,            -- Razorpay customer id once known
  created_at INTEGER NOT NULL,          -- unix seconds
  last_seen_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE IF NOT EXISTS plans (
  product TEXT NOT NULL,                -- mobilitycare | securevision
  cycle TEXT NOT NULL,                  -- monthly | annual
  provider TEXT NOT NULL,               -- razorpay | sandbox
  provider_plan_id TEXT NOT NULL,       -- plan_xxx
  amount_paise INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (product, cycle, provider)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,                  -- provider subscription id (sub_xxx)
  uid TEXT NOT NULL REFERENCES customers(uid),
  product TEXT NOT NULL,
  cycle TEXT NOT NULL,
  provider TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,                 -- created|authenticated|active|pending|halted|cancelled|completed|expired
  amount_paise INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  current_start INTEGER,
  current_end INTEGER,
  charge_at INTEGER,
  ended_at INTEGER,
  paid_count INTEGER NOT NULL DEFAULT 0,
  cancel_at_cycle_end INTEGER NOT NULL DEFAULT 0,
  refunded_at INTEGER,                  -- set when the latest payment is refunded: access revoked
  short_url TEXT,
  last_event_at INTEGER,                -- provider timestamp of the last applied event
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS subscriptions_uid_product ON subscriptions(uid, product);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,                  -- provider payment id (pay_xxx)
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
  uid TEXT NOT NULL,
  amount_paise INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL,                 -- captured|failed|refunded
  method TEXT,
  invoice_id TEXT,
  error_code TEXT,
  error_description TEXT,
  refund_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS payments_uid ON payments(uid, created_at);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,                  -- x-razorpay-event-id, or sha256(body) when absent
  event TEXT NOT NULL,
  subscription_id TEXT,
  signature_ok INTEGER NOT NULL,
  outcome TEXT NOT NULL,                -- applied|duplicate|unmatched|rejected|stale
  body_sha256 TEXT NOT NULL,
  received_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  uid TEXT,
  action TEXT NOT NULL,
  detail TEXT
);
