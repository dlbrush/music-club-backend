const express = require('express');

const { BadRequestError, NotFoundError, UnauthorizedError } = require('../helpers/errors');
const User = require('../models/User');
const Club = require('../models/Club');
const Album = require('../models/Album');
const Post = require('../models/Post');
const UserClub = require('../models/UserClub');
const Invitation = require('../models/Invitation');
const DiscogsService = require('../services/DiscogsService');
const MembershipService = require('../services/MembershipService');
const newClubSchema = require('../schemas/newClub.json');
const clubSearchSchema = require('../schemas/clubSearch.json');
const updateClubSchema = require('../schemas/updateClub.json');
const newPostSchema = require('../schemas/newPost.json');
const { validateRequest } = require('../helpers/validation');
const { ensureLoggedIn, ensureAdminOrValidClub } = require('../middleware/auth');

const router = new express.Router();

router.get('/', ensureLoggedIn, async function(req, res, next) {
  try {
    // Convert isPublic query string to boolean if it matches boolean string
    if (req.query.isPublic !== undefined) {
      if (req.query.isPublic.toLowerCase() === 'true') {
        req.query.isPublic = true;
      } else if (req.query.isPublic.toLowerCase() === 'false') {
        req.query.isPublic = false;
      }
    }

    // Reject query for non-public clubs unless the user is an admin
    if (req.query.isPublic !== true && req.user.admin !== true) {
      throw new UnauthorizedError('Unauthorized: Only admin user can see all clubs. Add ?isPublic=true to get all public clubs.');
    }

    // Check that the query strings passed are valid
    validateRequest(req.query, clubSearchSchema);

    const clubs = await Club.getAll(req.query['isPublic'], req.query['name']);
    return res.json({ clubs });
  } catch (e) {
    next(e);
  }
});

router.get('/:clubId', ensureLoggedIn, ensureAdminOrValidClub('params', 'clubId', {allowPublic: true}), async function(req, res, next) {
  try {
    // Club will already be attached to req object from ensureAdminOrValidClub
    // List members based on UserClub records
    const userClubs = await UserClub.getAll('', req.club.id);
    const memberNames = userClubs.map(userClub => userClub.username);
    const members = await User.getSome(memberNames);
    req.club.members = members;

    return res.json({ club: req.club })
  } catch(e) {
    return next(e);
  }
});

// Get all invitations to a given club
router.get('/:clubId/invitations', ensureLoggedIn, ensureAdminOrValidClub('params', 'clubId', {allowPublic: true}), async function(req, res, next) {
  try {
    // Get invited users based on Invitation records
    const invitations = await Invitation.getAll(undefined, req.club.id);

    return res.json({ invitations })
  } catch(e) {
    return next(e);
  }
});


router.post('/', ensureLoggedIn, async function(req, res, next) {
  try {
    // Convert body.isPublic to boolean if possible
    if (req.body.isPublic) {
      if (req.body.isPublic.toLowerCase() === 'true') {
        req.body.isPublic = true;
      } else if (req.body.isPublic.toLowerCase() === 'false') {
        req.body.isPublic = false;
      }
    }
    // Remove bannerImgUrl prop if it's empty
    if (req.body.bannerImgUrl === '') delete req.body.bannerImgUrl;
    validateRequest(req.body, newClubSchema);

    const { name, description, founder, isPublic, bannerImgUrl } = req.body;

    // Check that the username passed as founder corresponds to a real user
    const founderUser = await User.get(founder);
    if (!founderUser) {
      throw new BadRequestError(`Founder username ${founder} does not match an existing user.`);
    }

    const newClub = await Club.create(name, description, founderUser, isPublic, bannerImgUrl);
    const joined = await MembershipService.addFounder(founderUser, newClub);

    return res.status(201).json({ newClub });
  } catch(e) {
    return next(e);
  }
});

router.post('/:clubId/new-post', ensureLoggedIn, ensureAdminOrValidClub('params', 'clubId', {}), async function(req, res, next) {
  try {
    // Try to convert discogs ID to integer
    req.body.discogsId = parseInt(req.body.discogsId);
    validateRequest(req.body, newPostSchema);

    const { content, discogsId, recTracks } = req.body;

    // Check that Discogs ID corresponds to existing album - if not, create album in DB with discogs data
    let album = await Album.get(discogsId);
    if (!album) {
      const { newAlbum } = await DiscogsService.populateAlbumData(discogsId);
      album = newAlbum;
    }

    // Finally, create the post with all of the data we have confirmed
    const newPost = await Post.create(req.club.id, discogsId, req.user.username, recTracks, content);
    return res.status(201).json({ newPost });
  } catch(e) {
    return next(e);
  }
});

router.patch('/:clubId', ensureAdminOrValidClub('params', 'clubId', {founderOnly: true}), async function (req, res, next) {
  try {
    // Validate request body
    validateRequest(req.body, updateClubSchema);

    const club = req.club

    // Update properties on club object for each property passed in body
    for (let prop in req.body) {
      club[prop] = req.body[prop];
    }

    // Update the club object in the database
    const message = await club.save();

    return res.json({ message, club });
  } catch(e) {
    next(e);
  }
});

router.delete('/:clubId', ensureAdminOrValidClub('params', 'clubId', {founderOnly: true}), async function (req, res, next) {
  try {
    const message = await req.club.delete();

    return res.json({ message });
  } catch(e) {
    next(e);
  }
});

module.exports = router;