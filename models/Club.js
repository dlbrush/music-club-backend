const db = require('../db');
const { handleClubFilters, createParamList } = require('../helpers/sql');
const User = require('./User');

class Club {
  /**
   * Represents an object with the properties of a Club row in the database
   * @param {number} id 
   * @param {string} name 
   * @param {string} description 
   * @param {Date} founded 
   * @param {string} founder Username for User table
   * @param {boolean} isPublic
   * @param {string} bannerImgUrl
   * @param {User[]} members
   * @returns {Club}
   */
  constructor(id, name, description, founder, isPublic, founded, bannerImgUrl, members) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.founder = founder;
    this.isPublic = isPublic;
    // Properties that may not always be passed
    if (founded) this.founded = founded;
    if (bannerImgUrl) this.bannerImgUrl = bannerImgUrl;
    if (members) this.members = members;
  }

  // Static methods

  /**
   * Return all clubs in the database. 
   * Pass isPublic = true to return only public clubs
   * Pass a name to search by name
   * @param {boolean} isPublic 
   * @param {string} name
   * @returns {Club[]} 
   */
  static async getAll(isPublic, name) {
    const filters = handleClubFilters(isPublic, name);

    const result = await db.query(`
      SELECT id, name, description, founder, is_public
      FROM clubs
      ${filters.string}
      ORDER BY id ASC
    `, filters.parameters);

    return result.rows.map(club => {
      return new Club(club.id, club.name, club.description, club.founder, club.is_public)
    })
  }

  /**
   * Return clubs matching passed IDs
   * @param {number[]} clubIds 
   * @returns {Club[]}
   */
   static async getSome(clubIds) {
    const whereClause = createParamList(clubIds, 'id');

    const result = await db.query(`
      SELECT id, name, description, founder, is_public
      FROM clubs
      ${whereClause}
      ORDER BY id ASC
    `, clubIds);

    return result.rows.map(club => {
      return new Club(club.id, club.name, club.description, club.founder, club.is_public)
    })
  }

  /**
   * Return all details of a specific club
   * @param {number} clubId 
   */
  static async get(clubId) {
    const result = await db.query(`
      SELECT id, 
             name, 
             description, 
             founder, 
             is_public AS "isPublic", 
             founded, 
             banner_img_url AS "bannerImgUrl"
      FROM clubs
      WHERE id = $1
    `, [clubId]);
    const clubInfo = result.rows[0];
    if (clubInfo) {
      // Get club members if there are any
      // const members = await MembershipService.getClubMembers(clubId);
      return new Club(clubInfo.id, clubInfo.name, clubInfo.description, clubInfo.founder, clubInfo.isPublic, new Date(clubInfo.founded), clubInfo.bannerImgUrl);
    }
    // Returns undefined if no club found
  }

  static async create(name, description, founder, isPublic, bannerImgUrl) {
    // Include column and parameter for banner image only if one was passed
    const bannerColumnName = bannerImgUrl ? ', banner_img_url' : '';
    const bannerParameter = bannerImgUrl ? ', $5' : '';

    const parameters = [name, description, founder.username, isPublic];
    if (bannerImgUrl) parameters.push(bannerImgUrl);

    const result = await db.query(`
      INSERT INTO clubs (name, description, founded, founder, is_public${bannerColumnName})
      VALUES ($1, $2, current_date, $3, $4${bannerParameter})
      RETURNING id, name, description, founded, founder, is_public AS "isPublic", banner_img_url AS "bannerImgUrl"
    `, parameters);

    const newClub = result.rows[0];
    return new Club(newClub.id, newClub.name, newClub.description, newClub.founder, newClub.isPublic, new Date(newClub.founded), newClub.bannerImgUrl);
  }

  // Instance methods

  async delete() {
    const result = await db.query(`
      DELETE FROM clubs
      WHERE id = $1
      RETURNING id, name
    `, [this.id]);
    if (result.rows) {
      return `Deleted club ${this.name}. (ID: ${this.id})`;
    } else {
      throw new Error(`No club deleted. (ID: ${this.id})`);
    }
  }

  async save() {
    const result = await db.query(`
      UPDATE clubs
      SET name=$1, description=$2, banner_img_url=$3
      WHERE id = $4
      RETURNING id
    `, [this.name, this.description, this.bannerImgUrl, this.id]);
    if (result.rows) {
      return `Updated club ${this.name}. (ID: ${this.id})`;
    } else {
      throw new Error(`Unable to update club ${this.name}. (ID: ${this.id})`);
    }
  }
}

module.exports = Club;