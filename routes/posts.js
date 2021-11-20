const express = require('express');

const { NotFoundError, BadRequestError, UnauthorizedError } = require('../helpers/errors');
const Post = require('../models/Post');
const Club = require('../models/Club');
const Album = require('../models/Album');
const AlbumGenre = require('../models/AlbumGenre');
const User = require('../models/User');
const UserClub = require('../models/UserClub');
const Comment = require('../models/Comment');
const MembershipService = require('../services/MembershipService');
const VoteService = require('../services/VoteService');
const { validateRequest } = require('../helpers/validation');
const { ensureLoggedIn, ensureAdminOrValidClub, ensureAdminOrSameUser, ensureAdminOrPoster, ensureAdmin } = require('../middleware/auth');
const { checkPost } = require('../middleware/posts');
const updatePostSchema = require('../schemas/updatePost.json');

const router = new express.Router();

// No post route needed here (for now) because posts are made to a club in club route. Maybe an admin route in the future

/**
 * Get all posts, or just posts for a given club
 * Only admin can view all posts, but a user in a club can view all posts to that club
 * Expects query string clubId to get posts in a given club
 */
router.get('/', ensureLoggedIn, ensureAdminOrValidClub('query', 'clubId', {allowPublic: true, adminSkipValidation: true}), async function(req, res, next) {
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

/**
 * Get details for a single post.
 * User must be admin or a member of the club where the post was made.
 * Posts in public clubs are accessible by any user.
 * Adds comment and album data for the post from the database.
 */
router.get('/:postId', ensureLoggedIn, checkPost, ensureAdminOrValidClub('post', 'clubId', {allowPublic: true}), async function(req, res, next) {
  try {
    // Add comments, and add user data for each comment
    const post = req.post
    const comments = await Comment.getAll(post.id);
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
 * Deliver posts for all clubs the given user is a part of
 * User must be admin or the user with the username in the route
 */
router.get('/recent/:username', ensureLoggedIn, ensureAdminOrSameUser, async function(req, res, next) {
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

    // Get club name for each post
    const clubs = await Club.getSome(userClubIds);
    const clubNameMap = {};
    clubs.forEach(club => clubNameMap[club.id] = club.name);
    posts.forEach(post => post.clubName = clubNameMap[post.clubId]);
    
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

// NOT CURRENTLY IN USE
// Create a vote on a post or update an existing vote. Type parameter can be 'up' or 'down'.
router.post('/:postId/vote/:type', ensureAdmin, async function(req, res, next) {
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
    // Check is not currently relevant if user is admin
    // const isMember = await MembershipService.checkMembership(req.user.username, post.clubId);
    // if (!isMember) {
    //   throw new UnauthorizedError(`Sorry, you must be a member of club with ID ${post.clubId} to vote on post ${postId}`);
    // }

    // Finally, send upvote
    const message = await VoteService.handleVote(postId, req.user.username, liked);

    res.json({ message });
  } catch (e) {
    next(e);
  }
});

/**
 * Add a comment for a given post.
 * The comment will be associated with the user accessing the route.
 * User info is attached to the comment so that the user's username and profile image will appear with the comment on the front end.
 * Expects body { comment }
 * User must be admin or member of the club where the post was made
 */
router.post('/:postId/new-comment', ensureLoggedIn, checkPost, ensureAdminOrValidClub('post', 'clubId', {}), async function(req, res, next) {
  try {
    // Make new comment
    const newComment = await Comment.create(req.user.username, req.body.comment, req.post.id);

    // Get user info and attach it to comment
    const { username, profileImgUrl } = await User.get(req.user.username);

    newComment.user = { username, profileImgUrl };

    res.status(201).json({ newComment });
  } catch (e) {
    next(e);
  }
});

/**
 * Update post data.
 * User must be admin or the user who created the post in order to access this route.
 * Expects body { content, recTracks }
 * Both properties are optional, and any property not passed will not be updated.
 */
router.patch('/:postId', ensureLoggedIn, ensureAdminOrPoster, async function(req, res, next) {
  try {
    const post = req.post;
    validateRequest(req.body, updatePostSchema);

    if (req.body.recTracks) post.recTracks = req.body.recTracks;
    if (req.body.content) post.content = req.body.content;
    const message = await post.save();
    res.json({ message, post });
  } catch (e) {
    next(e);
  }
});

/**
 * Delete a post.
 * User must be admin or the creator of a post in order to access this route.
 */
router.delete('/:postId', ensureLoggedIn, ensureAdminOrPoster, async function(req, res, next) {
  try {
    const message = await req.post.delete();
    res.json({ message });
  } catch (e) {
    next(e)
  }
});

module.exports = router;