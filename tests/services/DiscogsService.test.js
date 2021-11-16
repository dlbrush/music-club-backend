const DiscogsService = require('../../services/DiscogsService');
const axios = require('axios');
const db = require('../../db');
const { clearDb } = require('../setup');
const Album = require('../../models/Album');
const AlbumGenre = require('../../models/AlbumGenre');
const {DISCOGS_ACCESS_TOKEN, DISCOGS_USER_AGENT} = require('../../config');

jest.mock('axios');

describe('DiscogsService', () => {
  const requestConfig = {
    headers: {
      'Authorization': `Discogs token=${DISCOGS_ACCESS_TOKEN}`,
      'User-Agent': DISCOGS_USER_AGENT
    }
  };

  afterEach(async () => {
    await clearDb();
    axios.get.mockReset();
  })

  afterAll(async () => {
    await db.end();
  })

  describe('#populateAlbumData', () => {
    let mockMasterAlbumResponse;

    beforeEach(() => {
      mockMasterAlbumResponse = {
        data: {
          title: 'Best of Eagles',
          year: 1985,
          artists: [{name: 'Eagles'}],
          genres: ['Rock', 'Pop'],
          images: [{type: 'primary', uri: 'https://test.com/test.jpg'}]
        }
      };
      axios.get.mockResolvedValue(mockMasterAlbumResponse);
    });

    it('Returns album data from API call on success', async () => {
      const { newAlbum } = await DiscogsService.populateAlbumData(12345);
      expect(newAlbum).toEqual({
        title: mockMasterAlbumResponse.data.title,
        year: mockMasterAlbumResponse.data.year,
        discogsId: 12345,
        artist: 'Eagles',
        coverImgUrl: 'https://test.com/test.jpg'
      });
    });

    it('Concatenates artist names if there are multiple', async () => {
      mockMasterAlbumResponse.data.artists.push({name: 'Don Henley'});
      const { newAlbum } = await DiscogsService.populateAlbumData(12345);
      expect(newAlbum.artist).toEqual('Eagles, Don Henley');
    });

    it('Uses first available image if primary image not found', async () => {
      mockMasterAlbumResponse.data.images[0].type = 'secondary';
      const { newAlbum } = await DiscogsService.populateAlbumData(12345);
      expect(newAlbum.coverImgUrl).toEqual('https://test.com/test.jpg');
    });

    it('Adds album data to the DB', async () => {
      const { newAlbum } = await DiscogsService.populateAlbumData(12345);
      const album = await Album.get(12345);
      expect(album).toEqual({
        title: mockMasterAlbumResponse.data.title,
        year: mockMasterAlbumResponse.data.year,
        discogsId: 12345,
        artist: 'Eagles',
        coverImgUrl: 'https://test.com/test.jpg'
      });
    });

    it('Returns album genre data', async () => {
      const { genreObjects } = await DiscogsService.populateAlbumData(12345);
      expect(genreObjects).toEqual([
        {
          discogsId: 12345,
          genre: 'Rock'
        },
        {
          discogsId: 12345,
          genre: 'Pop'
        }
      ]);
    });

    it('Adds album genre data to the DB', async () => {
      const { genreObjects } = await DiscogsService.populateAlbumData(12345);
      const albumGenres = await AlbumGenre.getForAlbum(12345);
      expect(albumGenres).toEqual([
        {
          discogsId: 12345,
          genre: 'Rock'
        },
        {
          discogsId: 12345,
          genre: 'Pop'
        }
      ]);
    });

    it('Re-throws error that occurs', async () => {
      try {
        // Set return value empty
        mockMasterAlbumResponse = {};
        const { genreObjects } = await DiscogsService.populateAlbumData(12345);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
    });
  });

  describe('#albumSearch', () => {
    let mockSearchResults;

    beforeEach(() => {
      mockSearchResults = {
        data: {
          results: [
            {
              title: 'Best of Eagles',
              artist: 'Eagles',
              id: 12345,
              year: 1985,
              cover_image: 'https://test.com/test.jpg'
            },
            {
              title: 'Best Coast',
              artist: 'Best Coast',
              id: 12346,
              year: 2005,
              cover_image: 'https://test.com/test2.jpg'
            },
          ]
        }
      };
      axios.get.mockResolvedValue(mockSearchResults);
    });

    it('Makes a call to API with the passed query string and request config', async () => {
      await DiscogsService.albumSearch('Best', 'Eagles');
      expect(axios.get).toHaveBeenCalledWith(`https://api.discogs.com/database/search?type=master&release_title=Best&artist=Eagles`, requestConfig);
    });

    it('Returns specifc data from API result', async () => {
      const albums = await DiscogsService.albumSearch('Best', 'Eagles');
      expect(albums).toEqual([
        {
          title: 'Best of Eagles',
          id: 12345,
          year: 1985,
          coverImgUrl: 'https://test.com/test.jpg'
        },
        {
          title: 'Best Coast',
          id: 12346,
          year: 2005,
          coverImgUrl: 'https://test.com/test2.jpg'
        },
      ])
    });

    it('Returns empty array if no results', async () => {
      mockSearchResults.data.results = [];
      const albums = await DiscogsService.albumSearch('Best', 'Eagles');
      expect(albums).toEqual([]);
    });

    it('Re-throws error that occurs', async () => {
      try {
        // Set return value empty
        mockSearchResults = {};
        const albums = await DiscogsService.albumSearch('Best', 'Eagles');
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
    });
  });
});