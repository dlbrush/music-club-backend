const jwt = require('jsonwebtoken');

const { SECRET_KEY } = require('../config');
const { UnauthenticatedError, UnauthorizedError, NotFoundError, BadRequestError } = require('../helpers/errors');
const Club = require('../models/Club');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const MembershipService = require('../services/MembershipService');

function authenticateToken(req, res, next) {
  try {
    const { token } = req.cookies;
    if (!token) {
      return next();
    }
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (error) {
    next(error);
  }
}

function ensureAdmin(req, res, next) {
  const { admin } = req.user;
  if (!admin) {
    throw new UnauthorizedError('Unauthorized: Must be admin to access this route');
  }
  next();
}

function ensureAdminOrSameUser(req, res, next) {
  const { admin, username } = req.user;
  if (!admin && username !== req.params.username) {
    throw new UnauthorizedError('Unauthorized: Must be admin or the user in the request parameter to access this route');
  }
  next();
}

function ensureLoggedIn(req, res, next) {
  const { user } = req;
  if (!user) {
    throw new UnauthenticatedError('Must be logged in to access this route');
  }
  next();
}

// Checks if the user can view the club being requested. 
// Pass in locations of club ID property based on strings for the name of the object attached to the req object (params, body, etc) and property of that object that contains the club ID
// Ensure that the user is requesting a public club or a club they're a member of
// If so, attach club to request while we're at it
// Options: allowPublic, founderOnly, adminSkipValidation
function ensureAdminOrValidClub(objectName, property, options) {
  return async function(req, res, next) {
    try {
      const { admin, username } = req.user;
      // Skip all other validation if admin should see route regardless
      if (admin && options['adminSkipValidation']) {
        return next();
      }

      const clubId = parseInt(req[objectName][property]);
      if (!Number.isInteger(clubId)) {
        throw new BadRequestError('Club ID must be an integer.')
      }
      const club = await Club.get(clubId);
      if (!club) {
        throw new NotFoundError(`Club with ID ${clubId} not found.`);
      }
      req.club = club;

      // Check if this action is valid for any public club
      const isPublic = options['allowPublic'] === true && club.isPublic === true;

      // Check if the user is a founder or member
      let validRole = false;
      if (options['founderOnly'] === true) {
        validRole = club.founder === username;
      } else {
        validRole = await MembershipService.checkMembership(username, clubId);
      }
      if (!admin && !validRole && !isPublic) {
        throw new UnauthorizedError(`Unauthorized: This route requires admin permissions${options['allowPublic'] ? ', a public club,' : ''} or ${options['founderOnly'] ? 'the club founder' : 'club membership'}.`);
      }
      next();
    } catch(e) {
      next(e);
    }
  }
}

async function ensureAdminOrCommenter(req, res, next) {
  try {
    const { admin, username } = req.user;

    // Validate that commentId is an int
    const commentId = parseInt(req.params.commentId);
    if (!commentId) {
      throw new BadRequestError('Comment ID must be an integer.')
    }

    // Confirm this comment exists
    const comment = await Comment.get(commentId);
    if (!comment) {
      throw new NotFoundError(`No comment found with the ID ${commentId}.`);
    }

    // Check if user is commenter
    if (!admin && username !== comment.username) {
      throw new UnauthorizedError('Unauthorized: Must be admin or the user who made this comment to access this route.');
    }
    
    // Attach comment to req and continue
    req.comment = comment;
    next();
  } catch(e) {
    next(e);
  }
}

async function ensureAdminOrPoster(req, res, next) {
  try {
    const { admin, username } = req.user;

    const postId = parseInt(req.params.postId);
    if (!Number.isInteger(postId)) {
      throw new BadRequestError('Post ID must be an integer.')
    }
    const post = await Post.get(postId);
    if (!post) {
      throw new NotFoundError(`Post with ID ${postId} not found.`);
    }

    // Check if user is poster
    if (!admin && username !== post.postedBy) {
      throw new UnauthorizedError('Unauthorized: Must be admin or the user who made this post to access this route.');
    }
    
    // Attach post to req and continue
    req.post = post;
    next();
  } catch(e) {
    next(e);
  }
}

module.exports = {
  authenticateToken,
  ensureAdmin,
  ensureLoggedIn,
  ensureAdminOrSameUser,
  ensureAdminOrValidClub,
  ensureAdminOrCommenter,
  ensureAdminOrPoster
}