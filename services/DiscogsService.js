const axios = require('axios');
const { DISCOGS_USER_AGENT, DISCOGS_ACCESS_KEY } = require('../config');
const Album = require('../models/Album');
const AlbumGenre = require('../models/AlbumGenre');

const requestConfig = {
  headers: {
    'Authorization': `Discogs token=${DISCOGS_ACCESS_KEY}`,
    'User-Agent': DISCOGS_USER_AGENT
  }
};

const discogsBaseUrl = 'https://api.discogs.com';

/**
 * Organizational class grouping all methods where we access the Discogs database
 */
class DiscogsService {
  static async populateAlbumData(discogsId) {
    try {
      // Get master release data from discogs
      const response = await axios.get(`${discogsBaseUrl}/masters/${discogsId}`, requestConfig);

      // Pull relevant data from JSON response
      const albumData = response.data;
      const { title, year, artists, genres, images } = albumData;
      const primaryImgObject = images.find(img => img.type === 'primary');
      const primaryImgUrl = primaryImgObject.uri;
      
      // Make all artist names into a single string
      const artistNames = artists.map(artist => artist.name);
      const artistString = artistNames.join(', ');

      // Add album to DB
      const newAlbum = await Album.create(discogsId, year, artistString, title, primaryImgUrl);

      console.log("It wasn't the album");

      // Create genre objects for each attached genre
      const genreObjects = await AlbumGenre.createMany(discogsId, genres);
      return { newAlbum, genreObjects };
    } catch(e) {
      throw e
    }
  }
}

module.exports = DiscogsService;