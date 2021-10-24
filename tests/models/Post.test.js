const db = require('../../db');
const Post = require('../../models/Post');
const { seedDb, clearDb } = require('../setup.js');

describe('Post model', () => {
  // Declare test items
  let user1, club1, album1, post1, post2;

  beforeEach(async () => {
    const items = await seedDb();
    user1 = items.user1;
    club1 = items.club1;
    album1 = items.album1;
    post1 = items.post1;
    post2 = items.post2;
  });

  afterEach(async () => {
    await clearDb();
  });

  describe('#getAll', () => {
    it('Returns all posts with expected properties when no arguments passed', async () => {
      const posts = await Post.getAll();
      expect(posts.length).toEqual(2);
      expect(posts[0]).toEqual({
        id: post1.id,
        clubId: post1.clubId,
        discogsId: post1.discogsId,
        postedBy: post1.postedBy,
        postedAt: post1.postedAt,
        content: post1.content
      });
      expect(posts[1]).toEqual({
        id: post2.id,
        clubId: post2.clubId,
        discogsId: post2.discogsId,
        postedBy: post2.postedBy,
        postedAt: post2.postedAt,
        content: post2.content
      });
    });

    it('Returns only posts made in passed club ID', async () => {
      const posts = await Post.getAll(club1.id);
      expect(posts.length).toEqual(1);
      expect(posts[0]).toEqual({
        id: post1.id,
        clubId: post1.clubId,
        discogsId: post1.discogsId,
        postedBy: post1.postedBy,
        postedAt: post1.postedAt,
        content: post1.content
      });
    });

    it('Returns empty array if no matches to filters', async () => {
      const posts = await Post.getAll(9999);
      expect(posts).toEqual([]);
    });
  });

  describe('#get', () => {
    it('Returns post matching passed id', async () => {
      const post = await Post.get(post1.id);
      expect(post).toEqual({
        id: post1.id,
        clubId: post1.clubId,
        discogsId: post1.discogsId,
        postedBy: post1.postedBy,
        postedAt: post1.postedAt,
        content: post1.content,
        recTracks: post1.recTracks
      });
    });

    it('Returns undefined if no post with that ID', async () => {
      const post = await Post.get(9999);
      expect(post).toEqual(undefined);
    });
  });

  describe('#create', () => {
    it('Returns post with all passed attributes', async () => {
      const post = await Post.create(club1.id, album1.discogsId, user1.username, 'All of them', 'This is great');
      expect(post).toEqual({
        id: expect.any(Number),
        clubId: club1.id,
        discogsId: album1.discogsId,
        postedAt: expect.any(Date),
        postedBy: user1.username,
        content: 'This is great',
        recTracks: 'All of them'
      });
    });

    it('Adds post to database', async () => {
      const post = await Post.create(club1.id, album1.discogsId, user1.username, 'All of them', 'This is great');
      const dbPost = await Post.get(post.id);
      expect(dbPost).toEqual({
        id: post.id,
        clubId: post.clubId,
        discogsId: post.discogsId,
        postedAt: post.postedAt,
        postedBy: post.postedBy,
        content: post.content,
        recTracks: post.recTracks
      });
    });

    it('Returns empty strings for content and recTracks if not passed', async () => {
      const post = await Post.create(club1.id, album1.discogsId, user1.username);
      expect(post).toEqual({
        id: expect.any(Number),
        clubId: club1.id,
        discogsId: album1.discogsId,
        postedAt: expect.any(Date),
        postedBy: user1.username,
        content: '',
        recTracks: ''
      });
    });
  });

  describe('#delete', () => {
    it('Returns success message on success', async () => {
      const msg = await post1.delete();
      expect(msg).toEqual(`Deleted post ${post1.id}.`);
    });

    it('Removes user from DB', async () => {
      await post1.delete();
      const post = await Post.get(post1.id);
      expect(post).toEqual(undefined);
    });

    it('Throws error if post object does not match post in DB', async () => {
      try {
        const badPost = new Post(9999);
        await badPost.delete();
      } catch(e) {
        expect(e.message).toEqual(`Unable to delete post 9999.`);
      }
    });
  });

  describe('#save', () => {
    it('Returns success message on success', async () => {
      const msg = await post1.save();
      expect(msg).toEqual(`Updated post ${post1.id}.`);
    });

    it('Updates post in DB when changes are made', async () => {
      post1.content = 'This one actually is bad';
      post1.recTracks = 'None';
      await post1.save();
      const post = await Post.get(post1.id);
      expect(post).toEqual({
        id: post1.id,
        clubId: post1.clubId,
        discogsId: post1.discogsId,
        postedBy: post1.postedBy,
        postedAt: post1.postedAt,
        content: post1.content,
        recTracks: post1.recTracks
      });
    });

    it('Makes no changes otherwise', async () => {
      await post1.save();
      const post = await Post.get(post1.id);
      expect(post).toEqual({
        id: post1.id,
        clubId: post1.clubId,
        discogsId: post1.discogsId,
        postedBy: post1.postedBy,
        postedAt: post1.postedAt,
        content: post1.content,
        recTracks: post1.recTracks
      });
    });

    it('Throws error if post object does not match club in DB', async () => {
      try {
        const badPost = new Post(9999);
        await badPost.save();
      } catch(e) {
        expect(e.message).toEqual(`Unable to update post 9999.`);
      }
    });
  });

  afterAll(async () => {
    await db.end();
  })
})