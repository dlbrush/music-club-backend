const express = require('express');
const User = require('../models/User');

const router = express.router();

router.post('/register', async function (req, res, next) {
  try {
    const { username, password, email, profileImgUrl, admin=0} = req.body;
    const newUser = await User.create(username, password, email, profileImgUrl, admin);
    return res.json(newUser);
  } catch (e) {
    return next(e);
  }
});

export default router;