const request = require('supertest');

const app = require("../../app");
const db = require('../../db');
const { clearDb, createTestObjects, userTokenCookie, adminTokenCookie } = require('../setup');
const { DEFAULT_BANNER_IMG } = require('../../helpers/constants');
const Club = require('../../models/Club');
const DiscogsService = require('../../services/DiscogsService');
const Album = require('../../models/Album');
const Post = require('../../models/Post');

describe('users routes', () => {
  let user1;
  let user2;
  let club1;
  let club2;
  let album1;

  beforeEach(async () => {
    const testObjects = await createTestObjects();
    user1 = testObjects.user1;
    user2 = testObjects.user2;
    club1 = testObjects.club1;
    club2 = testObjects.club2;
    album1 = testObjects.album1;
  });

  afterEach(async () => {
    await clearDb();
  });

  describe('GET /', () => {
    it('Returns all clubs when no query string passed', async () => {
      const response = await request(app).get('/clubs');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        clubs: [
          {
            id: club1.id,
            name: club1.name,
            description: club1.description,
            founder: club1.founder,
            isPublic: club1.isPublic
          },
          {
            id: club2.id,
            name: club2.name,
            description: club2.description,
            founder: club2.founder,
            isPublic: club2.isPublic
          },
        ]
      })
    });

    it('Returns only public clubs if public=true (in any case) is passed', async () => {
      const response = await request(app).get('/clubs?isPublic=True');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        clubs: [
          {
            id: club1.id,
            name: club1.name,
            description: club1.description,
            founder: club1.founder,
            isPublic: club1.isPublic
          }
        ]
      });
    });

    it('Returns only clubs matching name if name is passed', async () => {
      const response = await request(app).get('/clubs?name=2');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        clubs: [
          {
            id: club2.id,
            name: club2.name,
            description: club2.description,
            founder: club2.founder,
            isPublic: club2.isPublic
          }
        ]
      });
    });

    it('Returns empty array in clubs object when no clubs match query', async () => {
      const response = await request(app).get('/clubs?name=abc&isPublic=true');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ clubs: []});
    });

    it('Returns 400 error if isPublic cannot be translated to boolean', async () => {
      const response = await request(app).get('/clubs?isPublic=abc');
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({ 
        error: {
          message: expect.any(String),
          status: 400
        }
      });
    });
  });

  describe('GET /:clubId', () => {
    it('Returns details of club at passed ID if it exists', async () => {
      const response = await request(app).get(`/clubs/${club1.id}`);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        club: {
          id: club1.id,
          name: club1.name,
          description: club1.description,
          founder: club1.founder,
          isPublic: club1.isPublic,
          founded: club1.founded.toISOString(),
          bannerImgUrl: club1.bannerImgUrl
        }
      });
    });

    it('Returns NotFoundError if username does not exist', async () => {
      const response = await request(app).get('/clubs/9999');
      expect(response.status).toEqual(404);
      expect(response.body).toEqual({
        error: {
          status: 404,
          message: 'Club with ID 9999 not found.'
        }
      });
    });

    it('Returns 400 error if club ID is not an integer', async () => {
      const response = await request(app).get('/clubs/abc');
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          status: 400,
          message: 'Club ID must be an integer.'
        }
      });
    })
  });

  describe('POST /', () => {
    let testCreateBody;

    beforeEach(() => {
      testCreateBody = {
        name: 'testClub3',
        description: 'testing club 3',
        founder: user1.username,
        bannerImgUrl: 'https://test.com/3.jpg',
        isPublic: true
      }
    });

    it('Returns new club on successful post', async () => {
      const response = await request(app)
                              .post('/clubs')
                              .send(testCreateBody);
      expect(response.status).toEqual(201);
      expect(response.body).toEqual({
        newClub: {
          id: expect.any(Number),
          name: testCreateBody.name,
          description: testCreateBody.description,
          founder: testCreateBody.founder,
          bannerImgUrl: testCreateBody.bannerImgUrl,
          isPublic: testCreateBody.isPublic,
          founded: expect.any(String),
          members: [user1]
        }
      });
    });

    it('Returns default values if bannerImgUrl is not defined in request', async () => {
      delete testCreateBody.bannerImgUrl;
      const response = await request(app)
                              .post('/clubs')
                              .send(testCreateBody);
      expect(response.status).toEqual(201);
      expect(response.body).toEqual({
        newClub: {
          id: expect.any(Number),
          name: testCreateBody.name,
          description: testCreateBody.description,
          founder: testCreateBody.founder,
          bannerImgUrl: DEFAULT_BANNER_IMG,
          isPublic: testCreateBody.isPublic,
          founded: expect.any(String),
          members: [user1]
        }
      });
    });

    it('Returns error if founder is not a real user', async () => {
      testCreateBody.founder = 'abc';
      const response = await request(app)
                              .post('/clubs')
                              .send(testCreateBody);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          message: 'Founder username abc does not match an existing user.',
          status: 400
        }
      });
    });

    it('Returns error if required field is missing', async () => {
      delete testCreateBody.name;
      const response = await request(app)
                              .post('/clubs')
                              .send(testCreateBody);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          message: expect.any(String),
          status: 400
        }
      });
    });

    it('Returns error if bannerImgUrl does not match expected pattern', async () => {
      testCreateBody.bannerImgUrl = 'https://www.djh.jpg';
      const response = await request(app)
                              .post('/clubs')
                              .send(testCreateBody);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          message: expect.any(String),
          status: 400
        }
      });
    });

    it('Returns error if passed extra properties', async () => {
      testCreateBody.vip = 'abc';
      const response = await request(app)
                              .post('/clubs')
                              .send(testCreateBody);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          message: expect.any(String),
          status: 400
        }
      });
    });
  });

  describe('POST /:clubId/new-post', () => {
    let newPostBody;

    beforeEach(() => {
      newPostBody = {
        discogsId: album1.discogsId,
        content: 'Great album',
        recTracks: 'A few'
      }
    });

    it('Returns new post for logged in user who is in the club being posted to', async () => {
      const response = await request(app)
                             .post(`/clubs/${club2.id}/new-post`)
                             .set('Cookie', userTokenCookie)
                             .send(newPostBody);
      expect(response.status).toEqual(201);
      expect(response.body).toEqual({
        newPost: {
          id: expect.any(Number),
          clubId: club2.id,
          discogsId: album1.discogsId,
          postedAt: expect.any(String),
          postedBy: user2.username,
          content: newPostBody.content,
          recTracks: newPostBody.recTracks
        }
      });
    });

    it('Adds post to DB on success', async () => {
      const response = await request(app)
                             .post(`/clubs/${club2.id}/new-post`)
                             .set('Cookie', userTokenCookie)
                             .send(newPostBody);
      const { newPost } = response.body;
      const dbPost = await Post.get(newPost.id);
      expect(dbPost).toEqual({
        id: newPost.id,
        clubId: newPost.clubId,
        discogsId: newPost.discogsId,
        postedAt: new Date(newPost.postedAt),
        postedBy: newPost.postedBy,
        content: newPost.content,
        recTracks: newPost.recTracks
      });
    });

    it('Returns new post for album not yet in DB', async () => {
      // Mock populate album data function to create fake album (but no discogs data)
      DiscogsService.populateAlbumData = jest.fn(async (discogsId) => {
        return await Album.create(discogsId, 2021, 'Test Artist', 'test', 'test.jpg');
      });
      // Change test discogs ID to something fake
      newPostBody.discogsId = 9999;
      const response = await request(app)
                             .post(`/clubs/${club2.id}/new-post`)
                             .set('Cookie', userTokenCookie)
                             .send(newPostBody);
      expect(response.status).toEqual(201);
      expect(response.body).toEqual({
        newPost: {
          id: expect.any(Number),
          clubId: club2.id,
          discogsId: 9999,
          postedAt: expect.any(String),
          postedBy: user2.username,
          content: newPostBody.content,
          recTracks: newPostBody.recTracks
        }
      })
    });

    it('Returns unauthorized error for user not logged in', async () => {
      const response = await request(app)
                             .post(`/clubs/${club2.id}/new-post`)
                             .send(newPostBody);
      expect(response.status).toEqual(401);
      expect(response.body).toEqual({
        error: {
          status: 401,
          message: 'Must be logged in to access this route'
        }
      });
    });

    it('Returns bad request error for club ID that is not an integer', async () => {
      const response = await request(app)
                             .post(`/clubs/abc/new-post`)
                             .set('Cookie', userTokenCookie)
                             .send(newPostBody);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          status: 400,
          message: 'Club ID must be an integer.'
        }
      });
    });

    it('Returns not found error for club ID not in DB', async () => {
      const response = await request(app)
                             .post(`/clubs/9999/new-post`)
                             .set('Cookie', userTokenCookie)
                             .send(newPostBody);
      expect(response.status).toEqual(404);
      expect(response.body).toEqual({
        error: {
          status: 404,
          message: 'Club with ID 9999 not found.'
        }
      });
    });

    it('Returns bad request error when discogsID is not an integer', async () => {
      newPostBody.discogsId = 'abc';
      const response = await request(app)
                             .post(`/clubs/${club2.id}/new-post`)
                             .set('Cookie', userTokenCookie)
                             .send(newPostBody);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          status: 400,
          message: expect.any(String)
        }
      });
    });

    it('Returns unauthorized error when user is not a member of the club in the route', async () => {
      const response = await request(app)
                             .post(`/clubs/${club2.id}/new-post`)
                             .set('Cookie', adminTokenCookie)
                             .send(newPostBody);
      expect(response.status).toEqual(403);
      expect(response.body).toEqual({
        error: {
          status: 403,
          message: 'Unauthorized: You are not a member of the club you are attempting to post to.'
        }
      });
    });
  });

  describe('PATCH /:clubId', () => {

    let updateClubBody;

    beforeEach(() => {
      updateClubBody = {
        name: 'New club',
        description: 'new and improved',
        bannerImgUrl: 'https://test.com/new.jpg'
      }
    });

    it('Responds with message and updated club on success', async () => {
      const response = await request(app)
                              .patch(`/clubs/${club1.id}`)
                              .send(updateClubBody);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        message: `Updated club ${updateClubBody.name}. (ID: ${club1.id})`,
        club: {
          id: club1.id,
          name: updateClubBody.name,
          description: updateClubBody.description,
          founder: club1.founder,
          bannerImgUrl: updateClubBody.bannerImgUrl,
          isPublic: club1.isPublic,
          founded: club1.founded.toISOString(),
        }
      });
    });

    it('Updates club in the DB', async () => {
      const response = await request(app)
                              .patch(`/clubs/${club1.id}`)
                              .send(updateClubBody);
      const club = await Club.get(club1.id);
      expect(club).toEqual({
        id: club1.id,
        name: updateClubBody.name,
        description: updateClubBody.description,
        founder: club1.founder,
        bannerImgUrl: updateClubBody.bannerImgUrl,
        isPublic: club1.isPublic,
        founded: club1.founded
      });
    });

    it('Returns error if bannerImgUrl does not match expected pattern', async () => {
      updateClubBody.bannerImgUrl = 'https://www.djh.jpg';
      const response = await request(app)
                              .patch(`/clubs/${club1.id}`)
                              .send(updateClubBody);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          message: expect.any(String),
          status: 400
        }
      });
    });

    it('Returns error if passed extra properties', async () => {
      updateClubBody.vip = 'abc';
      const response = await request(app)
                              .patch(`/clubs/${club1.id}`)
                              .send(updateClubBody);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          message: expect.any(String),
          status: 400
        }
      });
    });

    it('Returns error if club ID is not an int', async () => {
      const response = await request(app)
                              .patch('/clubs/abc')
                              .send(updateClubBody);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          message: 'Club ID must be an integer.',
          status: 400
        }
      });
    });
    

    it('Returns 404 if nonexistent club ID', async () => {
      const response = await request(app)
                              .patch('/clubs/9999')
                              .send(updateClubBody);
      expect(response.status).toEqual(404);
      expect(response.body).toEqual({
        error: {
          status: 404,
          message: 'Club with ID 9999 not found.'
        }
      });
    });
  });

  describe('DELETE /:clubId', () => {

    it('Returns message on success', async () => {
      const response = await request(app)
                              .delete(`/clubs/${club1.id}`);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        message: `Deleted club ${club1.name}. (ID: ${club1.id})`
      });
    });

    it('Deletes user from DB on success', async () => {
      const response = await request(app)
                              .delete(`/clubs/${club1.id}`);
      const club = await Club.get(club1.id);
      expect(club).toEqual(undefined);
    });

    it('Returns error if club ID is not an int', async () => {
      const response = await request(app)
                              .delete('/clubs/abc');
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          message: 'Club ID must be an integer.',
          status: 400
        }
      });
    });

    it('Returns 404 if nonexistent club ID', async () => {
      const response = await request(app)
                              .delete('/clubs/9999');
      expect(response.status).toEqual(404);
      expect(response.body).toEqual({
        error: {
          status: 404,
          message: 'Club with ID 9999 not found.'
        }
      });
    });
  });

  afterAll(async () => {
    await db.end();
  });
})