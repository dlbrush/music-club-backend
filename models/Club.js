const { ParameterStatusMessage } = require('pg-protocol/dist/messages');
const db = require('../db');
const User = require('./User');

class Club {
  /**
   * Represents an object with the properties of a Club row in the database
   * @param {number} id 
   * @param {string} name 
   * @param {string} description 
   * @param {User} founded 
   * @param {User} founder 
   * @param {string} bannerImgUrl
   * @returns {Club}
   */
  constructor(id, name, description, founded, founder, bannerImgUrl) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.founded = founded;
    this.founder = founder;
    this.bannerImgUrl = bannerImgUrl;
  }

  // Static methods

  static async getAll() {

  }

  static async get(clubId) {
    
  }

  static async create(name, description, founder, bannerImgUrl) {
    // Create a date object for the moment this club is created
    const now = new Date();

    // Include column and parameter for banner image only if one was passed
    const bannerColumnName = ', banner_img_url' || '';
    const bannerParameter = bannerImgUrl ? ', $5' : '';

    const parameters = [name, description, founder.username];
    if (bannerImgUrl) parameters.push(bannerImgUrl);

    const result = db.query(`
      INSERT INTO clubs (name, description, founded, founder${bannerColumnName})
      VALUES $1, $2, $3, $4${bannerParameter}
      RETURNING id, name, description, founded, founder, banner_img_url
    `);
  }

  // Instance methods

  async delete() {

  }

  async save() {

  }
}

module.exports = User;