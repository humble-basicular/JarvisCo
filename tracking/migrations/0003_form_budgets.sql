-- Global daily upload/submission budget. Form minute buckets use form: keys.
CREATE TABLE form_daily_budgets (
  day_start INTEGER PRIMARY KEY,
  submissions INTEGER NOT NULL CHECK (submissions BETWEEN 1 AND 50),
  file_bytes INTEGER NOT NULL CHECK (file_bytes BETWEEN 0 AND 314572800)
);
