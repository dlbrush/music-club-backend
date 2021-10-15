const express = require('express');

const app = require('../app');
const { BadRequestError } = require('../helpers/errors');
const User = require('../models/User');

const router = new express.Router();

router.post('/', async function(req, res, next) {
  try {
    const { name, description, founder, bannerImgUrl } = req.body;

    // Check that the username passed as founder corresponds to a real user
    const founderUser = User.get(founder);
    if (!founderUser) {
      throw new Error(`Founder username ${founder} does not match an existing user.`);
    }

    const newClub = await Club.create(name, description, founderUser, bannerImgUrl);

    return res.json({ newClub });
  } catch(e) {
    const badRequest = new BadRequestError(e.message);
    return next(badRequest);
  }

})

module.exports = router;