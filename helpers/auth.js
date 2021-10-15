const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config.js')

/**
 * Returns a JWT containing the user's username and admin status.
 * @param {User} user destructured into just the username and admin properties  
 */
function generateUserToken({username, admin}) {
  console.log(SECRET_KEY);
  return jwt.sign(
    {username, admin},
    SECRET_KEY
  )
}

module.exports = {
  generateUserToken
}