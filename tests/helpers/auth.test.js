const { generateUserToken } = require("../../helpers/auth");
const jwt = require('jsonwebtoken');

describe('Auth helper functions', () => {
  describe('generateUserToken', () => {
    it('Returns string token', () => {
      const token = generateUserToken('test1', true);
      expect(token).toEqual(expect.any(String));
    });

    it('Returns JWT with username and admin properties', () => {
      const token = generateUserToken('test1', true);
      expect(jwt.decode(token)).toEqual({
        username: 'test1',
        admin: true,
        iat: expect.any(Number)
      });
    })
  })
});