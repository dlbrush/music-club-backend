const AlbumGenre = require('../../models/AlbumGenre');
const { seedDb, clearDb } = require('../setup');
const db = require('../../db');

describe('AlbumGenre model', () => {
  let album1;
  let album2;
  let albumGenre1;
  let albumGenre2;

  beforeEach(async () => {
    const items = await seedDb();
    album1 = items.album1;
    album2 = items.album2;
    albumGenre1 = items.albumGenre1;
    albumGenre2 = items.albumGenre2;
  });

  afterEach(async () => {
    await clearDb();
  });

  afterAll(async () => {
    await db.end();
  });

  describe('#getForAlbum', () => {
    it('Returns array of all AlbumGenre items associated with an album', async () => {
      const albumGenres = await AlbumGenre.getForAlbum(album1.discogsId);
      expect(albumGenres).toEqual([albumGenre1, albumGenre2]);
    });

    it('Returns empty array if no match for ID', async () => {
      const albumGenres = await AlbumGenre.getForAlbum(9999);
      expect(albumGenres).toEqual([]);
    });
  });

  describe('#create', () => {
    it('Returns AlbumGenre object with new data', async () => {
      const albumGenre = await AlbumGenre.create(album2.discogsId, 'Rap');
      expect(albumGenre).toEqual({
        discogsId: album2.discogsId,
        genre: 'Rap'
      });
    });

    it('Adds AlbumGenre to db', async () => {
      await AlbumGenre.create(album2.discogsId, 'Rap');
      const albumGenre = await AlbumGenre.getForAlbum(album2.discogsId);
      expect(albumGenre[0]).toEqual({
        discogsId: album2.discogsId,
        genre: 'Rap'
      });
    });
  });

  describe('#createMany', () => {
    it('Returns AlbumGenre objects with new data', async () => {
      const albumGenres = await AlbumGenre.createMany(album2.discogsId, ['Rock', 'Pop']);
      expect(albumGenres).toEqual([
        {
          discogsId: album2.discogsId,
          genre: 'Rock'
        },
        {
          discogsId: album2.discogsId,
          genre: 'Pop'
        }
      ]);
    });

    it('Returns adds albumGenres to DB', async () => {
      await AlbumGenre.createMany(album2.discogsId, ['Rock', 'Pop']);
      const albumGenres = await AlbumGenre.getForAlbum(album2.discogsId);
      expect(albumGenres).toEqual([
        {
          discogsId: album2.discogsId,
          genre: 'Rock'
        },
        {
          discogsId: album2.discogsId,
          genre: 'Pop'
        }
      ]);
    });
  })
});