const express = require('express');

const { BadRequestError, NotFoundError } = require('../helpers/errors');
const User = require('../models/User');
const UserClub = require('../models/UserClub');
const Club = require('../models/Club');
const Invitation = require('../models/Invitation');
const MembershipService = require('../services/MembershipService');
const { validateRequest } = require('../helpers/validation');
const { ensureAdmin, ensureLoggedIn, ensureAdminOrSameUser } = require('../middleware/auth');
const newUserSchema = require('../schemas/newUser.json');
const updateUserSchema = require('../schemas/updateUser.json');

const router = new express.Router();

/**
 * Get a list of all users.
 * Optionally pass query string "username" in order to return all users who have usernames matching the passed string.
 */
router.get('/', ensureLoggedIn, async function (req, res, next) {
  try {
    const users = await User.getAll(req.query['username']);
    return res.json({ users });
  } catch (e) {
    return next(e);
  }
});

/**
 * Get details on a user.
 * User accessing this route must be admin or the user specified in the route.
 * Attaches all clubs the user is a part of and all invitations the user has received. This is done for ease of access from the front end.
 */
router.get('/:username', ensureLoggedIn, ensureAdminOrSameUser, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    if (!user) {
      throw new NotFoundError(`User ${req.params.username} not found.`);
    }

    // Get IDs of clubs the user is in and invited to
    const userClubs = await UserClub.getAll(user.username);
    const userClubIds = userClubs.map(userClub => userClub.clubId);
    const userInvitations = await Invitation.getAll(user.username);
    const invitationClubIds = userInvitations.map(invitation => invitation.clubId);

    // Get club data and put in a map
    const clubs = await Club.getSome(userClubIds.concat(invitationClubIds));
    const clubIdMap = new Map();
    for (let club of clubs) {
      clubIdMap.set(club.id, club);
    }

    // Map club data for user club and invitations
    user.clubs = userClubIds.map(id => clubIdMap.get(id));
    for (const invitation of userInvitations) {
      invitation.club = clubIdMap.get(invitation.clubId);
    }

    user.invitations = userInvitations;

    return res.json({ user });
  } catch (e) {
    return next(e)
  }
});

/**
 * Create a new user.
 * This route is only accessible by an admin user, as it is the only way to create other admin users.
 * Expects body { username, password, email, admin }
 * Optionally pass profileImgUrl property to set the URL for the user's profile image. URL must be valid.
 */
router.post('/', ensureLoggedIn, ensureAdmin, async function (req, res, next) {
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
 * Allows the user to attempt to join a club
 * No body required but username and clubId in route must be valid.
 * User accessing this route must be admin or the user with the username in the route.
 * Deletes any invitations to the club that were sent to the user, as those invitations are now irrelevant.
 */
router.post('/:username/join-club/:clubId', ensureLoggedIn, ensureAdminOrSameUser, async function (req, res, next) {
  try {
    // First, make sure passed club ID is an integer
    const clubId = parseInt(req.params.clubId);
    if (!Number.isInteger(clubId)) {
      throw new BadRequestError('Club ID must be an integer.')
    }
    const { username } = req.params;
    // Then, attempt join
    const message = await MembershipService.join(username, clubId);

    // Assuming successful join, find and delete any invitation sent to this user
    const invitation = await Invitation.getAll(username, clubId);
    if (invitation.length > 0) {
      // There should only ever be one invitation matching both username and clubId
      await invitation[0].delete();
    }

    return res.status(201).json({ message });
  } catch (e) {
    next(e);
  }
});

/**
 * Update user data.
 * User must be admin or the user specified in the route in order to access this route.
 * Expects body { email, profileImgUrl }
 * Any property not passed will not be updated
 * No other properties are allowed to be passed.
 */
router.patch('/:username', ensureLoggedIn, ensureAdminOrSameUser, async function (req, res, next) {
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

/**
 * Delete the user specified in the route from the database.
 * Must be admin or the user in the route to access this.
 */
router.delete('/:username', ensureLoggedIn, ensureAdminOrSameUser, async function (req, res, next) {
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