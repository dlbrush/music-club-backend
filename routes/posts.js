const express = require('express');

const { NotFoundError, BadRequestError, UnauthorizedError } = require('../helpers/errors');
const Post = require('../models/Post');
const MembershipService = require('../services/MembershipService');
const VoteService = require('../services/VoteService');
const { validateRequest } = require('../helpers/validation');
const { ensureLoggedIn } = require('../middleware/auth');
const updatePostSchema = require('../schemas/updatePost.json');

const router = new express.Router();

// No post route needed here (for now) because posts are made to a club in club route. Maybe an admin route in the future

router.get('/', async function(req, res, next) {
  try {
    const clubId = req.query['clubId'];
    const posts = await Post.getAll(clubId);
    res.json({ posts });
  } catch (e) {
    next(e);
  }
});

router.get('/:postId', async function(req, res, next) {
  try {
    const postId = parseInt(req.params.postId);
    if (!Number.isInteger(postId)) {
      throw new BadRequestError('Post ID must be an integer.')
    }
    const post = await Post.get(postId);
    if (!post) {
      throw new NotFoundError(`Post with ID ${postId} not found.`);
    }
    res.json({ post });
  } catch (e) {
    next(e);
  }
});

// Create a vote on a post or update an existing vote. Type parameter can be 'up' or 'down'.
router.post('/:postId/vote/:type', ensureLoggedIn, async function(req, res, next) {
  try {
    // First check that post ID is valid
    const postId = parseInt(req.params.postId);
    if (!Number.isInteger(postId)) {
      throw new BadRequestError('Post ID must be an integer.')
    }
    const post = await Post.get(postId);
    if (!post) {
      throw new NotFoundError(`Post with ID ${postId} not found.`);
    }

    // Then check that type parameter is up or down
    const type = req.params.type.toLowerCase();
    let liked;
    if (type === 'up') {
      liked = true
    } else if (type === 'down') {
      liked = false
    } else {
      throw new BadRequestError('Vote type must be up or down (case insensitive).')
    }

    // Check that requesting user is in club where post was made
    const isMember = await MembershipService.checkMembership(req.user.username, post.clubId);
    if (!isMember) {
      throw new UnauthorizedError(`Sorry, you must be a member of club with ID ${post.clubId} to vote on post ${postId}`);
    }

    // Finally, send upvote
    const message = await VoteService.handleVote(postId, req.user.username, liked);

    res.json({ message });
  } catch (e) {
    next(e);
  }
});

router.patch('/:postId', async function(req, res, next) {
  try {
    const postId = parseInt(req.params.postId);
    if (!Number.isInteger(postId)) {
      throw new BadRequestError('Post ID must be an integer.')
    }
    const post = await Post.get(postId);
    if (!post) {
      throw new NotFoundError(`Post with ID ${postId} not found.`);
    }

    validateRequest(req.body, updatePostSchema);

    if (req.body.recTracks) post.recTracks = req.body.recTracks;
    if (req.body.content) post.content = req.body.content;
    const message = await post.save();
    res.json({ message, post });
  } catch (e) {
    next(e);
  }
});

router.delete('/:postId', async function(req, res, next) {
  try {
    const postId = parseInt(req.params.postId);
    if (!Number.isInteger(postId)) {
      throw new BadRequestError('Post ID must be an integer.')
    }
    const post = await Post.get(postId);
    if (!post) {
      throw new NotFoundError(`Post with ID ${postId} not found.`);
    }

    const message = await post.delete();
    res.json({ message });
  } catch (e) {
    next(e)
  }
});

module.exports = router;