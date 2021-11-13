const db = require('../db');

class Invitation {
  constructor(clubId, username, sentFrom) {
    this.clubId = clubId;
    this.username = username;
    this.sentFrom = sentFrom;
  }

  // Static methods

  static async getAll(username) {
    const params = username ? [username] : [];
    const filterString = username ? 'WHERE username = $1' : '';

    const result = await db.query(`
      SELECT club_id AS "clubId", username, sent_from AS "sentFrom"
      FROM invitations
      ${filterString}
    `, params);

    return result.rows.map(invitation => {
      return new Invitation(invitation.clubId, invitation.username, invitation.sentFrom);
    });
  }

  static async create(clubId, username, sentFrom) {
    const result = await db.query(`
      INSERT INTO invitations (club_id, username, sent_from)
      VALUES ($1, $2, $3)
      RETURNING club_id AS "clubId", username, sent_from AS "sentFrom"
    `, [clubId, username, sentFrom]);
    const newInvitation = result.rows[0];
    return new Invitation(newInvitation.clubId, newInvitation.username, newInvitation.sentFrom);
  }

  // Instance method

  async delete() {
    const result = await db.query(`
      DELETE FROM invitations
      WHERE club_id=$1 AND username=$2
      RETURNING club_id AS "clubId", username
    `, [this.clubId, this.username]);
    const deleted = result.rows[0];
    if (deleted) {
      return `Deleted invitation to club with ID ${deleted.clubId} for ${deleted.username}`;
    } else {
      throw new Error(`Unable to delete invitation to club with ID ${this.clubId} for ${this.username}`);
    }
  }
}

module.exports = Invitation;