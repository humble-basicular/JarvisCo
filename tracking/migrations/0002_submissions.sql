-- Preserve existing IDs and the AUTOINCREMENT high-water mark, including IDs
-- already removed by retention. No existing event is discarded.
CREATE TABLE event_sequence_checkpoint (seq INTEGER NOT NULL);
INSERT INTO event_sequence_checkpoint SELECT seq FROM sqlite_sequence WHERE name = 'events';
ALTER TABLE events RENAME TO events_before_funnel;
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT CHECK (
    code IS NULL OR (length(code) = 5 AND code NOT GLOB '*[^23456789abcdefghjkmnpqrstuvwxyz]*'
    AND substr(code, 1, 1) IN ('a', 'p'))
  ),
  type TEXT NOT NULL CHECK (type IN ('click', 'view', 'scroll_proof', 'cta_sms', 'cta_call', 'pdf', 'arbcut', 'preview_cta', 'preview_request', 'callback_request')),
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ua_class TEXT NOT NULL CHECK (ua_class IN ('human', 'bot')),
  CHECK (code IS NOT NULL OR type IN ('preview_request', 'callback_request'))
);
INSERT INTO events(id, code, type, at, ua_class) SELECT id, code, type, at, ua_class FROM events_before_funnel;
UPDATE sqlite_sequence SET seq = max(seq, COALESCE((SELECT max(seq) FROM event_sequence_checkpoint), 0)) WHERE name = 'events';
DROP TABLE events_before_funnel;
DROP TABLE event_sequence_checkpoint;
CREATE INDEX events_at_id ON events(at, id);
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  event_id INTEGER NOT NULL UNIQUE REFERENCES events(id),
  code TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('preview_request', 'callback_request')),
  at TEXT NOT NULL,
  ua_class TEXT NOT NULL CHECK (ua_class IN ('human', 'bot')),
  payload TEXT NOT NULL CHECK (json_valid(payload))
);
CREATE INDEX submissions_at ON submissions(at);
