const express = require('express');

const { BadRequestError, NotFoundError, UnauthenticatedError } = require('../helpers/errors');
const User = require('../models/User');
const MembershipService = require('../services/MembershipService');
const { validateRequest } = require('../helpers/validation');
const newUserSchema = require('../schemas/newUser.json');
const updateUserSchema = require('../schemas/updateUser.json');
const { AUTH_DURATION } = require('../config');
const { ensureAdmin, ensureLoggedIn, ensureAdminOrSameUser } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async function (req, res, next) {
  try {
    validateRequest(req.body, newUserSchema);

    const { username, password, email, profileImgUrl } = req.body;

    // Check that there is no existing user that would violate the unique constraints on username or email
    try {
      await User.checkExisting(username, email);
    } catch (e) {
      throw new BadRequestError(e.message);
    }

    // Register user and receive JWT with username and admin status
    const { newUser, token } = await User.register(username, password, email, profileImgUrl);

    res.cookie('token', token, {maxAge: AUTH_DURATION, httpOnly: true});
    return res.status(201).json({ newUser });
  } catch (e) {
    return next(e);
  }
});

router.post('/login', async function (req, res, next) {
  try {
    const { username, password } = req.body;
    let message;
    let token;

    try {
      const authenticated = await User.authenticate(username, password);
      message = authenticated.message;
      token = authenticated.token;
    } catch(e) {
      throw new UnauthenticatedError(e.message);
    }

    res.cookie('token', token, {maxAge: AUTH_DURATION, httpOnly: true});
    res.json({ message });
  } catch(e) {
    next(e)
  }
});

// Check cookie in browser and return success if cookie passes middleware
router.post('/check', ensureLoggedIn, async function (req, res, next) {
  try {
    res.json({ message: 'User is logged in.' });
  } catch(e) {
    next(e)
  }
});

module.exports = router;