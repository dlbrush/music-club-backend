const db = require('../db');
const { createParamList } = require('../helpers/sql');

class Album {
  constructor(discogsId, year, artist, title, coverImgUrl) {
    this.discogsId = discogsId;
    this.year = year;
    this.artist = artist;
    this.title = title;
    this.coverImgUrl = coverImgUrl;
  }

  static async get(discogsId) {
    const result = await db.query(`
      SELECT discogs_id AS "discogsId", year, artist, title, cover_img_url AS "coverImgUrl"
      FROM albums
      WHERE discogs_id=$1
    `, [discogsId]);
    const album = result.rows[0];
    if (album) {
      return new Album(album.discogsId, album.year, album.artist, album.title, album.coverImgUrl);
    }
    // Returns undefined if nothing is found
  }

  static async getSome(discogsIds) {
    const whereClause = createParamList(discogsIds, 'discogs_id');
    const result = await db.query(`
      SELECT discogs_id AS "discogsId", year, artist, title, cover_img_url AS "coverImgUrl"
      FROM albums
      ${whereClause}
    `, discogsIds);
    return result.rows.map(album => {
      return new Album(album.discogsId, album.year, album.artist, album.title, album.coverImgUrl);
    })
  }

  static async create(discogsId, year, artist, title, coverImgUrl) {
    const result = await db.query(`
      INSERT INTO albums (discogs_id, year, artist, title, cover_img_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING discogs_id AS "discogsId", year, artist, title, cover_img_url AS "coverImgUrl"
    `, [discogsId, year, artist, title, coverImgUrl]);
    const album = result.rows[0];
    return new Album(album.discogsId, album.year, album.artist, album.title, album.coverImgUrl);
  }
};

module.exports = Album;