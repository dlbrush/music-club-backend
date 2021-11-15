const request = require('supertest');

const app = require("../../app");
const db = require('../../db');
const { clearDb, createTestObjects, userTokenCookie } = require('../setup');
const User = require('../../models/User');

describe('auth routes', () => {
  let user1, user2;

  beforeEach(async () => {
    const testObjects = await createTestObjects();
    user1 = testObjects.user1;
    user2 = testObjects.user2;
  });

  afterEach(async () => {
    await clearDb();
  });

  afterAll(async () => {
    await db.end();
  });

  describe('POST /register', () => {
    let testRegisterBody;

    beforeEach(() => {
      testRegisterBody = {
        username: 'test4',
        password: 'test4',
        email: 'test4@test.com',
        profileImgUrl: 'https://test.com/4.jpg'
      }
    });

    it('Returns new user on successful post', async () => {
      const response = await request(app)
                              .post('/auth/register')
                              .send(testRegisterBody);
      expect(response.status).toEqual(201);
      expect(response.body).toEqual({
        user: {
          username: testRegisterBody.username,
          admin: false
        }
      });
    });

    it('Attaches token as HTTPOnly cookie on successful post', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(testRegisterBody);
      expect(response.headers['set-cookie'][0]).toContain('token');
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    });

    it('Creates user in database', async () => {
      const response = await request(app)
                              .post('/auth/register')
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
                              .post('/auth/register')
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
                              .post('/auth/register')
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
                              .post('/auth/register')
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
                              .post('/auth/register')
                              .send(testRegisterBody);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          message: expect.any(String),
          status: 400
        }
      });
    });

    it('Returns error if username and email are already in use', async () => {
      testRegisterBody.username = user1.username;
      testRegisterBody.email = user1.email;
      const response = await request(app)
                              .post('/auth/register')
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

  describe('POST /login', () => {
    let testRegisterBody;

    beforeEach(async () => {
      testRegisterBody = {
        username: 'test3',
        password: 'test3',
        email: 'test3@test.com',
        profileImgUrl: 'https://test.com/3.jpg'
      }
      // Register a user to hash a valid password
      await request(app)
            .post('/auth/register')
            .send(testRegisterBody);
    });

    it('Returns success message and user data with valid login', async () => {
      const response = await request(app)
                              .post('/auth/login')
                              .send({
                                username: testRegisterBody.username,
                                password: testRegisterBody.password
                              });
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        user: {
          username: testRegisterBody.username,
          admin: false
        }
      });
    });

    it('Attaches an HTTPOnly cookie with token', async () => {
      const response = await request(app)
                              .post('/auth/login')
                              .send({
                                username: testRegisterBody.username,
                                password: testRegisterBody.password
                              });
      expect(response.headers['set-cookie'][0]).toContain('token');
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    });

    it('Returns 401 error with invalid username', async () => {
      const response = await request(app)
                              .post('/auth/login')
                              .send({
                                username: 'abc',
                                password: testRegisterBody.password
                              });
      expect(response.status).toEqual(401);
      expect(response.body).toEqual({
        error: {
          status: 401,
          message: 'Invalid username or password.'
        }
      })
    });

    it('Returns 401 error with invalid password', async () => {
      const response = await request(app)
                              .post('/auth/login')
                              .send({
                                username: testRegisterBody.username,
                                password: 'abc'
                              });
      expect(response.status).toEqual(401);
      expect(response.body).toEqual({
        error: {
          status: 401,
          message: 'Invalid username or password.'
        }
      })
    });
  });

  describe('/check POST', () => {
    it('Returns user data when cookie is attached', async () => {
      const response = await request(app)
                             .post('/auth/check')
                             .set('Cookie', userTokenCookie);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        user: {
          username: user2.username,
          admin: user2.admin,
          iat: expect.any(Number)
        }
      });
    });

    it('Throws error when no valid cookie attached', async () => {
      const response = await request(app)
                             .post('/auth/check');
      expect(response.status).toEqual(401);
      expect(response.body).toEqual({
        error: {
          status: 401,
          message: 'JWT not found'
        }
      });
    });
  });

  describe('/logout POST', () => {
    it('Sets token to empty string', async () => {
      const response = await request(app)
                             .post('/auth/logout');
      expect(response.status).toEqual(200);
      expect(response.headers['set-cookie'][0]).toContain('token=;');
    });

    it('Returns message on success', async () => {
      const response = await request(app)
                             .post('/auth/logout');
      expect(response.body).toEqual({
        message: 'Successfully logged out.'
      });
    });
  });
});