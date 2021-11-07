const express = require('express');
const { NotFoundError } = require('../helpers/errors');

const Comment = require('../models/Comment');

const router = new express.Router();

router.patch('/:commentId', async function(req, res, next) {
  try {
    // Validate that commentId is an int
    const commentId = parseInt(req.params.commentId);
    if (!commentId) {
      throw new BadRequestError('Comment ID must be an integer.')
    }

    // Confirm this comment exists
    const comment = await Comment.get(commentId);
    if (!comment) {
      throw new NotFoundError(`No comment found with the ID ${comment.id}.`);
    }

    // Set comment to passed body value and save
    comment.comment = req.body.comment;
    await comment.save();

    res.json({ comment });
  } catch(e) {
    next(e);
  }
});

router.delete('/:commentId', async function(req, res, next) {
  try {
    // Validate that commentId is an int
    const commentId = parseInt(req.params.commentId);
    if (!commentId) {
      throw new BadRequestError('Comment ID must be an integer.')
    }

    // Confirm this comment exists
    const comment = await Comment.get(commentId);
    if (!comment) {
      throw new NotFoundError(`No comment found with the ID ${comment.id}.`);
    }

    const message = await comment.delete();

    res.json({ message });
  } catch(e) {
    next(e);
  }
});

module.exports = router;