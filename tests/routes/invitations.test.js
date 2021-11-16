const request = require('supertest');

const app = require('../../app');
const db = require('../../db');
const Invitation = require('../../models/Invitation');
const { createTestObjects, clearDb, adminTokenCookie, user2TokenCookie, user3TokenCookie } = require('../setup');


describe('invitations routes', () => {
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
  });

  describe('/ POST', () => {
    it("Returns invitation data when inviting a user to a club they're not in as admin", async () => {
      const invitationBody = {
        username: user3.username,
        clubId: club2.id
      }
      const response = await request(app)
                             .post('/invitations')
                             .set('Cookie', adminTokenCookie)
                             .send(invitationBody);
      expect(response.status).toEqual(201);
      expect(response.body).toEqual({
        invitation: {
          clubId: club2.id,
          username: user3.username,
          sentFrom: user1.username
        }
      });
    });

    it("Adds invitation to the db when inviting a user to a club they're not in as member of the club", async () => {
      const invitationBody = {
        username: user3.username,
        clubId: club2.id
      }
      const response = await request(app)
                             .post('/invitations')
                             .set('Cookie', user2TokenCookie)
                             .send(invitationBody);
      const invitationArr = await Invitation.getAll(invitationBody.username, invitationBody.clubId);
      expect(invitationArr[0]).toEqual({
          clubId: club2.id,
          username: user3.username,
          sentFrom: user2.username
      });
    });

    it('Throws bad request error if club ID is not integer', async () => {
      const invitationBody = {
        username: user3.username,
        clubId: 'abc'
      }
      const response = await request(app)
                             .post('/invitations')
                             .set('Cookie', user2TokenCookie)
                             .send(invitationBody);
      expect(response.status).toEqual(400);
    });

    it('Throws not found error if club ID does not exist', async () => {
      const invitationBody = {
        username: user3.username,
        clubId: '9999'
      }
      const response = await request(app)
                             .post('/invitations')
                             .set('Cookie', user2TokenCookie)
                             .send(invitationBody);
      expect(response.status).toEqual(404);
    });

    it('Throws unauth error if inviting member is not member of the club', async () => {
      const invitationBody = {
        username: user3.username,
        clubId: club1.id
      }
      const response = await request(app)
                             .post('/invitations')
                             .set('Cookie', user2TokenCookie)
                             .send(invitationBody);
      expect(response.status).toEqual(403);
    });

    it('Throws not found error if invited user does not exist', async () => {
      const invitationBody = {
        username: 'abc',
        clubId: club2.id
      }
      const response = await request(app)
                             .post('/invitations')
                             .set('Cookie', user2TokenCookie)
                             .send(invitationBody);
      expect(response.status).toEqual(404);
      expect(response.body).toEqual({
        error: {
          status: 404,
          message: `User with username ${invitationBody.username} not found.`
        }
      });
    });

    it('Throws bad request error if invited user is already part of the club', async () => {
      const invitationBody = {
        username: user2.username,
        clubId: club2.id
      }
      const response = await request(app)
                             .post('/invitations')
                             .set('Cookie', user2TokenCookie)
                             .send(invitationBody);
      expect(response.status).toEqual(400);
      expect(response.body).toEqual({
        error: {
          status: 400,
          message: `User ${invitationBody.username} is already a member of club ${invitationBody.clubId}`
        }
      });
    });
  });
});