const db = require('../db');
const { handleVoteFilters } = require('../helpers/sql');

class Vote {
  constructor(postId, username, liked) {
    this.postId = postId;
    this.username = username;
    this.liked = liked;
  }

  // Static methods

  static async getAll(postId, username) {
    const filters = handleVoteFilters(postId, username);
    const result = await db.query(`
      SELECT post_id AS "postId", username, liked
      FROM votes
      ${filters.string}
    `, filters.parameters);
    return result.rows.map(vote => {
      return new Vote(vote.postId, vote.username, vote.liked);
    })
  }

  static async get(postId, username) {
    const result = await db.query(`
      SELECT post_id as "postId", username, liked
      FROM votes
      WHERE post_id=$1 AND username=$2
    `, [postId, username]);
    const vote = result.rows[0];
    if (vote) {
      return new Vote(vote.postId, vote.username, vote.liked);
    }
  }

  static async create(postId, username, liked) {
    const result = await db.query(`
      INSERT INTO votes (post_id, username, liked)
      VALUES ($1, $2, $3)
      RETURNING post_id AS "postId", username, liked
    `, [postId, username, liked]);
    const vote = result.rows[0];
    return new Vote(vote.postId, vote.username, vote.liked);
  }

  // Instance methods

  async save() {
    const result = await db.query(`
      UPDATE votes
      SET liked=$1
      WHERE post_id=$2 AND username=$3
      RETURNING liked
    `, [this.liked, this.postId, this.username]);
    if (result.rows[0]) {
      const resultString = result.rows[0].liked ? 'upvoted' : 'downvoted';
      return `Successfully changed vote by ${this.username} on post ${this.postId}. User has now ${resultString} this post.`;
    } else {
      return `Unable to change vote by ${this.username} on post ${this.postId}`;
    }
  }

  async delete() {
    const result = await db.query(`
      DELETE FROM votes
      WHERE post_id=$1 AND username=$2
      RETURNING post_id
    `, [this.postId, this.username]);
    if (result.rows[0]) {
      return `Successfully deleted vote by ${this.username} on post ${this.postId}`;
    } else {
      return `Unable to delete vote by ${this.username} on post ${this.postId}`;
    }
  }
}

module.exports = Vote;