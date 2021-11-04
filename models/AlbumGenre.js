const db = require('../db');
const { makeGenreValuesList } = require('../helpers/sql');

class AlbumGenre {
  constructor(discogsId, genre) {
    this.discogsId = discogsId;
    this.genre = genre;
  }

  static async getForAlbum(discogsId) {
    const result = await db.query(`
      SELECT discogs_id AS "discogsId", genre
      FROM albums_genres
      WHERE discogs_id=$1
    `, [discogsId]);
    return result.rows.map(albumGenre => {
      return new AlbumGenre(albumGenre.discogsId, albumGenre.genre);
    });
  }

  static async create(discogsId, genre) {
    const result = await db.query(`
      INSERT INTO albums_genres (discogs_id, genre)
      VALUES ($1, $2)
      RETURNING discogs_id AS "discogsId", genre
    `, [discogsId, genre]);
    const albumGenre = result.rows[0];
    return new AlbumGenre(albumGenre.discogsId, albumGenre.genre);
  }

  /**
   * 
   * @param {number} discogsId 
   * @param {string[]} genres 
   */
  static async createMany(discogsId, genres) {
    const valuesList = makeGenreValuesList(genres);
    const result = await db.query(`
      INSERT INTO albums_genres (discogs_id, genre)
      ${valuesList}
      RETURNING discogs_id AS "discogsId", genre
    `, [discogsId, ...genres]);
    return result.rows.map(albumGenre => {
      return new AlbumGenre(albumGenre.discogsId, albumGenre.genre);
    });
  }
};

module.exports = AlbumGenre;