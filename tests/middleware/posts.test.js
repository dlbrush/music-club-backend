const { checkPost } = require('../../middleware/posts');
const { BadRequestError, NotFoundError } = require('../../helpers/errors');
const db = require('../../db');
const { clearDb, createTestObjects } = require('../setup');

describe('Posts middleware functions', () => {
  let mockNext;
  let testObjects;

  beforeEach(async () => {
    mockNext = jest.fn((error) => error);
    testObjects = await createTestObjects();
  });

  afterAll(async () => {
    await db.end();
  });

  afterEach(async () => {
    mockNext.mockReset();
    await clearDb();
  });

  describe('checkPost', () => {
    it('Adds post to req and calls next with no args if post exists', async () => {
      const postReq = {params: {postId: testObjects.post1.id}};
      await checkPost(postReq, {}, mockNext);
      expect(postReq.post).toEqual(testObjects.post1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('Throws BadRequestError if post ID is not integer', async () => {
      const postReq = {params: {postId: 'abc'}};
      await checkPost(postReq, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(mockNext.mock.results[0].value.message).toEqual('Post ID must be an integer.');
    });

    it('Throws NotFoundError if post ID does not exist', async () => {
      const postReq = {params: {postId: '9999'}};
      await checkPost(postReq, {}, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(mockNext.mock.results[0].value.message).toEqual('Post with ID 9999 not found.');
    });
  })
})