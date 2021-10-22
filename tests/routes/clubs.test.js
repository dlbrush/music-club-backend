const request = require('supertest');

const app = require("../../app");
const db = require('../../db');
const { clearDb, createTestObjects } = require('../setup');
const { DEFAULT_BANNER_IMG } = require('../../helpers/constants');
const Club = require('../../models/Club');

describe('users routes', () => {
  let user1;
  let user2;
  let club1;
  let club2;

  beforeEach(async () => {
    const testObjects = await createTestObjects();
    user1 = testObjects.user1;
    user2 = testObjects.user2;
    club1 = testObjects.club1;
    club2 = testObjects.club2;
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
      })

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