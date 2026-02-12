CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE auth_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'magic_link' or 'session'
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  used_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_auth_tokens_user ON auth_tokens(user_id);

CREATE TABLE user_data (
  user_id TEXT PRIMARY KEY,
  profile JSON NOT NULL DEFAULT '{}',
  settings JSON NOT NULL DEFAULT '{}',
  personal_records JSON NOT NULL DEFAULT '{}',
  custom_workouts JSON NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE workout_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  data JSON NOT NULL,
  completed_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_history_user ON workout_history(user_id, completed_at);
