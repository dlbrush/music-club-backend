const Vote = require('../models/Vote');

class VoteService {
  static async handleVote(postId, username, liked) {
    // Check if user has already voted on this post
    const existingVote = await Vote.get(postId, username);
    if (existingVote) {
      // Just update existing vote if user has already voted on this post
      existingVote.liked = liked;
      return await existingVote.save();
    }
    const newVote = await Vote.create(postId, username, liked);
    const resultString = newVote.liked ? 'upvoted' : 'downvoted';
    return `User ${username} successfully ${resultString} post ${postId}`;
  }
}

module.exports = VoteService;