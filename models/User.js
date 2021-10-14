const bcrypt = require('bcrypt');

const db = require('../db');
const { BCRYPT_WORK_FACTOR } = require('../config');

class User {
  constructor(username, email, profileImgUrl, admin) {
    this.username = username;
    this.email = email;
    this.profileImgUrl = profileImgUrl;
    if (admin) this.admin = admin;
  }

  static async getAll() {
    const result = await db.query(`
      SELECT username, email, profile_img_url
      FROM users
    `);
    return result.rows.map(row => {
      return new User(row.username, row.email, row.profile_img_url)
    });
  }

  static async create(username, password, email, profileImgUrl, admin=false) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(`
      INSERT INTO users (username, password, email, profile_img_url, admin)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING username, email, profile_img_url, admin
    `, [username, hashedPassword, email, profileImgUrl, admin]);
    const userRow = result.rows[0];
    return new User(userRow.username, userRow.email, userRow.admin, userRow.profile_img_url);
  }
}

module.exports = User;