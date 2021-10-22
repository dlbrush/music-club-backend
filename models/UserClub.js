const db = require('../db');
const { handleUserClubFilters } = require('../helpers/sql');

class UserClub {
  constructor(username, clubId) {
    this.username = username;
    this.clubId = clubId;
  }

  // Static methods

  static async getAll(username, clubId) {
    const filters = handleUserClubFilters(username, clubId);
    const result = await db.query(`
      SELECT username, club_id AS "clubId"
      FROM users_clubs
      ${filters.string}
    `, filters.parameters);
    return result.rows.map(row => {
      return new UserClub(row.username, row.clubId);
    });
  }

  static async get(username, clubId) {
    const result = await db.query(`
      SELECT username, club_id AS "clubId"
      FROM users_clubs
      WHERE username=$1 AND club_id=$2
    `, [username, clubId]);
    const userClub = result.rows[0];
    if (userClub) {
      return new UserClub(userClub.username, userClub.clubId)
    }
  }

  static async create(username, clubId) {
    const result = await db.query(`
      INSERT INTO users_clubs (username, club_id)
      VALUES ($1, $2)
      RETURNING username, club_id AS "clubId"
    `, [username, clubId]);
    const userClub = result.rows[0];
    if (userClub) {
      return new UserClub(userClub.username, userClub.clubId)
    }
  }

  // Instance methods

  async delete() {
    const result = await db.query(`
      DELETE FROM users_clubs
      WHERE username=$1 AND club_id=$2
      RETURNING username, club_id AS "clubId"
    `, [this.username, this.clubId]);
    const deleted = result.rows[0];
    if (deleted) {
      return `Deleted user ${deleted.username} from club ${deleted.clubId}`;
    } else {
      throw new Error(`Unable to delete ${this.username} from club ${this.clubId}`);
    }
  }
  
}

module.exports = UserClub;