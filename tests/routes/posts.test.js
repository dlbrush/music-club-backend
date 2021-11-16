const { post } = require('superagent');
const request = require('supertest');

const app = require('../../app');
const db = require('../../db');
const Post = require('../../models/Post');
const { createTestObjects, clearDb, adminTokenCookie, user2TokenCookie } = require('../setup');


describe('posts routes', () => {
  let post1;
  let post2;
  let club1;
  let club2;
  let user1;
  let user2;
  let vote1;
  let album1;
  
  beforeEach(async () => {
    await clearDb();
    const testObjects = await createTestObjects();
    post1 = testObjects.post1;
    post2 = testObjects.post2;
    club1 = testObjects.club1;
    club2 = testObjects.club2
    user1 = testObjects.user1;
    user2 = testObjects.user2;
    vote1 = testObjects.vote1;
    album1 = testObjects.album1;
  });

  afterEach(async () => {
    await clearDb();
  });

  describe('GET /', () => {
    it('Returns all posts in descending order of ID for admin when no query string passed', async () => {
      const response = await request(app)
                             .get('/posts')
                             .set('Cookie', adminTokenCookie);
      expect(response.status).toEqual(200);
      expect(response.body.posts.length).toEqual(2);
      expect(response.body).toEqual({
        posts: [
          {
            id: post2.id,
            album: {
              artist: album1.artist,
              coverImgUrl: album1.coverImgUrl,
              title: album1.title,
              year: album1.year,
            },
            clubId: post2.clubId,
            discogsId: post2.discogsId,
            postedAt: post2.postedAt.toISOString(),
            postedBy: post2.postedBy,
            content: post2.content
          },
          {
            id: post1.id,
            album: {
              artist: album1.artist,
              coverImgUrl: album1.coverImgUrl,
              title: album1.title,
              year: album1.year,
            },
            clubId: post1.clubId,
            discogsId: post1.discogsId,
            postedAt: post1.postedAt.toISOString(),
            postedBy: post1.postedBy,
            content: post1.content
          }
        ]
      });
    });


    it('Returns only posts in passed club ID for user in club', async () => {
      const response = await request(app)
                             .get(`/posts?clubId=${club2.id}`)
                             .set('Cookie', user2TokenCookie);
      expect(response.status).toEqual(200);
      expect(response.body.posts.length).toEqual(1);
      expect(response.body).toEqual({
        posts: [
          {
            id: post2.id,
            album: {
              artist: album1.artist,
              coverImgUrl: album1.coverImgUrl,
              title: album1.title,
              year: album1.year,
            },
            clubId: post2.clubId,
            discogsId: post2.discogsId,
            postedAt: post2.postedAt.toISOString(),
            postedBy: post2.postedBy,
            content: post2.content
          }
        ]
      });
    });

    it('Returns empty array when no posts matched', async () => {
      const response = await request(app)
                             .get(`/posts?clubId=9999`)
                             .set('Cookie', adminTokenCookie);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        posts: []
      });
    });
  });

  describe('GET /:postId', () => {
    it('Returns post details on success for user in club', async () => {
      const response = await request(app)
                             .get(`/posts/${post2.id}`)
                             .set('Cookie', user2TokenCookie);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        post: {
          id: post2.id,
          album: {
            ...album1,
            genres: []
          },
          clubId: post2.clubId,
          comments: [],
          discogsId: post2.discogsId,
          postedAt: post2.postedAt.toISOString(),
          postedBy: post2.postedBy,
          content: post2.content,
          recTracks: post2.recTracks
        }
      })
    });

    it('Returns post details on success for admin', async () => {
      const response = await request(app)
                             .get(`/posts/${post2.id}`)
                             .set('Cookie', adminTokenCookie);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        post: {
          id: post2.id,
          clubId: post2.clubId,
          album: {
            ...album1,
            genres: []
          },
          discogsId: post2.discogsId,
          comments: [],
          postedAt: post2.postedAt.toISOString(),
          postedBy: post2.postedBy,
          content: post2.content,
          recTracks: post2.recTracks
        }
      })
    });

    // TODO: Success for public club

    it('Returns error when post ID is not an integer', async () => {
      const response = await request(app)
                             .get('/posts/abc')
                             .set('Cookie', user2TokenCookie);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          status: 400,
          message: 'Post ID must be an integer.'
        }
      })
    });

    it('Returns error when post ID is not in database', async () => {
      const response = await request(app)
                             .get('/posts/9999')
                             .set('Cookie', user2TokenCookie);
      expect(response.status).toEqual(404);
      expect(response.body).toEqual({
        error: {
          status: 404,
          message: 'Post with ID 9999 not found.'
        }
      })
    });
  });

  describe('POST /:postId/vote/:type', () => {
    it('Returns success message on valid new vote', async () => {
      const response = await request(app)
                             .post(`/posts/${post1.id}/vote/up`)
                             .set('Cookie', adminTokenCookie);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        message: `User ${user1.username} successfully upvoted post ${post1.id}`
      });
    });

    it('Returns change message on valid changed vote', async () => {
      const response = await request(app)
                             .post(`/posts/${post2.id}/vote/down`)
                             .set('Cookie', user2TokenCookie);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        message: `Successfully changed vote by ${user2.username} on post ${post2.id}. User has now downvoted this post.`
      });
    });

    it('Returns bad request error when postId is not an integer', async () => {
      const response = await request(app)
                             .post(`/posts/abc/vote/down`)
                             .set('Cookie', user2TokenCookie);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          status: 400,
          message: 'Post ID must be an integer.'
        }
      });
    });

    it('Returns bad request error when postId is not in DB', async () => {
      const response = await request(app)
                             .post(`/posts/9999/vote/down`)
                             .set('Cookie', user2TokenCookie);
      expect(response.status).toEqual(404);
      expect(response.body).toEqual({
        error: {
          status: 404,
          message: 'Post with ID 9999 not found.'
        }
      });
    });

    it('Returns bad request error if vote type is not up or down', async () => {
      const response = await request(app)
                             .post(`/posts/${post2.id}/vote/both`)
                             .set('Cookie', user2TokenCookie);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          status: 400,
          message: 'Vote type must be up or down (case insensitive).'
        }
      });
    });

    it('Returns unauthorized error if user in token is not part of club that post is in', async () => {
      const response = await request(app)
                             .post(`/posts/${post2.id}/vote/up`)
                             .set('Cookie', adminTokenCookie);
      expect(response.status).toEqual(403);
      expect(response.body).toEqual({
        error: {
          status: 403,
          message: `Sorry, you must be a member of club with ID ${post2.clubId} to vote on post ${post2.id}`
        }
      });
    });
  });

  describe('PATCH /:postId', () => {
    let updatePostBody;

    beforeEach(() => {
      updatePostBody = {
        content: 'New content',
        recTracks: 'None'
      }
    });

    it('Returns updated post on success for same user', async () => {
      const response = await request(app)
                             .patch(`/posts/${post2.id}`)
                             .set('Cookie', user2TokenCookie)
                             .send(updatePostBody);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        message: `Updated post ${post2.id}.`,
        post: {
          id: post2.id,
          clubId: post2.clubId,
          discogsId: post2.discogsId,
          postedAt: post2.postedAt.toISOString(),
          postedBy: post2.postedBy,
          content: updatePostBody.content,
          recTracks: updatePostBody.recTracks
        }
      });
    });

    it('Returns updated post on success for admin', async () => {
      const response = await request(app)
                             .patch(`/posts/${post2.id}`)
                             .set('Cookie', adminTokenCookie)
                             .send(updatePostBody);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        message: `Updated post ${post2.id}.`,
        post: {
          id: post2.id,
          clubId: post2.clubId,
          discogsId: post2.discogsId,
          postedAt: post2.postedAt.toISOString(),
          postedBy: post2.postedBy,
          content: updatePostBody.content,
          recTracks: updatePostBody.recTracks
        }
      });
    });

    it('Updates post in the DB on success', async () => {
      const response = await request(app)
                             .patch(`/posts/${post1.id}`)
                             .set('Cookie', adminTokenCookie)
                             .send(updatePostBody);
      const post = await Post.get(post1.id);
      expect(post).toEqual({
        id: post1.id,
        clubId: post1.clubId,
        discogsId: post1.discogsId,
        postedAt: post1.postedAt,
        postedBy: post1.postedBy,
        content: updatePostBody.content,
        recTracks: updatePostBody.recTracks
      });
    });

    it('Keeps everything the same when nothing is passed', async () => {
      const response = await request(app)
                             .patch(`/posts/${post1.id}`)
                             .set('Cookie', adminTokenCookie);
      const post = await Post.get(post1.id);
      expect(response.body).toEqual({
        message: `Updated post ${post1.id}.`,
        post: {
          id: post1.id,
          clubId: post1.clubId,
          discogsId: post1.discogsId,
          postedAt: post1.postedAt.toISOString(),
          postedBy: post1.postedBy,
          content: post1.content,
          recTracks: post1.recTracks
        }
      });
    });

    it('Returns bad request error when postId is not an integer', async () => {
      const response = await request(app)
                             .patch(`/posts/abc`)
                             .set('Cookie', adminTokenCookie)
                             .send(updatePostBody);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          status: 400,
          message: 'Post ID must be an integer.'
        }
      });
    });

    it('Returns bad request error when postId is not in DB', async () => {
      const response = await request(app)
                             .patch(`/posts/9999`)
                             .set('Cookie', adminTokenCookie)
                             .send(updatePostBody);
      expect(response.status).toEqual(404);
      expect(response.body).toEqual({
        error: {
          status: 404,
          message: 'Post with ID 9999 not found.'
        }
      });
    });

    it('Returns bad request error when passed extra properties in body', async () => {
      updatePostBody.extra = 'no';
      const response = await request(app)
                             .patch(`/posts/${post1.id}`)
                             .set('Cookie', adminTokenCookie)
                             .send(updatePostBody);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          status: 400,
          message: expect.any(String)
        }
      });
    });
  });

  describe('DELETE /:postId', () => {
    it('Returns message on success for the poster', async () => {
      const response = await request(app)
                             .delete(`/posts/${post2.id}`)
                             .set('Cookie', user2TokenCookie);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        message: `Deleted post ${post2.id}.`
      });
    });
    it('Returns message on success for admin', async () => {
      const response = await request(app)
                             .delete(`/posts/${post2.id}`)
                             .set('Cookie', adminTokenCookie);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        message: `Deleted post ${post2.id}.`
      });
    });

    it('Deletes post in the DB on success', async () => {
      const response = await request(app)
                             .delete(`/posts/${post1.id}`)
                             .set('Cookie', adminTokenCookie);
      const post = await Post.get(post1.id);
      expect(post).toEqual(undefined);
    });

    it('Returns bad request error when postId is not an integer', async () => {
      const response = await request(app)
                             .delete(`/posts/abc`)
                             .set('Cookie', adminTokenCookie);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          status: 400,
          message: 'Post ID must be an integer.'
        }
      });
    });

    it('Returns bad request error when postId is not in DB', async () => {
      const response = await request(app)
                             .delete('/posts/9999')
                             .set('Cookie', adminTokenCookie);
      expect(response.status).toEqual(404);
      expect(response.body).toEqual({
        error: {
          status: 404,
          message: 'Post with ID 9999 not found.'
        }
      });
    });
  });

  afterAll(async () => {
    await db.end();
  });
})