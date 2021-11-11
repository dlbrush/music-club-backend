async function checkPost(req, res, next) {
  try {
    const postId = parseInt(req.params.postId);
    if (!Number.isInteger(postId)) {
      throw new BadRequestError('Post ID must be an integer.')
    }
    const post = await Post.get(postId);
    if (!post) {
      throw new NotFoundError(`Post with ID ${postId} not found.`);
    }
    
    // Attach post to req and continue
    req.post = post;
    next();
  } catch(e) {
    next(e);
  }
}

module.exports = {
  checkPost
}