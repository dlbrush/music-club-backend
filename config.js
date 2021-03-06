require('dotenv').config();

// Server config
const PORT = process.env.PORT || 3000;
const FRONTEND_URI = process.env.FRONTEND_URI;

// Authentication
const SECRET_KEY = process.env.SECRET_KEY || 'not_a_secret';

// Speed up bcrypt work factor for testing
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === 'test' ? 1 : 12;

function getDatabaseUri() {
  return (process.env.NODE_ENV === "test")
      ? `music_club_test`
      : process.env.DATABASE_URL || `music_club`;
}

// Millisecond value for how long user's auth cookie should last
const AUTH_DURATION = 86400000 //24hr

// Discogs API info
const DISCOGS_USER_AGENT = process.env.DISCOGS_USER_AGENT;
const DISCOGS_ACCESS_TOKEN = process.env.DISCOGS_ACCESS_TOKEN;

module.exports = {
  PORT,
  FRONTEND_URI,
  SECRET_KEY,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
  DISCOGS_ACCESS_TOKEN,
  DISCOGS_USER_AGENT,
  AUTH_DURATION
};