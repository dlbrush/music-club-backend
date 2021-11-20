const express = require('express');

const { ensureLoggedIn } = require('../middleware/auth');
const DiscogsService = require('../services/DiscogsService');

const router = new express.Router();

/**
 * Route that makes a search request to the Discogs database. 
 * This needs to be done from the backend since the Discogs search requires user authentication
 * Expects query string keys title and artist
 */
router.get('/search', ensureLoggedIn, async function(req, res, next) {
  try {
    const title = req.query.title || '';
    const artist = req.query.artist || '';
    const albums = await DiscogsService.albumSearch(title, artist);
    res.json({ albums });
  } catch(e) {
    next(e);
  }
});

module.exports = router;