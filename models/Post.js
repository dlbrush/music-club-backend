const db = require('../db');
const { getOptionalPostColumns, createParamList } = require('../helpers/sql');

class Post {
  /**
   * @param {number} id 
   * @param {number} clubId 
   * @param {number} discogsId
   * @param {Date} postedAt 
   * @param {string} postedBy // corresponds to username
   * @param {string} content 
   * @param {string} recTracks 
   */
  constructor(id, clubId, discogsId, postedAt, postedBy, content, recTracks) {
    this.id = id;
    this.clubId = clubId;
    this.discogsId = discogsId;
    this.postedAt = postedAt;
    this.postedBy = postedBy;
    this.content = content;
    this.recTracks = recTracks;
  }

  // Static methods

  static async getAll(clubId) {
    const params = clubId ? [clubId] : [];
    const filterString = clubId ? 'WHERE club_id = $1' : '';

    const result = await db.query(`
      SELECT id, club_id AS "clubId", discogs_id AS "discogsId", posted_by as "postedBy", posted_at AS "postedAt", content
      FROM posts
      ${filterString}
      ORDER BY id DESC
    `, params);

    return result.rows.map(post => {
      return new Post(post.id, post.clubId, post.discogsId, new Date(post.postedAt), post.postedBy, post.content);
    });
  }

  /**
   * Get all posts for multiple clubs - used to show user recent posts from their clubs
   * @param {number[]} clubIds 
   */
  static async getAllForClubs(clubIds) {
    // Return empty array if no club IDs passed - otherwise query will have no where clause and return all posts
    if (!clubIds.length) return [];

    const filterString = createParamList(clubIds, 'club_id');

    const result = await db.query(`
      SELECT id, club_id AS "clubId", discogs_id AS "discogsId", posted_by as "postedBy", posted_at AS "postedAt", content
      FROM posts
      ${filterString}
      ORDER BY id DESC
    `, clubIds);

    return result.rows.map(post => {
      return new Post(post.id, post.clubId, post.discogsId, new Date(post.postedAt), post.postedBy, post.content);
    });
  }

  static async get(id) {
    const result = await db.query(`
      SELECT id, club_id AS "clubId", discogs_id AS "discogsId", posted_at AS "postedAt", posted_by AS "postedBy", content, rec_tracks AS "recTracks"
      FROM posts
      WHERE id=$1 
    `, [id]);
    const post = result.rows[0];
    if (post) {
      return new Post(post.id, post.clubId, post.discogsId, new Date(post.postedAt), post.postedBy, post.content, post.recTracks);
    }
    // Returns undefined otherwise
  }

  static async create(clubId, discogsId, postedBy, recTracks, content) {
    const parameters = [clubId, discogsId, postedBy];
    const optional = getOptionalPostColumns(recTracks, content, parameters);
    const result = await db.query(`
      INSERT INTO posts (club_id, discogs_id, posted_by, posted_at${optional.columns})
      VALUES ($1, $2, $3, current_timestamp${optional.values})
      RETURNING id, club_id AS "clubId", discogs_id AS "discogsId", posted_at AS "postedAt", posted_by AS "postedBy", content, rec_tracks AS "recTracks"
    `, parameters);
    const newPost = result.rows[0];
    return new Post(newPost.id, newPost.clubId, newPost.discogsId, new Date(newPost.postedAt), newPost.postedBy, newPost.content, newPost.recTracks);
  }

  // Instance methods

  async save() {
    const result = await db.query(`
      UPDATE posts
      SET content=$1, rec_tracks=$2
      WHERE id=$3
      RETURNING id
    `, [this.content, this.recTracks, this.id]);
    if (result.rows) {
      return `Updated post ${this.id}.`;
    } else {
      throw new Error(`Unable to update post ${this.id}.`);
    }
  }

  async delete() {
    const result = await db.query(`
      DELETE FROM posts
      WHERE id=$1
      RETURNING id
    `, [this.id]);
    if (result.rows) {
      return `Deleted post ${this.id}.`;
    } else {
      throw new Error(`Unable to delete post ${this.id}.`);
    }
  }
}

module.exports = Post;