const express = require('express');

const { BadRequestError, NotFoundError } = require('../helpers/errors');
const { validateRequest } = require('../helpers/validation');
const User = require('../models/User');
const Club = require('../models/Club');
const newClubSchema = require('../schemas/newClub.json');
const clubSearchSchema = require('../schemas/clubSearch.json');
const updateClubSchema = require('../schemas/updateClub.json');

const router = new express.Router();

router.get('/', async function(req, res, next) {
  try {
    // Convert isPublic query string to boolean if it is set to true
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
    const clubId = req.params.clubId;
    const club = await Club.get(clubId);
    if (!club) {
      throw new NotFoundError(`Club with ID ${clubId} not found.`);
    }
    return res.json({ club })
  } catch(e) {
    return next(e);
  }
});

router.post('/', async function(req, res, next) {
  try {
    validateRequest(req.body, newClubSchema);

    const { name, description, founder, isPublic, bannerImgUrl } = req.body;

    // Check that the username passed as founder corresponds to a real user
    const founderUser = await User.get(founder);
    if (!founderUser) {
      throw new BadRequestError(`Founder username ${founder} does not match an existing user.`);
    }

    const newClub = await Club.create(name, description, founderUser, isPublic, bannerImgUrl);

    return res.status(201).json({ newClub });
  } catch(e) {
    return next(e);
  }
});

router.patch('/:clubId', async function (req, res, next) {
  try {
    const club = await Club.get(req.params.clubId);

    if (!club) {
      throw new NotFoundError(`Club with ID ${req.params.clubId} not found.`);
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
    const club = await Club.get(req.params.clubId);

    if (!club) {
      throw new NotFoundError(`Club with ID ${req.params.clubId} not found.`);
    }

    const message = await club.delete();

    return res.json({ message });
  } catch(e) {
    next(e);
  }
});

module.exports = router;