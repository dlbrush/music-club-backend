const express = require('express');

const { BadRequestError, UnauthenticatedError } = require('../helpers/errors');
const User = require('../models/User');
const { validateRequest } = require('../helpers/validation');
const newUserSchema = require('../schemas/newUser.json');
const updateUserSchema = require('../schemas/updateUser.json');
const { AUTH_DURATION } = require('../config');
const { ensureLoggedIn } = require('../middleware/auth');

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
    return res.status(201).json({ 
      user: {
        username: newUser.username,
        admin: newUser.admin
      }
    });
  } catch (e) {
    return next(e);
  }
});

router.post('/login', async function (req, res, next) {
  try {
    const { username, password } = req.body;
    let token;
    let user;

    try {
      const authenticated = await User.authenticate(username, password);
      token = authenticated.token;
      user = authenticated.user
    } catch(e) {
      throw new UnauthenticatedError(e.message);
    }

    res.cookie('token', token, {maxAge: AUTH_DURATION, httpOnly: true});
    res.json({ 
      user: {
        username: user.username,
        admin: user.admin
      }
    });
  } catch(e) {
    next(e)
  }
});

// Check cookie in browser and return user data if successful
router.post('/check', async function (req, res, next) {
  if (req.user) {
    res.json({ user: req.user });
  }
  next(new UnauthenticatedError('JWT not found'));
});

module.exports = router;