const express = require('express');

const { ensureAdminOrCommenter, ensureLoggedIn } = require('../middleware/auth');

const router = new express.Router();

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

router.delete('/:commentId', ensureLoggedIn, ensureAdminOrCommenter, async function(req, res, next) {
  try {
    const message = await req.comment.delete();

    res.json({ message });
  } catch(e) {
    next(e);
  }
});

module.exports = router;