const express = require('express');
const User = require('../models/User');

const router = new express.Router();

router.get('/', async function (req, res, next) {
  try {
    const users = await User.getAll();
    return res.json({ users });
  } catch (e) {
    return next(e);
  }
});

router.post('/register', async function (req, res, next) {
  try {
    const { username, password, email, profileImgUrl, admin=0} = req.body;
    const newUser = await User.create(username, password, email, profileImgUrl, admin);
    console.log(newUser);
    return res.json({ newUser });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;