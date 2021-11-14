const request = require('supertest');

const app = require("../../app");
const db = require('../../db');
const { clearDb, createTestObjects, } = require('../setup');
const User = require('../../models/User');

describe('auth routes', () => {
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

  afterAll(async () => {
    await db.end();
  });
})