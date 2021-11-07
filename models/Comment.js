const db = require('../db');

class Comment {
  constructor(id, username, comment, postId, postedAt) {
    this.id = id;
    this.username = username;
    this.comment = comment;
    this.postId = postId;
    this.postedAt = postedAt;
  }

  // Static methods
  static async getAll(postId) {
    const params = postId ? [postId] : [];
    const filterString = postId ? 'WHERE post_id = $1' : '';

    const result = await db.query(`
      SELECT id, username, comment, post_id AS "postId", posted_at AS "postedAt"
      FROM comments
      ${filterString}
      ORDER BY posted_at ASC
    `, params);

    return result.rows.map(comment => {
      return new Comment(comment.id, comment.username, comment.comment, comment.postId, new Date(comment.postedAt));
    });
  }

  static async get(id) {
    const result = await db.query(`
      SELECT id, username, comment, post_id AS "postId", posted_at AS "postedAt"
      FROM comments
      WHERE id=$1
      ORDER BY posted_at ASC
    `, [id]);

    const comment = result.rows[0];
    if (comment) {
      return new Comment(comment.id, comment.username, comment.comment, comment.postId, new Date(comment.postedAt))
    }
  }

  static async create(username, comment, postId) {
    const result = await db.query(`
      INSERT INTO comments (username, comment, post_id, posted_at)
      VALUES ($1, $2, $3, current_date)
      RETURNING id, username, comment, post_id AS "postId", posted_at AS "postedAt"
    `, [username, comment, postId]);
    const newComment = result.rows[0];
    return new Comment(newComment.id, newComment.username, newComment.comment, newComment.postId, new Date(newComment.postedAt));
  }

  // Instance methods
  async save() {
    const result = await db.query(`
      UPDATE comments
      SET comment=$1
      WHERE id=$2
      RETURNING comment
    `, [this.comment, this.id]);
    if (result.rows) {
      return `Updated comment ${this.id}.`;
    } else {
      throw new Error(`Unable to update comment ${this.id}.`);
    }
  }

  async delete() {
    const result = await db.query(`
      DELETE FROM comments
      WHERE id=$1
      RETURNING id
    `, [this.id]);
    if (result.rows) {
      return `Deleted comment ${this.id}.`;
    } else {
      throw new Error(`Unable to delete comment ${this.id}.`);
    }
  }
}

module.exports = Comment;