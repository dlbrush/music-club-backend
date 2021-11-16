const db = require('../../db');
const { createTestObjects, clearDb } = require('../setup');
const MembershipService = require('../../services/MembershipService');
const UserClub = require('../../models/UserClub');

describe('MembershipService', () => {
  let user1, user2, user3, club1, club2;

  beforeEach(async () => {
    const testObjects = await createTestObjects();
    user1 = testObjects.user1;
    user2 = testObjects.user2;
    user3 = testObjects.user3;
    club1 = testObjects.club1;
    club2 = testObjects.club2;
  });

  afterEach(async () => {
    await clearDb();
  });

  afterAll(async () => {
    await db.end();
  })

  describe('#join', () => {
    it('Returns message on success', async () => {
      const message = await MembershipService.join(user1.username, club2.id);
      expect(message).toEqual(`User ${user1.username} has successfully joined club ${club2.name} (ID: ${club2.id})`);
    });

    it('Adds userclub to the DB on success', async () => {
      const message = await MembershipService.join(user1.username, club2.id);
      const userClub = await UserClub.get(user1.username, club2.id);
      expect(userClub).toEqual({
        username: user1.username,
        clubId: club2.id
      });
    });

    it('Throws NotFoundError when username not found', async () => {
      try {
        const message = await MembershipService.join('abc', club2.id);
      } catch(e) {
        expect(e.status).toEqual(404);
        expect(e.message).toEqual(`User with username abc not found`);
      }
    });

    it('Throws NotFoundError when club not found', async () => {
      try {
        const message = await MembershipService.join(user1.username, 9999);
      } catch(e) {
        expect(e.status).toEqual(404);
        expect(e.message).toEqual(`Club with ID 9999 not found.`);
      }
    });

    it('Throws BadRequestError if user is already a member', async () => {
      try {
        const message = await MembershipService.join(user2.username, club2.id);
      } catch(e) {
        expect(e.status).toEqual(400);
        expect(e.message).toEqual(`User ${user2.username} is already in club ${club2.name} (ID: ${club2.id})`);
      }
    });
  });

  describe('#checkMembership', () => {
    it('Returns true if user is club member in database', async () => {
      const isMember = await MembershipService.checkMembership(user2.username, club2.id);
      expect(isMember).toEqual(true);
    });

    it('Returns false if user is not club member in database', async () => {
      const isMember = await MembershipService.checkMembership(user2.username, club1.id);
      expect(isMember).toEqual(false);
    });
  });

  describe('#addFounder', () => {
    it('Returns a message on success', async () => {
      const message = await MembershipService.addFounder(user2, club1);
      expect(message).toEqual(`Founder ${user2.username} has successfully joined club ${club1.name} (ID: ${club1.id})`);
    });

    it('Attaches founder user object to passed club object as single user', async () => {
      const message = await MembershipService.addFounder(user2, club1);
      expect(club1.members).toEqual([user2]);
    });
  });

  describe('#getclubMembers', () => {
    it('Returns member objects in an array for passed club', async () => {
      const members = await MembershipService.getClubMembers(club1.id);
      expect(members).toEqual([
        {
          username: user1.username,
          profileImgUrl: user1.profileImgUrl
        }
      ])
    });

    it('Returns empty string when passed club ID has no associated members', async () => {
      const members = await MembershipService.getClubMembers(9999);
      expect(members).toEqual([]);
    });
  })
});