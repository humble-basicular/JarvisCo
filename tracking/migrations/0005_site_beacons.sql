-- Site beacons: form_open / form_submit types and anonymous page context
-- (path, data-loc label, referrer class, mobile flag). No cookie, IP or visitor id.
-- Rebuild constraints without losing submissions or the event ID high-water mark.
CREATE TABLE beacon_sequence_checkpoint (seq INTEGER NOT NULL);
INSERT INTO beacon_sequence_checkpoint SELECT seq FROM sqlite_sequence WHERE name = 'events';
CREATE TABLE events_beacon (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT CHECK (code IS NULL OR (length(code) = 5 AND code NOT GLOB '*[^23456789abcdefghjkmnpqrstuvwxyz]*' AND substr(code,1,1) IN ('a','p'))),
  site TEXT CHECK (site IS NULL OR (length(site) BETWEEN 3 AND 32 AND substr(site,1,1) GLOB '[a-z]' AND site NOT GLOB '*[^a-z0-9-]*')),
  type TEXT NOT NULL CHECK (type IN ('click','view','scroll_proof','cta_sms','cta_call','pdf','arbcut','preview_cta','preview_request','callback_request','site_inquiry','job_request','form_open','form_submit')),
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ua_class TEXT NOT NULL CHECK (ua_class IN ('human','bot')),
  page TEXT CHECK (page IS NULL OR (site IS NOT NULL AND length(page) BETWEEN 1 AND 120 AND substr(page,1,1) = '/' AND page NOT GLOB '*[?# ]*')),
  loc TEXT CHECK (loc IS NULL OR (page IS NOT NULL AND length(loc) BETWEEN 1 AND 40 AND loc NOT GLOB '*[^a-z0-9_-]*')),
  ref TEXT CHECK (ref IS NULL OR (page IS NOT NULL AND ref IN ('direct','search','social','internal','other'))),
  mobile INTEGER CHECK (mobile IS NULL OR (page IS NOT NULL AND mobile IN (0,1))),
  CHECK ((page IS NULL) = (ref IS NULL) AND (page IS NULL) = (mobile IS NULL)),
  CHECK ((site IS NOT NULL AND code IS NULL AND type IN ('cta_call','cta_sms','site_inquiry','job_request','form_open','form_submit'))
    OR (site IS NULL AND type NOT IN ('site_inquiry','job_request','form_open','form_submit') AND (code IS NOT NULL OR type IN ('preview_request','callback_request'))))
);
INSERT INTO events_beacon(id,code,site,type,at,ua_class) SELECT id,code,site,type,at,ua_class FROM events;
UPDATE sqlite_sequence SET seq = max(seq, COALESCE((SELECT max(seq) FROM beacon_sequence_checkpoint),0)) WHERE name = 'events_beacon';
INSERT INTO sqlite_sequence(name,seq) SELECT 'events_beacon', seq FROM beacon_sequence_checkpoint
WHERE NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'events_beacon');
CREATE TABLE submissions_beacon (
  id TEXT PRIMARY KEY,
  event_id INTEGER NOT NULL UNIQUE REFERENCES events_beacon(id),
  code TEXT,
  site TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('preview_request','callback_request','site_inquiry','job_request')),
  at TEXT NOT NULL,
  ua_class TEXT NOT NULL CHECK (ua_class IN ('human','bot')),
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  CHECK ((site IS NULL AND kind IN ('preview_request','callback_request')) OR (site IS NOT NULL AND code IS NULL AND kind IN ('site_inquiry','job_request')))
);
INSERT INTO submissions_beacon(id,event_id,code,site,kind,at,ua_class,payload) SELECT id,event_id,code,site,kind,at,ua_class,payload FROM submissions;
DROP TABLE submissions;
DROP TABLE events;
ALTER TABLE events_beacon RENAME TO events;
ALTER TABLE submissions_beacon RENAME TO submissions;
DROP TABLE beacon_sequence_checkpoint;
CREATE INDEX events_at_id ON events(at,id);
CREATE INDEX submissions_at ON submissions(at);
