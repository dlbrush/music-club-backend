require('dotenv').config();

const PORT = 3000;

// Speed up bcrypt work factor for testing
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === 'test' ? 1 : 12;

const DB_URI = 'postgresql://'

// Can't figure out why jobly doesn't need a full URI = going to try without
// function getDatabaseUri() {
//   return (process.env.NODE_ENV === "test")
//       ? `${DB_URI}music_club_test`
//       : process.env.DATABASE_URL || `${DB_URI}music_club`;
// }

function getDatabaseUri() {
  return (process.env.NODE_ENV === "test")
      ? `music_club_test`
      : process.env.DATABASE_URL || `music_club`;
}

module.exports = {
  PORT,
  getDatabaseUri
};