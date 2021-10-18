const db = require('../../db');
const User = require('../../models/User');
const { seedDb, clearDb } = require('./setup.js')

describe('User model', () => {
  // Declare test items
  let user1;
  let user2;
  let club1;
  let club2;

  beforeEach(async () => {
    const testItems = await seedDb();
    user1 = testItems.user1;
    user2 = testItems.user2;
    club1 = testItems.club1;
    club2 = testItems.club2;
  });

  afterEach(async () => {
    await clearDb();
  });

  describe('#getAll', () => {
    it('Returns all users with expected properties when no arguments passed', async () => {
      const users = await User.getAll();
      expect(users.length).toEqual(2);
      expect(users[0]).toEqual({
        username: user1.username,
        email: user1.email,
        profileImgUrl: user1.profileImgUrl
      });
      expect(users[1]).toEqual({
        username: user2.username,
        email: user2.email,
        profileImgUrl: user2.profileImgUrl
      });
    });

    it('Returns only users matching passed username', async () => {
      const users = await User.getAll(undefined, 'test2');
      expect(users.length).toEqual(1);
      expect(users[0]).toEqual({
        username: user2.username,
        email: user2.email,
        profileImgUrl: user2.profileImgUrl
      });
    });

    it('Returns only users in the club with passed ID', async () => {
      const users = await User.getAll(club1.id);
      expect(users.length).toEqual(1);
      expect(users[0]).toEqual({
        username: user1.username,
        email: user1.email,
        profileImgUrl: user1.profileImgUrl
      });
    });

    it('Returns empty array if no matches to filters', async () => {
      const users = await User.getAll(club1.id, 'abc');
      expect(users).toEqual([]);
    });
  });

  describe('#get', () => {
    it('Returns user matching passed username', async () => {
      const user = await User.get('test1');
      expect(user).toEqual({
        username: user1.username,
        email: user1.email,
        profileImgUrl: user1.profileImgUrl,
        admin: user1.admin
      });
    });

    it('Returns user matching passed email if no username matched', async () => {
      const user = await User.get('abc', 'test1@test.com');
      expect(user).toEqual({
        username: user1.username,
        email: user1.email,
        profileImgUrl: user1.profileImgUrl,
        admin: user1.admin
      });
    })

    it('Returns undefined if no match on either property', async () => {
      const user = await User.get('abc', 'test99@test.com');
      expect(user).toEqual(undefined);
    })
  });

  afterAll(async () => {
    await db.end();
  })
})