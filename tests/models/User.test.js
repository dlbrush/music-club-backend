const db = require('../../db');
const User = require('../../models/User');
const { DEFAULT_PROFILE_IMG } = require('../../helpers/constants');
const { seedDb, clearDb } = require('../setup.js');

const jwt = require('jsonwebtoken');

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
      const users = await User.getAll('test2');
      expect(users.length).toEqual(1);
      expect(users[0]).toEqual({
        username: user2.username,
        email: user2.email,
        profileImgUrl: user2.profileImgUrl
      });
    });

    it('Returns empty array if no matches to filters', async () => {
      const users = await User.getAll('abc');
      expect(users).toEqual([]);
    });
  });

  describe('#getSome', () => {
    it('Returns all users matching passed array of usernames', async () => {
      const users = await User.getSome(['test2']);
      expect(users.length).toEqual(1);
      expect(users[0]).toEqual({
        username: user2.username,
        email: user2.email,
        profileImgUrl: user2.profileImgUrl
      });
    });

    it('Returns an empty array when no usernames match', async () => {
      const users = await User.getSome(['abc']);
      expect(users).toEqual([]);
    })
  })

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

  describe('#create', () => {
    it('Returns user with all passed attributes', async () => {
      const user = await User.create('test3', 'test3', 'test3@test.com', 'http://test.com/3.jpg', true);
      expect(user).toEqual({
        username: 'test3',
        email: 'test3@test.com',
        profileImgUrl: 'http://test.com/3.jpg',
        admin: true
      });
    });

    it('Adds user to database', async () => {
      await User.create('test3', 'test3', 'test3@test.com', 'http://test.com/3.jpg', true);
      const dbUser = await User.get('test3');
      expect(dbUser).toEqual({
        username: 'test3',
        email: 'test3@test.com',
        profileImgUrl: 'http://test.com/3.jpg',
        admin: true
      });
    });

    it('Returns a user with default values if not all values passed', async () => {
      const user = await User.create('test3', 'test3', 'test3@test.com');
      expect(user).toEqual({
        username: 'test3',
        email: 'test3@test.com',
        profileImgUrl: DEFAULT_PROFILE_IMG,
        admin: false
      });
    });
  });

  describe('#register', () => {
    it('Returns a JWT with username and admin status in the body', async () => {
      const userJwt = await User.register('test3', 'test3', 'test3@test.com', 'http://test.com/3.jpg');
      expect(userJwt).toEqual(expect.any(String));
      const decoded = jwt.decode(userJwt);
      expect(decoded).toMatchObject({
        username: 'test3',
        admin: false
      });
    });

    it('Adds user to database', async () => {
      await User.register('test3', 'test3', 'test3@test.com', 'http://test.com/3.jpg');
      const dbUser = await User.get('test3');
      expect(dbUser).toEqual({
        username: 'test3',
        email: 'test3@test.com',
        profileImgUrl: 'http://test.com/3.jpg',
        admin: false
      });
    });
  });

  describe('#checkExisting', () => {
    it('Returns undefined if user does not exist in the database', async () => {
      const user = await User.checkExisting('abc', 'abc');
      expect(user).toEqual(undefined);
    });

    it('Throws error with username and email if user with both exists', async () => {
      try {
        const user = await User.checkExisting('test2', 'test2@test.com');
      } catch(e) {
        expect(e.message).toEqual('User with username test2 and email test2@test.com already exists.');
      }
    });

    it('Throws error with username if only username exists', async () => {
      try {
        const user = await User.checkExisting('test2', 'test3@test.com');
      } catch(e) {
        expect(e.message).toEqual('User with username test2 already exists.');
      }
    });

    it('Throws error with email if only email exists', async () => {
      try {
        const user = await User.checkExisting('test3', 'test2@test.com');
      } catch(e) {
        expect(e.message).toEqual('User with email test2@test.com already exists.');
      }
    });
  });

  describe('#delete', () => {
    it('Returns success message on success', async () => {
      const msg = await user1.delete();
      expect(msg).toEqual('Deleted user test1.');
    });

    it('Removes user from DB', async () => {
      await user1.delete();
      const user = await User.get('test1');
      expect(user).toEqual(undefined);
    });

    it('Throws error if user object does not match user in DB', async () => {
      try {
        const badUser = new User('abc');
        await badUser.delete();
      } catch(e) {
        expect(e.message).toEqual('Unable to delete user abc');
      }
    });
  });

  describe('#save', () => {
    it('Returns success message on success', async () => {
      const msg = await user1.save();
      expect(msg).toEqual('Updated user test1.');
    });

    it('Updates user in DB when changes are made', async () => {
      user1.email = 'new@test.com';
      user1.profileImgUrl = 'http://google.com/new.jpg';
      await user1.save();
      const user = await User.get('test1');
      expect(user).toEqual({
        username: user1.username,
        email: user1.email,
        profileImgUrl: user1.profileImgUrl,
        admin: user1.admin
      });
    });

    it('Makes no changes otherwise', async () => {
      await user1.save();
      const user = await User.get('test1');
      expect(user).toEqual({
        username: user1.username,
        email: user1.email,
        profileImgUrl: user1.profileImgUrl,
        admin: user1.admin
      });
    });

    it('Throws error if user object does not match user in DB', async () => {
      try {
        const badUser = new User('abc');
        await badUser.save();
      } catch(e) {
        expect(e.message).toEqual('Unable to update user abc');
      }
    });
  });

  afterAll(async () => {
    await db.end();
  })
})