const request = require('supertest');

const app = require('../../app');
const db = require('../../db');
const { createTestObjects, clearDb, adminTokenCookie, user2TokenCookie, user3TokenCookie } = require('../setup');
const Comment = require('../../models/Comment');


describe('comments routes', () => {
  let comment1;

  beforeEach(async () => {
    await clearDb();
    const testObjects = await createTestObjects();
    comment1 = testObjects.comment1;
  });

  afterEach(async () => {
    await clearDb();
  });

  afterAll(async () => {
    await db.end();
  });

  describe('/:commentId PATCH', () => {
    const updateCommentBody = {
      comment: 'New comment'
    }

    it('Returns updated comment for admin', async () => {
      const response = await request(app)
                            .patch(`/comments/${comment1.id}`)
                            .send(updateCommentBody)
                            .set('Cookie', adminTokenCookie);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        comment: {
          id: comment1.id,
          username: comment1.username,
          comment: updateCommentBody.comment,
          postId: comment1.postId,
          postedAt: comment1.postedAt.toISOString()
        }
      });
    });

    it('Updates comment in the DB for commenting user', async () => {
      const response = await request(app)
                            .patch(`/comments/${comment1.id}`)
                            .send(updateCommentBody)
                            .set('Cookie', user2TokenCookie);
      const comment = await Comment.get(comment1.id);
      expect(comment).toEqual({
          id: comment1.id,
          username: comment1.username,
          comment: updateCommentBody.comment,
          postId: comment1.postId,
          postedAt: comment1.postedAt
      });
    });

    it('Makes no change when no comment is passed', async () => {
      const response = await request(app)
                            .patch(`/comments/${comment1.id}`)
                            .send({})
                            .set('Cookie', user2TokenCookie);
      expect(response.body).toEqual({
        comment: {
          id: comment1.id,
          username: comment1.username,
          comment: comment1.comment,
          postId: comment1.postId,
          postedAt: comment1.postedAt.toISOString()
        }
      });
    });

    it('Returns unauth error when user is not admin or commenter', async () => {
      const response = await request(app)
                            .patch(`/comments/${comment1.id}`)
                            .send({})
                            .set('Cookie', user3TokenCookie);
      expect(response.status).toEqual(403);
    });

    it('Returns 404 error when comment ID does not exist', async () => {
      const response = await request(app)
                            .patch(`/comments/9999`)
                            .send({})
                            .set('Cookie', user2TokenCookie);
      expect(response.status).toEqual(404);
    });

    it('Returns 400 error when comment ID is not integer', async () => {
      const response = await request(app)
                            .patch(`/comments/abc`)
                            .send({})
                            .set('Cookie', user2TokenCookie);
      expect(response.status).toEqual(400);
    });
  });

  describe('/:commentId DELETE', () => {
    it('Returns message on success for admin', async () => {
      const response = await request(app)
                            .delete(`/comments/${comment1.id}`)
                            .set('Cookie', adminTokenCookie);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        message: `Deleted comment ${comment1.id}.`
      });
    });

    it('Deletes comment in the DB for commenting user', async () => {
      const response = await request(app)
                            .delete(`/comments/${comment1.id}`)
                            .set('Cookie', user2TokenCookie);
      const comment = await Comment.get(comment1.id);
      expect(comment).toEqual(undefined);
    });

    it('Returns unauth error when user is not admin or commenter', async () => {
      const response = await request(app)
                            .delete(`/comments/${comment1.id}`)
                            .set('Cookie', user3TokenCookie);
      expect(response.status).toEqual(403);
    });

    it('Returns 404 error when comment ID does not exist', async () => {
      const response = await request(app)
                            .delete(`/comments/9999`)
                            .set('Cookie', user2TokenCookie);
      expect(response.status).toEqual(404);
    });

    it('Returns 400 error when comment ID is not integer', async () => {
      const response = await request(app)
                            .delete(`/comments/abc`)
                            .set('Cookie', user2TokenCookie);
      expect(response.status).toEqual(400);
    });
  });
});