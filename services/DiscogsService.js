const axios = require('axios');
const { DISCOGS_USER_AGENT, DISCOGS_ACCESS_TOKEN } = require('../config');
const Album = require('../models/Album');
const AlbumGenre = require('../models/AlbumGenre');

const requestConfig = {
  headers: {
    'Authorization': `Discogs token=${DISCOGS_ACCESS_TOKEN}`,
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
      console.log(albumData);
      const { title, year, artists, genres, images } = albumData;
      const primaryImgObject = images.find(img => img.type === 'primary') || images[0];
      const primaryImgUrl = primaryImgObject.uri;
      
      // Make all artist names into a single string
      const artistNames = artists.map(artist => artist.name);
      const artistString = artistNames.join(', ');

      // Add album to DB
      const newAlbum = await Album.create(discogsId, year, artistString, title, primaryImgUrl);

      // Create genre objects for each attached genre
      const genreObjects = await AlbumGenre.createMany(discogsId, genres);
      return { newAlbum, genreObjects };
    } catch(e) {
      throw e
    }
  }

  static async albumSearch(title, artist) {
    // Send album search request to discogs API
    try {
      console.log('Am I here');
      const response = await axios.get(`${discogsBaseUrl}/database/search?type=master&release_title=${title}&artist=${artist}`, requestConfig);
      // Return array of specific data from results
      return response.data.results.map(album => {
        const { title, id, year, cover_image } = album;
        return {
          title,
          id,
          year,
          coverImgUrl: cover_image,
        }
      })
    } catch(e) {
      console.log(e);
      throw e
    }
  }
}

module.exports = DiscogsService;