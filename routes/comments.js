const express = require('express');

const { ensureAdminOrCommenter } = require('../middleware/auth');

const router = new express.Router();

router.patch('/:commentId', ensureAdminOrCommenter, async function(req, res, next) {
  try {
    // Set comment to passed body value and save
    req.comment.comment = req.body.comment;
    await req.comment.save();

    res.json({ comment: req.comment });
  } catch(e) {
    next(e);
  }
});

router.delete('/:commentId', ensureAdminOrCommenter, async function(req, res, next) {
  try {
    const message = await req.comment.delete();

    res.json({ message });
  } catch(e) {
    next(e);
  }
});

module.exports = router;