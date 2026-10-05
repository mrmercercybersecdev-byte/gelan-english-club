-- Organiser-controlled game releases and small, account-owned profile photos.
CREATE TABLE IF NOT EXISTS game_settings (
  game_id varchar(40) PRIMARY KEY,
  published boolean NOT NULL DEFAULT false,
  min_level integer NOT NULL DEFAULT 1 CHECK (min_level BETWEEN 1 AND 30),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_avatars (
  user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mime varchar(30) NOT NULL DEFAULT 'image/jpeg',
  data bytea NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO game_settings (game_id, published, min_level)
VALUES
  ('crossword', true, 1), ('scramble', true, 1), ('hangman', true, 1), ('twister', true, 1),
  ('idiom-mixup', false, 1), ('punctuation-panic', false, 1), ('rhyme-time', false, 1), ('odd-one-out', false, 1),
  ('emoji-decoder', false, 2), ('verb-vortex', false, 2), ('plural-panic', false, 3), ('polite-or-chaos', false, 3)
ON CONFLICT (game_id) DO NOTHING;
