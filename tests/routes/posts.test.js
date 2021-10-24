const { post } = require('superagent');
const request = require('supertest');

const app = require('../../app');
const db = require('../../db');
const Post = require('../../models/Post');
const { createTestObjects, clearDb } = require('../setup');

describe('posts routes', () => {
  let post1;
  let post2;
  let club1;
  
  beforeEach(async () => {
    const testObjects = await createTestObjects();
    post1 = testObjects.post1;
    post2 = testObjects.post2;
    club1 = testObjects.club1;
  });

  afterEach(async () => {
    await clearDb();
  });

  describe('GET /', () => {
    it('Returns all posts when no query string passed', async () => {
      const response = await request(app)
                             .get('/posts');
      expect(response.status).toEqual(200);
      expect(response.body.posts.length).toEqual(2);
      expect(response.body).toEqual({
        posts: [
          {
            id: post1.id,
            clubId: post1.clubId,
            discogsId: post1.discogsId,
            postedAt: post1.postedAt.toISOString(),
            postedBy: post1.postedBy,
            content: post1.content
          },
          {
            id: post2.id,
            clubId: post2.clubId,
            discogsId: post2.discogsId,
            postedAt: post2.postedAt.toISOString(),
            postedBy: post2.postedBy,
            content: post2.content
          }
        ]
      });
    });

    it('Returns only posts in passed club ID', async () => {
      const response = await request(app)
                             .get(`/posts?clubId=${club1.id}`);
      expect(response.status).toEqual(200);
      expect(response.body.posts.length).toEqual(1);
      expect(response.body).toEqual({
        posts: [
          {
            id: post1.id,
            clubId: post1.clubId,
            discogsId: post1.discogsId,
            postedAt: post1.postedAt.toISOString(),
            postedBy: post1.postedBy,
            content: post1.content
          }
        ]
      });
    });

    it('Returns empty array when no posts matched', async () => {
      const response = await request(app)
                             .get(`/posts?clubId=9999`);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        posts: []
      });
    });
  });

  afterAll(async () => {
    await db.end();
  })
})