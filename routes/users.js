const express = require('express');

const { BadRequestError, NotFoundError, UnauthenticatedError } = require('../helpers/errors');
const User = require('../models/User');
const MembershipService = require('../services/MembershipService');
const { validateRequest } = require('../helpers/validation');
const newUserSchema = require('../schemas/newUser.json');
const updateUserSchema = require('../schemas/updateUser.json');
const { AUTH_DURATION } = require('../config');
const { ensureAdmin, ensureLoggedIn, ensureAdminOrSameUser } = require('../middleware/auth');

const router = new express.Router();

router.get('/', ensureLoggedIn, async function (req, res, next) {
  try {
    const users = await User.getAll(req.query['username']);
    return res.json({ users });
  } catch (e) {
    return next(e);
  }
});

router.get('/:username', ensureAdminOrSameUser, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    if (!user) {
      throw new NotFoundError(`User ${req.params.username} not found.`);
    }
    return res.json({ user });
  } catch (e) {
    return next(e)
  }
});

router.post('/', async function (req, res, next) {
  try {
    // Validate request
    validateRequest(req.body, newUserSchema);

    const { username, password, email, profileImgUrl, admin=false} = req.body;

    // Check that there is no existing user that would violate the unique constraints on username or email
    try {
      await User.checkExisting(username, email);
    } catch (e) {
      throw new BadRequestError(e.message);
    }

    const newUser = await User.create(username, password, email, profileImgUrl, admin);
    return res.status(201).json({ newUser });
  } catch (e) {
    return next(e);
  }
});

/**
 * POST /:username/join-club/:clubId
 * Allows the user to attempt to join a club
 */
router.post('/:username/join-club/:clubId', async function (req, res, next) {
  try {
    // First, make sure passed club ID is an integer
    const clubId = parseInt(req.params.clubId);
    if (!Number.isInteger(clubId)) {
      throw new BadRequestError('Club ID must be an integer.')
    }
    const { username } = req.params;
    // Then, attempt join
    const message = await MembershipService.join(username, clubId);
    return res.status(201).json({ message });
  } catch (e) {
    next(e);
  }
});

router.patch('/:username', async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);

    if (!user) {
      throw new NotFoundError(`User ${req.params.username} not found.`);
    }

    // Validate passed properties
    validateRequest(req.body, updateUserSchema);

    // Update properties of user if they were passed in the body
    user.email = req.body.email || user.email;
    user.profileImgUrl = req.body.profileImgUrl || user.profileImgUrl;

    const message = await user.save();
    return res.json({message, user});
  } catch (e) {
    return next(e);
  }
});

router.delete('/:username', async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    if (!user) {
      throw new NotFoundError(`User ${req.params.username} not found.`);
    }
    const message = await user.delete();
    return res.json({ message });
  } catch(e) {
    return next(e);
  }
});

module.exports = router;