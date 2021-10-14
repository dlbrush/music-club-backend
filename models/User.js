const bcrypt = require('bcrypt');

const db = require('../db');
const { BCRYPT_WORK_FACTOR } = require('../config');

class User {
  constructor(username, email, admin, profileImgUrl) {
    this.username = username;
    this.email = email;
    this.admin = admin;
    this.profileImgUrl = profileImgUrl;
  }

  static async create(username, password, email, profileImgUrl, admin=false) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(`
      INSERT INTO users (username, password, email, profile_img_url, admin)
      VALUES ($1, $2, $3, $4, $5)
    `, [username, hashedPassword, email, profileImgUrl, admin]);
    const userRow = result.rows[0];
    return new User(userRow.username, userRow.email, userRow.admin, userRow.profile_img_url);
  }
}

export default User;