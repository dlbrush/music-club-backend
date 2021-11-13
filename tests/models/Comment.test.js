const db = require('../../db');
const Comment = require('../../models/Comment');
const { seedDb, clearDb } = require('../setup.js');

describe('Comment model', () => {
  // Declare test items
  let comment1, comment2, post1, user1;

  beforeEach(async () => {
    const items = await seedDb();
    comment1 = items.comment1;
    comment2 = items.comment2;
    post1 = items.post1;
    user1 = items.user1;
  });

  afterEach(async () => {
    await clearDb();
  });

  afterAll(async () => {
    await db.end();
  })

  describe('#getAll', () => {
    it('Returns all comments with expected properties when no arguments passed, in ascending post time order', async () => {
      const comments = await Comment.getAll();
      expect(comments.length).toEqual(2);
      expect(comments).toEqual([comment1, comment2]);
    });

    it('Returns only comments made for passed post ID', async () => {
      const comments = await Comment.getAll(post1.id);
      expect(comments.length).toEqual(1);
      expect(comments[0]).toEqual(comment1);
    });

    it('Returns empty array if no matches to filters', async () => {
      const comments = await Comment.getAll(9999);
      expect(comments).toEqual([]);
    });
  });

  describe('#get', () => {
    it('Returns comment matching passed id', async () => {
      const comment = await Comment.get(comment1.id);
      expect(comment).toEqual(comment1);
    });

    it('Returns undefined if no comment with that ID', async () => {
      const comment = await Comment.get(9999);
      expect(comment).toEqual(undefined);
    });
  });

  describe('#create', () => {
    it('Returns comment with all passed attributes', async () => {
      const comment = await Comment.create(user1.username, 'This is great', post1.id);
      expect(comment).toEqual({
        id: expect.any(Number),
        comment: 'This is great',
        username: user1.username,
        postId: post1.id,
        postedAt: expect.any(Date)
      });
    });

    it('Adds comment to database', async () => {
      const comment = await Comment.create(user1.username, 'This is great', post1.id);
      const dbComment = await Comment.get(comment.id);
      expect(dbComment).toEqual(comment);
    });
  });

  describe('#delete', () => {
    it('Returns success message on success', async () => {
      const msg = await comment1.delete();
      expect(msg).toEqual(`Deleted comment ${comment1.id}.`);
    });

    it('Removes comment from DB', async () => {
      await comment1.delete();
      const comment = await Comment.get(comment1.id);
      expect(comment).toEqual(undefined);
    });

    it('Throws error if comment object does not match post in DB', async () => {
      try {
        const badComment = new Comment(9999);
        await badComment.delete();
      } catch(e) {
        expect(e.message).toEqual(`Unable to delete comment 9999.`);
      }
    });
  });

  describe('#save', () => {
    it('Returns success message on success', async () => {
      const msg = await comment1.save();
      expect(msg).toEqual(`Updated comment ${comment1.id}.`);
    });

    it('Updates comment in DB when changes are made', async () => {
      comment1.comment = 'This is bad';
      await comment1.save();
      const comment = await Comment.get(comment1.id);
      expect(comment.comment).toEqual('This is bad');
    });

    it('Makes no changes otherwise', async () => {
      await comment1.save();
      const comment = await Comment.get(comment1.id);
      expect(comment).toEqual(comment1);
    });

    it('Throws error if comment object does not match comment in DB', async () => {
      try {
        const badComment = new Comment(9999);
        await badComment.save();
      } catch(e) {
        expect(e.message).toEqual(`Unable to update comment 9999.`);
      }
    });
  });
})