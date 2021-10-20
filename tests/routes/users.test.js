const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require("../../app");
const db = require('../../db');
const { clearDb, createTestObjects } = require('../setup');
const { DEFAULT_PROFILE_IMG } = require('../../helpers/constants');

describe('users routes', () => {
  let user1;
  let user2;

  beforeEach(async () => {
    const testObjects = await createTestObjects();
    user1 = testObjects.user1;
    user2 = testObjects.user2;
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

    it('Returns empty string in user object when no users matched', async () => {
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
      let testRegisterBody;

      beforeEach(() => {
        testRegisterBody = {
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
                               .send(testRegisterBody);
        expect(response.status).toEqual(201);
        expect(response.body).toEqual({
          newUser: {
            username: testRegisterBody.username,
            email: testRegisterBody.email,
            profileImgUrl: testRegisterBody.profileImgUrl,
            admin: testRegisterBody.admin
          }
        });
      });

      it('Returns default values if profileImgUrl and admin are not defined in request', async () => {
        delete testRegisterBody.profileImgUrl;
        delete testRegisterBody.admin;
        const response = await request(app)
                               .post('/users')
                               .send(testRegisterBody);
        expect(response.status).toEqual(201);
        expect(response.body).toEqual({
          newUser: {
            username: testRegisterBody.username,
            email: testRegisterBody.email,
            profileImgUrl: DEFAULT_PROFILE_IMG,
            admin: false
          }
        });
      })

      it('Returns error if email does not match email format', async () => {
        testRegisterBody.email = 'notAnEmail';
        const response = await request(app)
                               .post('/users')
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
                               .post('/users')
                               .send(testRegisterBody);
        expect(response.status).toEqual(400);
        expect(response.body).toEqual({
          error: {
            message: expect.any(String),
            status: 400
          }
        });
      });

      it('Returns error if admin is not boolean', async () => {
        testRegisterBody.admin = 'abc';
        const response = await request(app)
                               .post('/users')
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
        console.log(user1.email);
        const response = await request(app)
                               .post('/users')
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

  afterAll(async () => {
    await db.end();
  });
})