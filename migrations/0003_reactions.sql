CREATE TABLE IF NOT EXISTS site_reactions (
  target_type TEXT NOT NULL CHECK (target_type IN ('project', 'certificate')),
  target_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'fire', 'clap')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (target_type, target_id, visitor_id),
  FOREIGN KEY (visitor_id) REFERENCES site_visitors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_site_reactions_target ON site_reactions(target_type, target_id);
