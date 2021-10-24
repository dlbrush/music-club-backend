const { request } = require('express');
const jwt = require('jsonwebtoken');

const { SECRET_KEY } = require('../config');
const { UnauthenticatedError, UnauthorizedError } = require('../helpers/errors');

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

module.exports = {
  authenticateToken,
  ensureAdmin,
  ensureLoggedIn,
  ensureAdminOrSameUser
}