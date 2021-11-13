const db = require('../../db');
const Club = require('../../models/Club');
const User = require('../../models/User');
const { DEFAULT_BANNER_IMG } = require('../../helpers/constants');
const { seedDb, clearDb } = require('../setup.js');

const jwt = require('jsonwebtoken');

describe('Club model', () => {
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
    it('Returns all clubs with expected properties when no arguments passed', async () => {
      const clubs = await Club.getAll();
      expect(clubs.length).toEqual(2);
      expect(clubs[0]).toEqual({
        bannerImgUrl: club1.bannerImgUrl,
        id: club1.id,
        name: club1.name,
        description: club1.description,
        founder: club1.founder,
        isPublic: club1.isPublic
      });
      expect(clubs[1]).toEqual({
        bannerImgUrl: club2.bannerImgUrl,
        id: club2.id,
        name: club2.name,
        description: club2.description,
        founder: club2.founder,
        isPublic: club2.isPublic
      });
    });

    it('Returns only clubs matching passed name', async () => {
      const clubs = await Club.getAll(undefined, '2');
      expect(clubs.length).toEqual(1);
      expect(clubs[0]).toEqual({
        bannerImgUrl: club2.bannerImgUrl,
        id: club2.id,
        name: club2.name,
        description: club2.description,
        founder: club2.founder,
        isPublic: club2.isPublic
      });
    });

    it('Returns only public clubs if first parameter is true', async () => {
      const clubs = await Club.getAll(true);
      expect(clubs.length).toEqual(1);
      expect(clubs[0]).toEqual({
        bannerImgUrl: club1.bannerImgUrl,
        id: club1.id,
        name: club1.name,
        description: club1.description,
        founder: club1.founder,
        isPublic: club1.isPublic
      });
    });

    it('Returns empty array if no matches to filters', async () => {
      const clubs = await Club.getAll(true, '2');
      expect(clubs).toEqual([]);
    });
  });

  describe('#getSome', () => {
    it('Returns clubs matching passed IDs', async () => {
      const clubs = await Club.getSome([club1.id, club2.id]);
      expect(clubs.length).toEqual(2);
      expect(clubs[0]).toEqual({
        bannerImgUrl: club1.bannerImgUrl,
        id: club1.id,
        name: club1.name,
        description: club1.description,
        founder: club1.founder,
        isPublic: club1.isPublic
      });
      expect(clubs[1]).toEqual({
        bannerImgUrl: club2.bannerImgUrl,
        id: club2.id,
        name: club2.name,
        description: club2.description,
        founder: club2.founder,
        isPublic: club2.isPublic
      });
    });

    it('Returns empty array if no club IDs matched', async () => {
      const clubs = await Club.getSome([9999]);
      expect(clubs).toEqual([]);
    });
  })

  describe('#get', () => {
    it('Returns club matching passed id', async () => {
      const club = await Club.get(club1.id);
      expect(club).toEqual({
        id: club1.id,
        name: club1.name,
        description: club1.description,
        founder: club1.founder,
        isPublic: club1.isPublic,
        founded: club1.founded,
        bannerImgUrl: club1.bannerImgUrl
      });
    });

    it('Returns undefined if no club with that ID', async () => {
      const club = await Club.get(9999);
      expect(club).toEqual(undefined);
    });
  });

  describe('#create', () => {
    it('Returns club with all passed attributes', async () => {
      const club = await Club.create('testClub3', 'testing club 3', user1, true, 'https://clubtest.com/a.jpg');
      expect(club).toEqual({
        id: expect.any(Number),
        name: 'testClub3',
        description: 'testing club 3',
        founder: 'test1',
        isPublic: true,
        founded: expect.any(Date),
        bannerImgUrl: 'https://clubtest.com/a.jpg'
      });
    });

    it('Adds club to database', async () => {
      const club = await Club.create('testClub3', 'testing club 3', user1, true, 'https://clubtest.com/a.jpg');
      const dbClub = await Club.get(club.id);
      expect(dbClub).toEqual({
        id: expect.any(Number),
        name: 'testClub3',
        description: 'testing club 3',
        founder: 'test1',
        isPublic: true,
        founded: expect.any(Date),
        bannerImgUrl: 'https://clubtest.com/a.jpg'
      })
    });

    it('Returns a club with default banner if banner not passed', async () => {
      const club = await Club.create('testClub3', 'testing club 3', user1, true);
      expect(club.bannerImgUrl).toEqual(DEFAULT_BANNER_IMG);
    });
  });

  describe('#delete', () => {
    it('Returns success message on success', async () => {
      const msg = await club1.delete();
      expect(msg).toEqual(`Deleted club ${club1.name}. (ID: ${club1.id})`);
    });

    it('Removes user from DB', async () => {
      await club1.delete();
      const club = await Club.get(club1.id);
      expect(club).toEqual(undefined);
    });

    it('Throws error if club object does not match club in DB', async () => {
      try {
        const badClub = new Club(9999);
        await badClub.delete();
      } catch(e) {
        expect(e.message).toEqual(`No club deleted. (ID: ${club1.id})`);
      }
    });
  });

  describe('#save', () => {
    it('Returns success message on success', async () => {
      const msg = await club1.save();
      expect(msg).toEqual(`Updated club ${club1.name}. (ID: ${club1.id})`);
    });

    it('Updates club in DB when changes are made', async () => {
      club1.name = 'New club';
      club1.description = 'Come on in'
      club1.bannerImgUrl = 'http://google.com/new.jpg';
      await club1.save();
      const club = await Club.get(club1.id);
      expect(club).toEqual({
        id: club1.id,
        name: club1.name,
        description: club1.description,
        founder: club1.founder,
        isPublic: club1.isPublic,
        founded: club1.founded,
        bannerImgUrl: club1.bannerImgUrl
      });
    });

    it('Makes no changes otherwise', async () => {
      await club1.save();
      const club = await Club.get(club1.id);
      expect(club).toEqual({
        id: club1.id,
        name: club1.name,
        description: club1.description,
        founder: club1.founder,
        isPublic: club1.isPublic,
        founded: club1.founded,
        bannerImgUrl: club1.bannerImgUrl
      });
    });

    it('Throws error if club object does not match club in DB', async () => {
      try {
        const badClub = new Club(9999, 'bad');
        await badClub.save();
      } catch(e) {
        expect(e.message).toEqual(`Unable to update club ${badClub.name}. (ID: ${badClub.id})`);
      }
    });
  });

  afterAll(async () => {
    await db.end();
  })
})