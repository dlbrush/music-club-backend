const db = require('../db');
const { getOptionalPostStrings } = require('../helpers/sql');

class Post {
  /**
   * @param {number} id 
   * @param {number} clubId 
   * @param {number} discogsId 
   * @param {number} votes 
   * @param {Date} postedAt 
   * @param {string} postedBy // corresponds to username
   * @param {string} content 
   * @param {string} recTracks 
   */
  constructor(id, clubId, discogsId, votes, postedAt, postedBy, content, recTracks) {
    this.id = id;
    this.clubId = clubId;
    this.discogsId = discogsId;
    this.votes = votes;
    this.postedAt = postedAt;
    this.postedBy = postedBy;
    if (content) this.content = content;
    if (recTracks) this.recTracks = recTracks;
  }

  // Static methods

  static async getAll(clubId) {
    const params = clubId ? [clubId] : [];
    const filterString = clubId ? 'WHERE club_id = $1' : '';

    const result = await db.query(`
      SELECT id, club_id AS "clubId", discogs_id AS "discogsId", votes, posted_at AS "postedAt", content
      FROM posts
      ${filterString}
    `, params);

    return result.rows.map(post => {
      return new Post(post.id, post.clubId, post.discogsId, post.votes, new Date(post.postedAt), post.content);
    })
  }

  static async get(id) {
    const result = await db.query(`
      SELECT id, club_id AS "clubId", discogs_id AS "discogsId", votes, posted_at AS "postedAt", content, rec_tracks AS "recTracks"
      FROM posts
      WHERE id=$1 
    `, [id]);
    const post = result.rows[0];
    if (post) {
      return new Post(post.id, post.clubId, post.discogsId, post.votes, new Date(post.postedAt), post.postedBy, post.content, post.recTracks);
    }
    // Returns undefined otherwise
  }

  static async create(clubId, discogsId, postedBy, recTracks, content) {
    const parameters = [clubId, discogsId, postedBy];
    const optional = getOptionalPostColumns(recTracks, content, parameters);
    const result = await db.query(`
      INSERT INTO posts (club_id, discogs_id, posted_by, posted_at${optional.columns})
      VALUES ($1, $2, $3, current_timestamp${optional.values})
      RETURNING id, club_id AS "clubId", discogs_id AS "discogsId", votes, posted_at AS "postedAt", posted_by AS "postedBy", rec_tracks AS "recTracks"
    `, parameters);
    const newPost = result.rows[0];
    return new Post(newPost.id, newPost.clubId, newPost.discogsId, newPost.votes, new Date(newPost.postedAt), newPost.postedBy, newPost.content, newPost.recTracks);
  }

  // Instance methods

  async save() {
    
  }

  async delete() {

  }
}

module.exports = Post;