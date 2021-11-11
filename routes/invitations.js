const express = require('express');

const Club = require('../models/Club');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const MembershipService = require('../services/MembershipService');
const { NotFoundError, UnauthorizedError, BadRequestError } = require('../helpers/errors');
const { ensureLoggedIn, ensureAdminOrValidClub } = require('../middleware/auth');

const router = new express.Router();

router.post('/', ensureLoggedIn, ensureAdminOrValidClub('body', 'clubId', {}), async function(req, res, next) {
  try {
    const club = req.club;
    
    // Check that invited user exists
    const invitedUser = await User.get(req.body.username);
    if (!invitedUser) {
      throw new NotFoundError(`User with username ${req.body.username} not found.`);
    }

    // Check that invited user is not already part of the club
    const invitedUserIsMember = await MembershipService.checkMembership(invitedUser.username, club.id);
    if (invitedUserIsMember) {
      throw new BadRequestError(`User ${invitedUser.username} is already a member of club ${club.id}`);
    }

    // Check that invited user is not already invited to the club
    const existingInvite = await Invitation.getAll(invitedUser.username, club.id);
    if (existingInvite.length > 0) {
      throw new BadRequestError(`User ${invitedUser.username} already invited to ${club.id}`);
    }

    // If all checks pass, create new invitation and return it as JSON
    const invitation = await Invitation.create(club.id, invitedUser.username, req.user.username);

    res.status(201).json({ invitation });
  } catch(e) {
    next(e);
  }
});

module.exports = router;