const db = require('../../db');
const Album = require('../../models/Album');
const { seedDb, clearDb } = require('../setup.js');

describe('Album model', () => {
  let album1;
  let album2;

  beforeEach(async () => {
    const items = await seedDb();
    album1 = items.album1;
    album2 = items.album2;
  });

  afterEach(async () => {
    await clearDb();
  });

  afterAll(async () => {
    await db.end();
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

  describe('#getSome', () => {
    it('Returns all albums from array of discogs IDs', async () => {
      const albums = await Album.getSome([album1.discogsId, album2.discogsId]);
      expect(albums).toEqual([album1, album2])
    });

    it('Returns empty array when no IDs matched', async () => {
      const albums = await Album.getSome([9999]);
      expect(albums).toEqual([]);
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
});