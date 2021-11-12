const request = require('supertest');

const app = require("../../app");
const db = require('../../db');
const { generateUserToken } = require('../../helpers/auth');
const { UnauthorizedError, UnauthenticatedError, BadRequestError, NotFoundError } = require('../../helpers/errors');
const { authenticateToken, ensureAdmin, ensureAdminOrSameUser, ensureLoggedIn, ensureAdminOrValidClub, ensureAdminOrCommenter, ensureAdminOrPoster } = require('../../middleware/auth');
const UserClub = require('../../models/UserClub');
const { createTestObjects, clearDb } = require('../setup');

describe('Auth middleware functions', () => {
  let mockNext;
  let testObjects;
  let user1Req;
  let user2Req;
  let user3Req;

  beforeEach(async () => {
    mockNext = jest.fn((error) => error);
    testObjects = await createTestObjects();
    user1Req = {user: {username: 'test1', admin: true}};
    user2Req = {user: {username: 'test2', admin: false}};
    user3Req = {user: {username: 'test3', admin: false}};
  });

  afterAll(async () => {
    await db.end();
  });

  afterEach(async () => {
    mockNext.mockReset();
    await clearDb();
  });

  describe('authenticateToken', () => {
    let tokenReq;
    
    beforeEach(() => {
      tokenReq = {cookies: {token: generateUserToken('test2', false)}};
    });
    
    it('Attaches user property to req if valid token on request', () => {
      authenticateToken(tokenReq, {}, mockNext);
      expect(tokenReq.hasOwnProperty('user')).toEqual(true);
      expect(tokenReq.user).toEqual({
        username: 'test2',
        iat: expect.any(Number),
        admin: false
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('Attaches nothing to req and calls next with no args if no token attached', () => {
      authenticateToken({cookies: {}}, {}, mockNext);
      expect(tokenReq.hasOwnProperty('user')).toEqual(false);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('ensureAdmin', () => {
    it('Calls next if user has admin=true', () => {
      const adminReq = {user: {admin: true}};
      ensureAdmin(adminReq, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('Throws UnauthorizedError when called with admin=false', () => {
      const userReq = {user: {admin: false}};
      expect(() => { ensureAdmin(userReq, {}, mockNext); }).toThrow(UnauthorizedError);
    });
  });

  describe('ensureAdminOrSameUser', () => {
    let userParamReq;

    beforeEach(() => {
      userParamReq = {params: {username: 'test2'}};
    });

    it('Calls next with no args when user is same user', () => {
      userParamReq.user = {admin: false, username: 'test2'};
      ensureAdminOrSameUser(userParamReq, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('Calls next with no args when user is admin', () => {
      userParamReq.user = {admin: true, username: 'test1'};
      ensureAdminOrSameUser(userParamReq, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('Throws Unauth error when user is not admin or same user', () => {
      userParamReq.user = {admin: false, username: 'test1'};
      expect(() => { ensureAdminOrSameUser(userParamReq, {}, mockNext); }).toThrow(UnauthorizedError);
    })
  });

  describe('ensureLoggedIn', () => {
    it('Calls next with no args when user property exists on req', () => {
      const userReq = {user: {}};
      ensureLoggedIn(userReq, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('Throws Unauth error when user is not a property', () => {
      expect(() => { ensureLoggedIn({}, {}, mockNext); }).toThrow(UnauthenticatedError);
    });
  });

  describe('ensureAdminOrValidClub', () => {

    it('Returns a function', () => {
      const func = ensureAdminOrValidClub();
      expect(typeof func).toEqual('function');
    })

    it('Function returned calls next with no args when user is club member and club location in param', async () => {
      user2Req.params = {clubId: testObjects.club2.id};
      const func = ensureAdminOrValidClub('params', 'clubId', {});
      await func(user2Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('Function returned calls attaches club property when user is admin and club location in body', async () => {
      user1Req.body = {clubId: testObjects.club2.id};
      const func = ensureAdminOrValidClub('body', 'clubId', {});
      await func(user1Req, {}, mockNext);
      expect(user1Req.club).toEqual(testObjects.club2);
    });

    it('Function returned calls next with no args when club is public, allowPublic is true, and user is not member or admin', async () => {
      user3Req.params = {clubId: testObjects.club1.id};
      const func = ensureAdminOrValidClub('params', 'clubId', {allowPublic: true});
      await func(user3Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('Function returned calls next with no args when user is founder and founderOnly is true', async () => {
      user2Req.params = {clubId: testObjects.club2.id};
      const func = ensureAdminOrValidClub('params', 'clubId', {founderOnly: true});
      await func(user2Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("Function returned calls next with no args for admin, even when club ID cant be found, if adminSkipValidation is true", async () => {
      user1Req.params = {};
      const func = ensureAdminOrValidClub('params', 'clubId', {adminSkipValidation: true});
      await func(user1Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("Throws BadRequestError if club Id isn't integer", async () => {
      user1Req.params = {clubId: 'abc'};
      const func = ensureAdminOrValidClub('params', 'clubId', {});
      await func(user1Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it("Throws NotFoundError if club Id doesn't match", async () => {
      user1Req.params = { clubId: '9999' };
      const func = ensureAdminOrValidClub('params', 'clubId', {});
      await func(user1Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it("Throws UnauthorizedError if user is not admin or member", async () => {
      user2Req.params = { clubId: testObjects.club1.id };
      const func = ensureAdminOrValidClub('params', 'clubId', {});
      await func(user2Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockNext.mock.results[0].value.message).toEqual('Unauthorized: This route requires admin permissions or club membership.');
    });

    it("Throws UnauthorizedError if user is member but not founder and founderOnly is set", async () => {
      // Add user to club 1 to create this configuration
      const newMembership = await UserClub.create(testObjects.user2.username, testObjects.club1.id);
      user2Req.params = { clubId: testObjects.club1.id };
      const func = ensureAdminOrValidClub('params', 'clubId', {founderOnly: true});
      await func(user2Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockNext.mock.results[0].value.message).toEqual('Unauthorized: This route requires admin permissions or the club founder.');
    });

    it("Throws UnauthorizedError with longer message if user is not admin or member and isPublic is allowed", async () => {
      user3Req.params = { clubId: testObjects.club2.id };
      const func = ensureAdminOrValidClub('params', 'clubId', {allowPublic: true});
      await func(user3Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockNext.mock.results[0].value.message).toEqual('Unauthorized: This route requires admin permissions, a public club, or club membership.');
    });
  });

  describe('ensureAdminOrCommenter', () => {
    it('Calls next with no args if user is admin', async () => {
      user1Req.params = {commentId: testObjects.comment1.id};
      await ensureAdminOrCommenter(user1Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('Attaches comment to req if user is commenter', async () => {
      user2Req.params = {commentId: testObjects.comment1.id};
      await ensureAdminOrCommenter(user2Req, {}, mockNext);
      expect(user2Req.comment).toEqual(testObjects.comment1);
    });

    it('Throws error if commentId is not int', async () => {
      user1Req.params = {commentId: 'abc'};
      await ensureAdminOrCommenter(user1Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(mockNext.mock.results[0].value.message).toEqual('Comment ID must be an integer.');
    });

    it('Throws error if commentId not in database', async () => {
      user1Req.params = {commentId: '9999'};
      await ensureAdminOrCommenter(user1Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(mockNext.mock.results[0].value.message).toEqual(`No comment found with the ID 9999.`);
    });

    it('Throws UnauthorizedError if not commenter or admin', async () => {
      user3Req.params = {commentId: testObjects.comment1.id};
      await ensureAdminOrCommenter(user3Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockNext.mock.results[0].value.message).toEqual('Unauthorized: Must be admin or the user who made this comment to access this route.');
    });
  });

  describe('ensureAdminOrPoster', () => {
    it('Calls next with no args if user is admin', async () => {
      user1Req.params = {postId: testObjects.post2.id};
      await ensureAdminOrPoster(user1Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('Attaches post to req if user is poster', async () => {
      user2Req.params = {postId: testObjects.post2.id};
      await ensureAdminOrPoster(user2Req, {}, mockNext);
      expect(user2Req.post).toEqual(testObjects.post2);
    });

    it('Throws error if postId is not int', async () => {
      user1Req.params = {postId: 'abc'};
      await ensureAdminOrPoster(user1Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(mockNext.mock.results[0].value.message).toEqual('Post ID must be an integer.');
    });

    it('Throws error if commentId not in database', async () => {
      user1Req.params = {postId: '9999'};
      await ensureAdminOrPoster(user1Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(mockNext.mock.results[0].value.message).toEqual(`Post with ID 9999 not found.`);
    });

    it('Throws UnauthorizedError if not poster or admin', async () => {
      user3Req.params = {postId: testObjects.post2.id};
      await ensureAdminOrPoster(user3Req, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockNext.mock.results[0].value.message).toEqual('Unauthorized: Must be admin or the user who made this post to access this route.');
    });
  });
});

