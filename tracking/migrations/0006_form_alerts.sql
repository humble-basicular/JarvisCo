-- Notification idempotency only: existing POST storage and budgets are preserved.
-- Claim and submission commit together. Only a digest, submission ID and expiry are stored here.
CREATE TABLE form_alert_claims (
  fingerprint TEXT PRIMARY KEY NOT NULL,
  submission_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX form_alert_claims_expiry ON form_alert_claims(expires_at);
