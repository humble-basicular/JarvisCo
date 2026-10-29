-- Separate from events/submissions: strict CRM schema remains unchanged.
CREATE TABLE inquiry_context (
  submission_id TEXT PRIMARY KEY NOT NULL,
  site TEXT NOT NULL CHECK (site IN ('meselektra','vensland')),
  at TEXT NOT NULL,
  source TEXT NOT NULL,
  page TEXT,
  landing_path TEXT,
  elapsed_ms INTEGER
);
CREATE INDEX inquiry_context_site_at ON inquiry_context(site, at);
CREATE TABLE inquiry_security (
  site TEXT NOT NULL CHECK (site IN ('meselektra','vensland')),
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  outcome TEXT NOT NULL,
  reason TEXT NOT NULL
);
CREATE INDEX inquiry_security_site_at ON inquiry_security(site, at);
CREATE TABLE inquiry_notifications (
  site TEXT NOT NULL CHECK (site IN ('meselektra','vensland')),
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  status TEXT NOT NULL CHECK (status IN ('attempt','sent','failure'))
);
CREATE INDEX inquiry_notifications_site_at ON inquiry_notifications(site, at);
