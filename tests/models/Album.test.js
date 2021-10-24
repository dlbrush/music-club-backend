const db = require('../../db');
const Album = require('../../models/Album');
const { seedDb, clearDb } = require('../setup.js');

describe('Album model', () => {
  let album1;

  beforeEach(async () => {
    const items = await seedDb();
    album1 = items.album1
  });

  afterEach(async () => {
    await clearDb();
  });

  describe('#get', () => {
    it('Returns album matching passed discogs id', async () => {
      const album = await Album.get(album1.discogsId);
      expect(album).toEqual({
        discogsId: album1.discogsId,
        year: album1.year,
        artist: album1.artist,
        title: album1.title,
        coverImgUrl: album1.coverImgUrl
      });
    });

    it('Returns undefined if no album matching passed id', async () => {
      const album = await Album.get(9999);
      expect(album).toEqual(undefined);
    });
  });

  describe('#create', () => {
    it('Returns Album object', async () => {
      const album = await Album.create(1, 2020, 'test', 'test', 'test.jpg');
      expect(album).toEqual({
        discogsId: 1,
        year: 2020,
        artist: 'test',
        title: 'test',
        coverImgUrl: 'test.jpg'
      });
    });

    it('Adds album to database', async () => {
      const album = await Album.create(1, 2020, 'test', 'test', 'test.jpg');
      const dbAlbum = await Album.get(1);
      expect(dbAlbum).toEqual(album);
    });
  });


  afterAll(async () => {
    await db.end();
  });
})