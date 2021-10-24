CREATE TABLE users (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  admin BOOLEAN NOT NULL,
  profile_img_url TEXT NOT NULL DEFAULT 'https://upload.wikimedia.org/wikipedia/commons/b/b6/12in-Vinyl-LP-Record-Angle.jpg'
);

CREATE TABLE clubs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  founded DATE NOT NULL,
  founder TEXT REFERENCES users ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL,
  banner_img_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
);

CREATE TABLE users_clubs (
  club_id INTEGER REFERENCES clubs ON DELETE CASCADE,
  username TEXT REFERENCES users ON DELETE CASCADE,
  PRIMARY KEY (club_id, username)
);

CREATE TABLE invitations (
  club_id INTEGER REFERENCES clubs ON DELETE CASCADE,
  username TEXT REFERENCES users ON DELETE CASCADE,
  sent_from TEXT NOT NULL REFERENCES users ON DELETE CASCADE,
  PRIMARY KEY (club_id, username)
);

CREATE TABLE albums (
  discogs_id INTEGER PRIMARY KEY,
  year INTEGER,
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  cover_img_url TEXT NOT NULL
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  club_id INTEGER NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  discogs_id INTEGER NOT NULL REFERENCES albums ON DELETE CASCADE,
  posted_at TIMESTAMP NOT NULL,
  posted_by TEXT NOT NULL REFERENCES users ON DELETE CASCADE,
  rec_tracks TEXT NOT NULL DEFAULT ''
);

CREATE TABLE votes (
  post_id INTEGER NOT NULL REFERENCES posts ON DELETE CASCADE,
  username TEXT REFERENCES users ON DELETE CASCADE,
  liked BOOLEAN NOT NULL,
  PRIMARY KEY (post_id, username)
);

CREATE TABLE albums_genres (
  discogs_id INTEGER NOT NULL REFERENCES albums ON DELETE CASCADE,
  genre TEXT NOT NULL
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  username TEXT REFERENCES users ON DELETE SET NULL,
  comment TEXT NOT NULL,
  post_id INTEGER NOT NULL REFERENCES posts ON DELETE CASCADE,
  posted_at TIMESTAMP NOT NULL
);
