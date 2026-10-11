CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL CHECK (
    length(code) = 5 AND code NOT GLOB '*[^23456789abcdefghjkmnpqrstuvwxyz]*'
    AND substr(code, 1, 1) = 'a'
  ),
  type TEXT NOT NULL CHECK (type IN ('click', 'view', 'scroll_proof', 'cta_sms', 'cta_call', 'pdf', 'arbcut')),
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ua_class TEXT NOT NULL CHECK (ua_class IN ('human', 'bot'))
);
CREATE INDEX events_at_id ON events(at, id);

CREATE TABLE rate_limits (
  code TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  requests INTEGER NOT NULL CHECK (requests BETWEEN 1 AND 61),
  PRIMARY KEY (code, window_start)
) WITHOUT ROWID;
CREATE INDEX rate_limits_window ON rate_limits(window_start);

CREATE TABLE maintenance (
  key TEXT PRIMARY KEY,
  next_at INTEGER NOT NULL
) WITHOUT ROWID;
