const express = require('express');

const { ensureAdminOrCommenter, ensureLoggedIn } = require('../middleware/auth');

const router = new express.Router();

/**
 * Update a comment in the database
 * Expects body { comment }
 * User must be admin or the comment-poster to access this route.
 */
router.patch('/:commentId', ensureLoggedIn, ensureAdminOrCommenter, async function(req, res, next) {
  try {
    // Set comment to passed body value if it exists, and save
    req.comment.comment = req.body.comment || req.comment.comment;
    await req.comment.save();

    res.json({ comment: req.comment });
  } catch(e) {
    next(e);
  }
});

/**
 * Delete a comment from the database
 * User must be admin or the comment-poster to access this route.
 */
router.delete('/:commentId', ensureLoggedIn, ensureAdminOrCommenter, async function(req, res, next) {
  try {
    const message = await req.comment.delete();

    res.json({ message });
  } catch(e) {
    next(e);
  }
});

module.exports = router;