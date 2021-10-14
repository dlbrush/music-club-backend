require('dotenv').config();

// Server config
const PORT = 3000;

// Authentication
const SECRET_KEY = process.env.SECRET_KEY;

// Speed up bcrypt work factor for testing
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === 'test' ? 1 : 12;

function getDatabaseUri() {
  return (process.env.NODE_ENV === "test")
      ? `music_club_test`
      : process.env.DATABASE_URL || `music_club`;
}

module.exports = {
  PORT,
  SECRET_KEY,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri
};