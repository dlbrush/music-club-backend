const db = require('../../db');
const UserClub = require('../../models/UserClub');
const { seedDb, clearDb } = require('../setup.js');

describe('UserClub model', () => {
  // Declare test items
  let user1;
  let user2;
  let club1;
  let club2;
  let userClub1;
  let userClub2;

  beforeEach(async () => {
    const testItems = await seedDb();
    user1 = testItems.user1;
    user2 = testItems.user2;
    club1 = testItems.club1;
    club2 = testItems.club2;
    userClub1 = testItems.userClub1;
    userClub2 = testItems.userClub2;
  });

  afterEach(async () => {
    await clearDb();
  });

  describe('#getAll', () => {
    it('Returns all user club relationships when no arguments passed', async () => {
      const userClubs = await UserClub.getAll();
      expect(userClubs.length).toEqual(2);
      expect(userClubs[0]).toEqual({
        clubId: club1.id,
        username: user1.username
      });
      expect(userClubs[1]).toEqual({
        clubId: club2.id,
        username: user2.username
      });
    });

    it('Returns only relationships for passed username', async () => {
      const userClubs = await UserClub.getAll('test1');
      expect(userClubs.length).toEqual(1);
      expect(userClubs[0]).toEqual({
        clubId: club1.id,
        username: user1.username
      });
    });

    it('Returns only relationships for passed club ID', async () => {
      const userClubs = await UserClub.getAll(undefined, club2.id);
      expect(userClubs.length).toEqual(1);
      expect(userClubs[0]).toEqual({
        clubId: club2.id,
        username: user2.username
      });
    });

    it('Returns empty array if no matches to filters', async () => {
      const userClubs = await UserClub.getAll('test1', club2.id);
      expect(userClubs).toEqual([]);
    });
  });

  describe('#get', () => {
    it('Returns relationship matching passed club id and username', async () => {
      const userClub = await UserClub.get(user1.username, club1.id);
      expect(userClub).toEqual({
        clubId: club1.id,
        username: user1.username
      });
    });

    it('Returns undefined if no relationship for that club and user', async () => {
      const userClub = await UserClub.get(user1.username, club2.id);
      expect(userClub).toEqual(undefined);
    });
  });

  describe('#create', () => {
    it('Returns UserClub object for the passed username and club ID', async () => {
      const userClub = await UserClub.create(user1.username, club2.id);
      expect(userClub).toEqual({
        username: user1.username,
        clubId: club2.id
      });
    });

    it('Adds relationship to database', async () => {
      const userClub = await UserClub.create(user1.username, club2.id);
      const dbUserClub = await UserClub.get(user1.username, club2.id);
      expect(dbUserClub).toEqual({
        username: userClub.username,
        clubId: userClub.clubId
      });
    });
  });

  describe('#delete', () => {
    it('Returns success message on success', async () => {
      const msg = await userClub1.delete();
      expect(msg).toEqual(`Deleted user ${userClub1.username} from club ${userClub1.clubId}`);
    });

    it('Removes relationship from DB', async () => {
      await userClub1.delete();
      const userClub = await UserClub.get(userClub1.username, userClub1.clubId);
      expect(userClub).toEqual(undefined);
    });

    it('Throws error if userClub object does not match club in DB', async () => {
      const badUserClub = new UserClub('test3', 888);
      try {
        await badUserClub.delete();
      } catch(e) {
        expect(e.message).toEqual(`Unable to delete ${badUserClub.username} from club ${badUserClub.clubId}`);
      }
    });
  });

  afterAll(async () => {
    await db.end();
  });
})