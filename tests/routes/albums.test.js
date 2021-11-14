const request = require('supertest');

const app = require("../../app");
const db = require('../../db');
const DiscogsService = require('../../services/DiscogsService');
const { userTokenCookie } = require('../setup');

describe('albums routes', () => {
  describe('/search GET', () => {
    let mockAlbumSearch;

    beforeEach(() => {
      mockAlbumSearch = jest.fn((title, artist) => {
        return [{title: title, artist: artist}]
      });
      DiscogsService.albumSearch = mockAlbumSearch;
    })

    afterEach(() => {
      mockAlbumSearch.mockReset();
    });

    afterAll(async () => {
      await db.end();
    })

    it('Returns results of album search based on query string', async () => {
      const response = await request(app)
                             .get('/albums/search?title=album&artist=person')
                             .set('Cookie', userTokenCookie);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        albums: [
          {
            title: 'album',
            artist: 'person'
          }
        ]
      });
    });

    it("Searches with empty strings if query keys aren't used", async () => {
      const response = await request(app)
                             .get('/albums/search')
                             .set('Cookie', userTokenCookie);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        albums: [
          {
            title: '',
            artist: ''
          }
        ]
      });
    });

    it('Returns Unauth error if no token', async () => {
      const response = await request(app)
                             .get('/albums/search');
      expect(response.status).toEqual(401);
    })
  });
});