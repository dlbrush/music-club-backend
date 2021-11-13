const Invitation = require('../../models/Invitation');
const db = require('../../db');
const { seedDb, clearDb} = require('../setup');

describe('Invitation model', () => {
  let club1, club2, user1, user2, invitation1, invitation2;

  beforeEach(async () => {
    const testItems = await seedDb();
    club1 = testItems.club1;
    club2 = testItems.club2;
    user1 = testItems.user1;
    user2 = testItems.user2;
    invitation1 = testItems.invitation1;
    invitation2 = testItems.invitation2;
  });

  afterEach(async () => {
    await clearDb();
  });

  afterAll(async () => {
    await db.end();
  });

  describe('#getAll', () => {
    it('Returns all invitations when no username passed', async () => {
      const invitations = await Invitation.getAll();
      expect(invitations).toEqual([invitation1, invitation2]);
    });

    it('Returns all invitations for user with username passed', async () => {
      const invitations = await Invitation.getAll('test1');
      expect(invitations).toEqual([invitation2]);
    });

    it('Returns empty array when no matching username found', async () => {
      const invitations = await Invitation.getAll('abc');
      expect(invitations).toEqual([]);
    });
  });

  describe('#create', () => {
    it('Returns Invitation object with passed properties', async () => {
      const invitation = await Invitation.create(club2.id, user2.username, user1.username);
      expect(invitation).toEqual({
        clubId: club2.id,
        username: user2.username,
        sentFrom: user1.username
      });
    });

    it('Creates invitation in the DB', async () => {
      const invitation = await Invitation.create(club2.id, user2.username, user1.username);
      const invitations = await Invitation.getAll(user2.username);
      expect(invitations).toContainEqual({
        clubId: club2.id,
        username: user2.username,
        sentFrom: user1.username
      });
    });
  });

  describe('#delete', () => {
    it('Returns message on success', async () => {
      const invitations = await Invitation.getAll(user1.username);
      const invitation = invitations[0];
      const msg = await invitation.delete();
      expect(msg).toEqual(`Deleted invitation to club with ID ${invitation.clubId} for ${invitation.username}`);
    });

    it('Deletes invitation from DB', async () => {
      const invitations = await Invitation.getAll(user1.username);
      const invitation = invitations[0];
      const msg = await invitation.delete();
      const postDeleteInvitations = await Invitation.getAll(user1.username);
      expect(postDeleteInvitations).toEqual([]);
    });

    it('Throws error if invitation object does not match invitation in DB', async () => {
      try {
        const badInv = new Invitation(9999, 'no');
        await badInv.delete();
      } catch(e) {
        expect(e.message).toEqual(`Unable to delete invitation to club with ID 9999 for no`);
      }
    });
  });
})