const express = require('express');
const jsonschema = require('jsonschema');

const { BadRequestError, NotFoundError } = require('../helpers/errors');
const User = require('../models/User');
const newUserSchema = require('../schemas/newUser.json');
const updateUserSchema = require('../schemas/updateUser.json');

const router = new express.Router();

router.get('/', async function (req, res, next) {
  try {
    const users = await User.getAll();
    return res.json({ users });
  } catch (e) {
    return next(e);
  }
});

router.get('/:username', async function (req, res, next) {
  const user = await User.get(req.params.username);
  if (user) {
    return res.json({ user });
  } else {
    const notFound = new NotFoundError(`User ${req.params.username} not found.`);
    next(notFound);
  }
})

router.post('/register', async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, newUserSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new Error(errs);
    }
    const { username, password, email, profileImgUrl} = req.body;
    // Register user and receive JWT with username and admin status
    const token = await User.register(username, password, email, profileImgUrl);
    return res.status(201).json({ token });
  } catch (e) {
    // Make passed error into a Bad Request Error
    const badRequestError = new BadRequestError(e.message);
    return next(badRequestError);
  }
});

router.post('/create', async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, newUserSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new Error(errs);
    }
    const { username, password, email, profileImgUrl, admin=false} = req.body;
    const newUser = await User.create(username, password, email, profileImgUrl, admin);
    return res.status(201).json({ newUser });
  } catch (e) {
    // Make passed error into a Bad Request Error
    const badRequestError = new BadRequestError(e.message);
    return next(badRequestError);
  }
});

router.patch('/:username', async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    if (!user) {
      throw new NotFoundError(`User ${req.params.username} not found.`);
    }
    const validator = jsonschema.validate(req.body, updateUserSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new Error(errs);
    }
    user.email = req.body.email || user.email;
    user.profileImgUrl = req.body.profileImgUrl || user.profileImgUrl;
    const message = await user.save();
    return res.json({message, user});
  } catch (e) {
    // If error is NotFoundError, pass as is
    if (e instanceof NotFoundError) return next(e);
    // If error not 404, make error into a Bad Request Error
    const badRequestError = new BadRequestError(e.message);
    return next(badRequestError);
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