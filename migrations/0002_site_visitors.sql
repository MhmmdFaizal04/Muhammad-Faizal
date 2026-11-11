CREATE TABLE IF NOT EXISTS site_visitors (
  id TEXT PRIMARY KEY,
  first_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  page_views INTEGER NOT NULL DEFAULT 1
);
