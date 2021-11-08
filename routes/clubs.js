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
const { ensureLoggedIn } = require('../middleware/auth');

const router = new express.Router();

router.get('/', async function(req, res, next) {
  try {
    // Convert isPublic query string to boolean if it matches boolean string
    if (req.query.isPublic !== undefined) {
      if (req.query.isPublic.toLowerCase() === 'true') {
        req.query.isPublic = true;
      } else if (req.query.isPublic.toLowerCase() === 'false') {
        req.query.isPublic = false;
      }
    }

    // Check that the query strings passed are valid
    validateRequest(req.query, clubSearchSchema);

    const clubs = await Club.getAll(req.query['isPublic'], req.query['name']);
    return res.json({ clubs });
  } catch (e) {
    next(e);
  }
});

router.get('/:clubId', async function(req, res, next) {
  try {
    const clubId = parseInt(req.params.clubId);
    if (!Number.isInteger(clubId)) {
      throw new BadRequestError('Club ID must be an integer.')
    }
    const club = await Club.get(clubId);
    if (!club) {
      throw new NotFoundError(`Club with ID ${clubId} not found.`);
    }
    // List members based on UserClub records
    const userClubs = await UserClub.getAll('', clubId);
    const memberNames = userClubs.map(userClub => userClub.username);
    const members = await User.getSome(memberNames);
    club.members = members;

    return res.json({ club })
  } catch(e) {
    return next(e);
  }
});

// Get all invitations to a given club
router.get('/:clubId/invitations', async function(req, res, next) {
  try {
    const clubId = parseInt(req.params.clubId);
    if (!Number.isInteger(clubId)) {
      throw new BadRequestError('Club ID must be an integer.')
    }
    const club = await Club.get(clubId);
    if (!club) {
      throw new NotFoundError(`Club with ID ${clubId} not found.`);
    }

    // Get invited users based on Invitation records
    const invitations = await Invitation.getAll(undefined, clubId);

    return res.json({ invitations })
  } catch(e) {
    return next(e);
  }
});


router.post('/', async function(req, res, next) {
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

router.post('/:clubId/new-post', ensureLoggedIn, async function(req, res, next) {
  try {
    // Check that club ID is integer and corresponds to real club
    const clubId = parseInt(req.params.clubId);
    if (!clubId) {
      throw new BadRequestError('Club ID must be an integer.')
    }
    const club = await Club.get(clubId);
    if (!club) {
      throw new NotFoundError(`Club with ID ${clubId} not found.`);
    }

    // Try to convert discogs ID to integer
    req.body.discogsId = parseInt(req.body.discogsId);
    validateRequest(req.body, newPostSchema);

    const { content, discogsId, recTracks } = req.body;

    // Check that the logged in user is a member of the club they're trying to post to
    const isMember = await MembershipService.checkMembership(req.user.username, clubId);
    if (!isMember) {
      throw new UnauthorizedError('Unauthorized: You are not a member of the club you are attempting to post to.');
    }

    // Check that Discogs ID corresponds to existing album - if not, create album in DB with discogs data
    let album = await Album.get(discogsId);
    if (!album) {
      const { newAlbum } = await DiscogsService.populateAlbumData(discogsId);
      album = newAlbum;
    }

    // Finally, create the post with all of the data we have confirmed
    const newPost = await Post.create(clubId, discogsId, req.user.username, recTracks, content);
    return res.status(201).json({ newPost });
  } catch(e) {
    return next(e);
  }
});

router.patch('/:clubId', async function (req, res, next) {
  try {
    const clubId = parseInt(req.params.clubId);
    if (!clubId) {
      throw new BadRequestError('Club ID must be an integer.')
    }

    const club = await Club.get(clubId);

    if (!club) {
      throw new NotFoundError(`Club with ID ${clubId} not found.`);
    }

    // Validate request body
    validateRequest(req.body, updateClubSchema);

    // Update properties on club object for each property passed in body
    for (let prop in req.body) {
      club[prop] = req.body[prop];
    }

    // Update the club object in the database
    const message = await club.save();

    return res.json({message, club});
  } catch(e) {
    next(e);
  }
});

router.delete('/:clubId', async function (req, res, next) {
  try {
    const clubId = parseInt(req.params.clubId);
    if (!clubId) {
      throw new BadRequestError('Club ID must be an integer.')
    }

    const club = await Club.get(clubId);

    if (!club) {
      throw new NotFoundError(`Club with ID ${clubId} not found.`);
    }

    const message = await club.delete();

    return res.json({ message });
  } catch(e) {
    next(e);
  }
});

module.exports = router;