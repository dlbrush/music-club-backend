const express = require('express');

const { NotFoundError, BadRequestError, UnauthorizedError } = require('../helpers/errors');
const Post = require('../models/Post');
const Album = require('../models/Album');
const AlbumGenre = require('../models/AlbumGenre');
const User = require('../models/User');
const UserClub = require('../models/UserClub');
const Comment = require('../models/Comment');
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
    const albumIds = posts.map(post => post.discogsId);
    const albums = await Album.getSome(albumIds);
    const albumMap = {};
    for (const album of albums) {
      const { discogsId, year, artist, title, coverImgUrl } = album;
      albumMap[discogsId] = {year, artist, title, coverImgUrl};
    }
    for (const post of posts) {
      post.album = albumMap[post.discogsId];
    }
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

    // Add comments, and add user data for each comment
    const comments = await Comment.getAll(postId);
    const commentUserSet = new Set();
    comments.forEach(comment => commentUserSet.add(comment.username));
    const commentUsers = await User.getSome(Array.from(commentUserSet));
    const commentUserMap = {};
    commentUsers.forEach(user => {
      commentUserMap[user.username] = {
        profileImgUrl: user.profileImgUrl
      };
    });
    comments.forEach(comment => comment.user = commentUserMap[comment.username]);
    post.comments = comments;

    const album = await Album.get(post.discogsId);
    post.album = album;

    const albumGenres = await AlbumGenre.getForAlbum(album.discogsId);
    post.album.genres = albumGenres.map(albumGenre => albumGenre.genre);
    
    res.json({ post });
  } catch (e) {
    next(e);
  }
});

/**
 * Deliver recent posts for all clubs the given user is a part of
 */
router.get('/recent/:username', async function(req, res, next) {
  try {
    // Check that user exists
    const user = await User.get(req.params.username);
    if (!user) {
      throw new NotFoundError(`User ${req.params.username} not found.`);
    }

    // Get club IDs
    const userClubs = await UserClub.getAll(user.username);
    const userClubIds = userClubs.map(userClub => userClub.clubId);

    // Get posts for user's clubs
    const posts = await Post.getAllForClubs(userClubIds);
    
    // Get album data for posts
    const albumIds = posts.map(post => post.discogsId);
    const albums = await Album.getSome(albumIds);
    const albumMap = {};
    for (const album of albums) {
      const { discogsId, year, artist, title, coverImgUrl } = album;
      albumMap[discogsId] = {year, artist, title, coverImgUrl};
    }
    for (const post of posts) {
      post.album = albumMap[post.discogsId];
    }

    res.json({ posts });
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

router.post('/:postId/new-comment', ensureLoggedIn, async function(req, res, next) {
  try {
    // Ensure post exists
    const post = await Post.get(req.params.postId);
    if (!post) {
      throw new NotFoundError(`No post with id ${req.params.postId}`);
    }

    // Check that requesting user is in club where post was made
    const isMember = await MembershipService.checkMembership(req.user.username, post.clubId);
    if (!isMember) {
      throw new UnauthorizedError(`Sorry, you must be a member of club with ID ${post.clubId} to vote on post ${postId}`);
    }

    // Finally, make new comment
    const newComment = await Comment.create(req.user.username, req.body.comment, post.id);

    // Get user info and attach it to comment
    const { username, profileImgUrl } = await User.get(req.user.username);

    newComment.user = { username, profileImgUrl };

    res.status(201).json({ newComment });
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