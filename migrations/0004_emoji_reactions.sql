CREATE TABLE site_reactions_new (
  target_type TEXT NOT NULL CHECK (target_type IN ('project', 'certificate')),
  target_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (target_type, target_id, visitor_id),
  FOREIGN KEY (visitor_id) REFERENCES site_visitors(id) ON DELETE CASCADE
);

INSERT INTO site_reactions_new (target_type, target_id, visitor_id, reaction_type, created_at, updated_at)
SELECT target_type, target_id, visitor_id,
  CASE reaction_type
    WHEN 'heart' THEN '💚'
    WHEN 'fire' THEN '🔥'
    WHEN 'clap' THEN '👏'
    ELSE reaction_type
  END,
  created_at, updated_at
FROM site_reactions;

DROP TABLE site_reactions;
ALTER TABLE site_reactions_new RENAME TO site_reactions;
CREATE INDEX idx_site_reactions_target ON site_reactions(target_type, target_id);
