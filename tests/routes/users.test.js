const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require("../../app");
const db = require('../../db');
const { clearDb, createTestObjects } = require('../setup');
const { DEFAULT_PROFILE_IMG } = require('../../helpers/constants');
const User = require('../../models/User');
const UserClub = require('../../models/UserClub');

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
    it('Returns all users when no query string passed', async () => {
      const response = await request(app).get('/users');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        users: [
          {
            username: user1.username,
            email: user1.email,
            profileImgUrl: user1.profileImgUrl
          },
          {
            username: user2.username,
            email: user2.email,
            profileImgUrl: user2.profileImgUrl
          }
        ]
      })
    });

    it('Returns only users containing passed username string', async () => {
      const response = await request(app).get('/users?username=1');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        users: [
          {
            username: user1.username,
            email: user1.email,
            profileImgUrl: user1.profileImgUrl
          }
        ]
      });
    });

    it('Returns empty array in user object when no users matched', async () => {
      const response = await request(app).get('/users?username=abc');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ users: []});
    })
  });

  describe('GET /:username', () => {
    it('Returns details of passed username if it exists', async () => {
      const response = await request(app).get('/users/test1');
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        user: {
          username: user1.username,
          email: user1.email,
          admin: user1.admin,
          profileImgUrl: user1.profileImgUrl
        }
      });
    });

    it('Returns NotFoundError if username does not exist', async () => {
      const response = await request(app).get('/users/abc');
      expect(response.status).toEqual(404);
      expect(response.body).toEqual({
        error: {
          status: 404,
          message: 'User abc not found.'
        }
      });
    });
    });

    describe('POST /register', () => {
      let testRegisterBody;

      beforeEach(() => {
        testRegisterBody = {
          username: 'test3',
          password: 'test3',
          email: 'test3@test.com',
          profileImgUrl: 'https://test.com/3.jpg'
        }
      });

      it('Returns token on successful post', async () => {
        const response = await request(app)
                               .post('/users/register')
                               .send(testRegisterBody);
        expect(response.status).toEqual(201);
        expect(response.body).toEqual({
          token: expect.any(String)
        });
      });

      it('Returns token containing username and admin status', async () => {
        const response = await request(app)
                               .post('/users/register')
                               .send(testRegisterBody);
        expect(jwt.decode(response.body.token)).toMatchObject({
          admin: false,
          username: 'test3'
        });
      });

      it('Creates user in database', async () => {
        const response = await request(app)
                               .post('/users/register')
                               .send(testRegisterBody);
        const user = await User.get(testRegisterBody.username);
        expect(user).toEqual({
          username: testRegisterBody.username,
          email: testRegisterBody.email,
          profileImgUrl: testRegisterBody.profileImgUrl,
          admin: false
        });
      });

      it('Returns error if email does not match email format', async () => {
        testRegisterBody.email = 'notAnEmail';
        const response = await request(app)
                               .post('/users/register')
                               .send(testRegisterBody);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            message: expect.any(String),
            status: 400
          }
        });
      });

      it('Returns error if profile URL does not match image format', async () => {
        testRegisterBody.profileImgUrl = 'notAnEmail';
        const response = await request(app)
                               .post('/users/register')
                               .send(testRegisterBody);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            message: expect.any(String),
            status: 400
          }
        });
      });

      it('Returns error if required field is missing', async () => {
        delete testRegisterBody.username;
        const response = await request(app)
                               .post('/users/register')
                               .send(testRegisterBody);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            message: expect.any(String),
            status: 400
          }
        });
      });

      it('Returns error if passed extra properties', async () => {
        testRegisterBody.extra = 'abc';
        const response = await request(app)
                               .post('/users/register')
                               .send(testRegisterBody);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            message: expect.any(String),
            status: 400
          }
        });
      });

      it('Returns error if username and password are already in use', async () => {
        testRegisterBody.username = user1.username;
        testRegisterBody.email = user1.email;
        const response = await request(app)
                               .post('/users/register')
                               .send(testRegisterBody);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            message: 'User with username test1 and email test1@test.com already exists.',
            status: 400
          }
        });
      });
    });

    describe('POST /', () => {
      let testCreateBody;

      beforeEach(() => {
        testCreateBody = {
          username: 'test3',
          password: 'test3',
          email: 'test3@test.com',
          profileImgUrl: 'https://test.com/3.jpg',
          admin: true
        }
      });

      it('Returns new user on successful post', async () => {
        const response = await request(app)
                               .post('/users')
                               .send(testCreateBody);
        expect(response.status).toEqual(201);
        expect(response.body).toEqual({
          newUser: {
            username: testCreateBody.username,
            email: testCreateBody.email,
            profileImgUrl: testCreateBody.profileImgUrl,
            admin: testCreateBody.admin
          }
        });
      });

      it('Returns default values if profileImgUrl and admin are not defined in request', async () => {
        delete testCreateBody.profileImgUrl;
        delete testCreateBody.admin;
        const response = await request(app)
                               .post('/users')
                               .send(testCreateBody);
        expect(response.status).toEqual(201);
        expect(response.body).toEqual({
          newUser: {
            username: testCreateBody.username,
            email: testCreateBody.email,
            profileImgUrl: DEFAULT_PROFILE_IMG,
            admin: false
          }
        });
      })

      it('Returns error if email does not match email format', async () => {
        testCreateBody.email = 'notAnEmail';
        const response = await request(app)
                               .post('/users')
                               .send(testCreateBody);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            message: expect.any(String),
            status: 400
          }
        });
      });

      it('Returns error if profile URL does not match image format', async () => {
        testCreateBody.profileImgUrl = 'notAnEmail';
        const response = await request(app)
                               .post('/users')
                               .send(testCreateBody);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            message: expect.any(String),
            status: 400
          }
        });
      });

      it('Returns error if required field is missing', async () => {
        delete testCreateBody.username;
        const response = await request(app)
                               .post('/users')
                               .send(testCreateBody);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            message: expect.any(String),
            status: 400
          }
        });
      });

      it('Returns error if admin is not boolean', async () => {
        testCreateBody.admin = 'abc';
        const response = await request(app)
                               .post('/users')
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
        testCreateBody.extra = 'abc';
        const response = await request(app)
                               .post('/users/register')
                               .send(testCreateBody);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            message: expect.any(String),
            status: 400
          }
        });
      });

      it('Returns error if username and password are already in use', async () => {
        testCreateBody.username = user1.username;
        testCreateBody.email = user1.email;
        const response = await request(app)
                               .post('/users')
                               .send(testCreateBody);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            message: 'User with username test1 and email test1@test.com already exists.',
            status: 400
          }
        });
      });
    });

    describe('POST /:username/join-club/:clubId', () => {
      it('Returns message on success', async () => {
        const response = await request(app)
                               .post(`/users/${user1.username}/join-club/${club2.id}`);
        expect(response.status).toEqual(201);
        expect(response.body).toEqual({
          message: `User ${user1.username} has successfully joined club ${club2.name} (ID: ${club2.id})`
        });
      });

      it('Adds UserClub to database on success', async () => {
        const response = await request(app)
                               .post(`/users/${user1.username}/join-club/${club2.id}`);
        const userClub = await UserClub.get(user1.username, club2.id);
        expect(userClub).toEqual({
          username: user1.username,
          clubId: club2.id
        });
      });

      it('Adds UserClub to database on success', async () => {
        const response = await request(app)
                               .post(`/users/${user1.username}/join-club/${club2.id}`);
        const userClub = await UserClub.get(user1.username, club2.id);
        expect(userClub).toEqual({
          username: user1.username,
          clubId: club2.id
        });
      });

      it('Returns an error if clubId is not an integer', async () => {
        const response = await request(app)
                               .post(`/users/${user1.username}/join-club/abc`);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            message: 'Club ID must be an integer.',
            status: 400
          }
        });
      });

      it('Returns an error if the user is already a member of that club', async () => {
        const response = await request(app)
                               .post(`/users/${user1.username}/join-club/${club1.id}`);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            message: `User ${user1.username} is already in club ${club1.name} (ID: ${club1.id})`,
            status: 400
          }
        });
      });
    });

    describe('PATCH /:username', () => {

      let updateUserBody;

      beforeEach(() => {
        updateUserBody = {
          email: 'update@test.com',
          profileImgUrl: 'https://test.com/new.jpg'
        }
      });

      it('Responds with message and updated user on success', async () => {
        const response = await request(app)
                               .patch(`/users/${user1.username}`)
                               .send(updateUserBody);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({
          message: `Updated user ${user1.username}.`,
          user: {
            username: user1.username,
            email: updateUserBody.email,
            admin: user1.admin,
            profileImgUrl: updateUserBody.profileImgUrl
          }
        });
      });

      it('Updates user in the DB', async () => {
        const response = await request(app)
                               .patch(`/users/${user1.username}`)
                               .send(updateUserBody);
        const user = await User.get(user1.username);
        expect(user).toEqual({
          username: user1.username,
          email: updateUserBody.email,
          admin: user1.admin,
          profileImgUrl: updateUserBody.profileImgUrl
        });
      });

      it('Returns error if email not correctly formatted', async () => {
        updateUserBody.email = 'notAnEmail';
        const response = await request(app)
                               .patch(`/users/${user1.username}`)
                               .send(updateUserBody);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            status: 400,
            message: expect.any(String)
          }
        });
      });

      it('Returns error if img URL not correctly formatted', async () => {
        updateUserBody.profileImgUrl = 'notAnUrl';
        const response = await request(app)
                               .patch(`/users/${user1.username}`)
                               .send(updateUserBody);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            status: 400,
            message: expect.any(String)
          }
        });
      });

      it('Returns 404 if nonexistent user', async () => {
        const response = await request(app)
                               .patch('/users/abc')
                               .send(updateUserBody);
        expect(response.status).toEqual(404);
        expect(response.body).toEqual({
          error: {
            status: 404,
            message: 'User abc not found.'
          }
        });
      });
    });

    describe('DELETE /:username', () => {

      it('Returns message on success', async () => {
        const response = await request(app)
                               .delete(`/users/${user1.username}`);
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({
          message: `Deleted user ${user1.username}.`
        });
      });

      it('Deletes user from DB on success', async () => {
        const response = await request(app)
                               .delete(`/users/${user1.username}`);
        const user = await User.get(user1.username);
        expect(user).toEqual(undefined);
      });

      it('Returns 404 if nonexistent user', async () => {
        const response = await request(app)
                               .delete('/users/abc');
        expect(response.status).toEqual(404);
        expect(response.body).toEqual({
          error: {
            status: 404,
            message: 'User abc not found.'
          }
        });
      });
    });

  afterAll(async () => {
    await db.end();
  });
})