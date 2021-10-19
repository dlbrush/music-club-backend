const bcrypt = require('bcrypt');

const db = require('../db');
const { BCRYPT_WORK_FACTOR } = require('../config');
const { handleUserFilters, createParamList } = require('../helpers/sql');
const { generateUserToken } = require('../helpers/auth');

class User {
  constructor(username, email, profileImgUrl, admin) {
    this.username = username;
    this.email = email;
    this.profileImgUrl = profileImgUrl;
    if (admin !== undefined) this.admin = admin;
  }

  // Static methods

  /**
   * Get all users from the DB.
   * Optionally, pass a club ID to only get users in the club with the passed ID.
   * @param {number} clubId 
   * @returns {User[]} (with no admin)
   */
  static async getAll(username) {
    // Include club filter string and parameter only if an ID has been passed
    const filters = handleUserFilters(username);

    const result = await db.query(`
      SELECT username, email, profile_img_url
      FROM users
      ${filters.string}
      ORDER BY username ASC
    `, filters.parameters);
    return result.rows.map(row => {
      return new User(row.username, row.email, row.profile_img_url)
    });
  }

  static async getSome(usernames) {
    // Include club filter string and parameter only if an ID has been passed
    const paramList = createParamList(usernames);

    const result = await db.query(`
      SELECT username, email, profile_img_url
      FROM users
      ${paramList}
      ORDER BY username ASC
    `, usernames);
    return result.rows.map(row => {
      return new User(row.username, row.email, row.profile_img_url)
    });
  }

  /**
   * Get details on a specific user with username or email
   * Username should be primary search method, but email can be checked for user registration
   * Returns undefined if user not found
   * @param {string} username 
   * @returns {User} (with admin)
   */
  static async get(username, email) {
    const result = await db.query(`
      SELECT username, email, profile_img_url, admin
      FROM users
      WHERE username = $1 OR email = $2
    `, [username, email]);
    const user = result.rows[0];
    if (user) {
      return new User(user.username, user.email, user.profile_img_url, user.admin);
    } 
  }

  /**
   * Create a user with a hashed password and insert into the users table.
   * Returns the created user.
   * @param {string} username 
   * @param {string} password 
   * @param {string} email 
   * @param {string} profileImgUrl 
   * @param {boolean} admin 
   * @returns {User} (with admin)
   */
  static async create(username, password, email, profileImgUrl, admin=false) {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    // Include profile image in query only if one was passed
    const profImgColumn = profileImgUrl ? ', profile_img_url' : '';
    const profImgSerialized = profileImgUrl ? ', $5' : '';

    // Create parameter array, and only include profile image if it was included
    const parameters = [username, hashedPassword, email, admin];
    if (profileImgUrl) parameters.push(profileImgUrl);

    // Insert into db
    const result = await db.query(`
      INSERT INTO users (username, password, email, admin${profImgColumn})
      VALUES ($1, $2, $3, $4${profImgSerialized})
      RETURNING username, email, admin,  profile_img_url
    `, parameters);
    const userRow = result.rows[0];
    return new User(userRow.username, userRow.email, userRow.profile_img_url, userRow.admin);
  }

  /**
   * Register a new user. User will not be an admin. First checks if the user is creating a duplicate user by username Returns a JWT containing the user's username and admin status.
   * @param {*} username 
   * @param {*} password 
   * @param {*} email 
   * @param {*} profileImgUrl 
   * @returns {string} JWT with user info
   */
  static async register(username, password, email, profileImgUrl) {
    const newUser = await User.create(username, password, email, profileImgUrl);
    return generateUserToken(newUser.username, newUser.admin);
  }

  static async checkExisting(username, email) {
    const existingUser = await User.get(username, email);
    if (existingUser) {
      let message;
      if (existingUser.username === username && existingUser.email === email) {
        message = `User with username ${username} and email ${email} already exists.`
      } else if (existingUser.email === email) {
        message = `User with email ${email} already exists.`
      } else {
        message = `User with username ${username} already exists.`
      }
      // Throw generic error with message about duplicate user
      throw new Error(message);
    }
  }

  // Instance methods

  async delete() {
    const result = await db.query(`
      DELETE FROM users
      WHERE username = $1
      RETURNING username
    `, [this.username]);
    if (result.rows) {
      return `Deleted user ${this.username}.`;
    } else {
      throw new Error(`Unable to delete user ${this.username}`);
    }
  }

  async save() {
    const result = await db.query(`
      UPDATE users
      SET email=$1, profile_img_url=$2
      WHERE username = $3
    `, [this.email, this.profileImgUrl, this.username]);
    return `Updated user ${this.username}.`;
  }
}

module.exports = User;