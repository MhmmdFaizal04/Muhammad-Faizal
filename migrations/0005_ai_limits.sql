CREATE TABLE IF NOT EXISTS ai_usage (
  bucket TEXT PRIMARY KEY,
  requests INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_expiry ON ai_usage(expires_at);
