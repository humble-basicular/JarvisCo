-- Rebuild constraints without losing submissions or the event ID high-water mark.
CREATE TABLE offer_sequence_checkpoint (seq INTEGER NOT NULL);
INSERT INTO offer_sequence_checkpoint SELECT seq FROM sqlite_sequence WHERE name = 'events';
CREATE TABLE events_offer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT CHECK (code IS NULL OR (length(code) = 5 AND code NOT GLOB '*[^23456789abcdefghjkmnpqrstuvwxyz]*' AND substr(code,1,1) IN ('a','p'))),
  site TEXT CHECK (site IS NULL OR (length(site) BETWEEN 3 AND 32 AND substr(site,1,1) GLOB '[a-z]' AND site NOT GLOB '*[^a-z0-9-]*')),
  type TEXT NOT NULL CHECK (type IN ('click','view','scroll_proof','cta_sms','cta_call','pdf','arbcut','preview_cta','preview_request','callback_request','site_inquiry','job_request')),
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ua_class TEXT NOT NULL CHECK (ua_class IN ('human','bot')),
  CHECK ((site IS NOT NULL AND code IS NULL AND type IN ('cta_call','cta_sms','site_inquiry','job_request'))
    OR (site IS NULL AND type NOT IN ('site_inquiry','job_request') AND (code IS NOT NULL OR type IN ('preview_request','callback_request'))))
);
INSERT INTO events_offer(id,code,type,at,ua_class) SELECT id,code,type,at,ua_class FROM events;
UPDATE sqlite_sequence SET seq = max(seq, COALESCE((SELECT max(seq) FROM offer_sequence_checkpoint),0)) WHERE name = 'events_offer';
INSERT INTO sqlite_sequence(name,seq) SELECT 'events_offer', seq FROM offer_sequence_checkpoint
WHERE NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'events_offer');
CREATE TABLE submissions_offer (
  id TEXT PRIMARY KEY,
  event_id INTEGER NOT NULL UNIQUE REFERENCES events_offer(id),
  code TEXT,
  site TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('preview_request','callback_request','site_inquiry','job_request')),
  at TEXT NOT NULL,
  ua_class TEXT NOT NULL CHECK (ua_class IN ('human','bot')),
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  CHECK ((site IS NULL AND kind IN ('preview_request','callback_request')) OR (site IS NOT NULL AND code IS NULL AND kind IN ('site_inquiry','job_request')))
);
INSERT INTO submissions_offer(id,event_id,code,kind,at,ua_class,payload) SELECT id,event_id,code,kind,at,ua_class,payload FROM submissions;
DROP TABLE submissions;
DROP TABLE events;
ALTER TABLE events_offer RENAME TO events;
ALTER TABLE submissions_offer RENAME TO submissions;
DROP TABLE offer_sequence_checkpoint;
CREATE INDEX events_at_id ON events(at,id);
CREATE INDEX submissions_at ON submissions(at);
CREATE TABLE site_daily_budgets (
  site TEXT NOT NULL,
  day_start INTEGER NOT NULL,
  submissions INTEGER NOT NULL CHECK (submissions BETWEEN 1 AND 100),
  file_writes INTEGER NOT NULL CHECK (file_writes BETWEEN 0 AND 300),
  PRIMARY KEY (site,day_start),
  CHECK (site = '*' OR submissions <= 30)
);
