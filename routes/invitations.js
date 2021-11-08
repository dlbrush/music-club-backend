const express = require('express');

const Club = require('../models/Club');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const MembershipService = require('../services/MembershipService');
const { NotFoundError, UnauthorizedError, BadRequestError } = require('../helpers/errors');
const { ensureLoggedIn } = require('../middleware/auth');

const router = new express.Router();

router.post('/', ensureLoggedIn, async function(req, res, next) {
  try {
    // Expecting body of clubId, username
    // Check that club exists
    const club = await Club.get(req.body.clubId);
    if (!club) {
      throw new NotFoundError(`No club found with ID ${req.body.clubId}`);
    }

    // Check that inviting user is member of club
    const userIsMember = await MembershipService.checkMembership(req.user.username, club.id);
    if (!userIsMember) {
      throw new UnauthorizedError('Unauthorized: unable to send invitation to club you are not a member of.');
    }

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