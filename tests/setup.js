const db = require('../db');
const User = require('../models/User');
const Club = require('../models/Club');
const Comment = require('../models/Comment');
const UserClub = require('../models/UserClub');
const Album = require('../models/Album');
const Post = require('../models/Post');
const Vote = require('../models/Vote');
const { generateUserToken } = require('../helpers/auth');
const AlbumGenre = require('../models/AlbumGenre');
const Invitation = require('../models/Invitation');

// Generate cookie strings for authorized requests
const adminTokenCookie = `token=${generateUserToken('test1', true)}`;
const user2TokenCookie = `token=${generateUserToken('test2', false)}`;
const user3TokenCookie = `token=${generateUserToken('test3', false)}`

async function seedDb() {
  const result = await db.query(`
    INSERT INTO users (username, email, password, admin, profile_img_url)
    VALUES ('test1', 'test1@test.com', 'test1', TRUE, 'http://test.com/1.jpg'), ('test2', 'test2@test.com', 'test2', FALSE, 'http://test.com/2.jpg')
    RETURNING username, email, password, admin, profile_img_url AS "profileImgUrl"
  `);
  const user1Data = result.rows[0];
  const user2Data = result.rows[1];
  const user1 = new User(user1Data.username, user1Data.profileImgUrl, user1Data.email, user1Data.admin);
  const user2 = new User(user2Data.username, user2Data.profileImgUrl, user2Data.email, user2Data.admin);
  
  const clubResult = await db.query(`
    INSERT INTO clubs (name, description, founded, founder, is_public, banner_img_url)
    VALUES ('testClub1', 'testing club 1', current_date, 'test1', TRUE, 'http://test.com/1.jpg'), ('testClub2', 'testing club 2', current_date, 'test2', FALSE, 'http://test.com/2.jpg')
    RETURNING id, name, description, founded, founder, is_public AS "isPublic", banner_img_url AS "bannerImgUrl"
  `);
  const club1Data = clubResult.rows[0];
  const club2Data = clubResult.rows[1];
  const club1 = new Club(club1Data.id, club1Data.name, club1Data.description, club1Data.founder, club1Data.isPublic, club1Data.bannerImgUrl, club1Data.founded);
  const club2 = new Club(club2Data.id, club2Data.name, club2Data.description, club2Data.founder, club2Data.isPublic, club2Data.bannerImgUrl, club2Data.founded);

  // Associate users with the clubs they founded
  const userClubResult = await db.query(`
    INSERT INTO users_clubs (username, club_id)
    VALUES ('test1', $1), ('test2', $2)
    RETURNING username, club_id AS "clubId"
  `, [club1.id, club2.id]);
  const userClub1Data = userClubResult.rows[0];
  const userClub2Data = userClubResult.rows[1];
  const userClub1 = new UserClub(userClub1Data.username, userClub1Data.clubId);
  const userClub2 = new UserClub(userClub2Data.username, userClub2Data.clubId);

  const albumResult = await db.query(`
  INSERT INTO albums (discogs_id, year, artist, title, cover_img_url)
  VALUES (33170, 1994, 'Green Day', 'Dookie', 'https://img.discogs.com/_aD_ZCgjICJ9ilW_hdav_yk1tSo=/fit-in/600x600/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-2103788-1507814667-9558.jpeg.jpg'), (59536, 1985, 'Eagles', 'Best of Eagles', 'https://img.discogs.com/xpaKEZDatE2MSOxnqm7jSo4-KkU=/fit-in/481x480/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-1662123-1247939788.jpeg.jpg')
  RETURNING discogs_id AS "discogsId", year, artist, title, cover_img_url AS "coverImgUrl"`);
  const album1Data = albumResult.rows[0];
  const album1 = new Album(album1Data.discogsId, album1Data.year, album1Data.artist, album1Data.title, album1Data.coverImgUrl);
  const album2Data = albumResult.rows[1];
  const album2 = new Album(album2Data.discogsId, album2Data.year, album2Data.artist, album2Data.title, album2Data.coverImgUrl);

  const albumGenreResult = await db.query(`
    INSERT INTO albums_genres (discogs_id, genre)
    VALUES ($1, 'Rock'), ($1, 'Pop')
    RETURNING discogs_id AS "discogsId", genre
  `, [album1.discogsId]);
  const albumGenre1Data = albumGenreResult.rows[0];
  const albumGenre2Data = albumGenreResult.rows[1];
  const albumGenre1 = new AlbumGenre(albumGenre1Data.discogsId, albumGenre1Data.genre);
  const albumGenre2 = new AlbumGenre(albumGenre2Data.discogsId, albumGenre2Data.genre);

  const postResult = await db.query(`
    INSERT INTO posts (club_id, content, discogs_id, posted_by, posted_at, rec_tracks)
    VALUES ($1, 'Check this out', $2, $3, current_timestamp, 'Test track'), ($4, 'Check this out', $5, $6, current_timestamp, 'Test track')
    RETURNING id, club_id AS "clubId", content, discogs_id AS "discogsId", posted_at AS "postedAt", posted_by AS "postedBy", rec_tracks AS "recTracks"
  `, [club1.id, album1.discogsId, user1.username, club2.id, album1.discogsId, user2.username]);
  const post1Data = postResult.rows[0];
  const post2Data = postResult.rows[1];
  const post1 = new Post(post1Data.id, post1Data.clubId, post1Data.discogsId, new Date(post1Data.postedAt), post1Data.postedBy, post1Data.content, post1Data.recTracks);
  const post2 = new Post(post2Data.id, post2Data.clubId, post2Data.discogsId, new Date(post2Data.postedAt), post2Data.postedBy, post2Data.content, post2Data.recTracks);

  const commentResult = await db.query(`
    INSERT INTO comments (post_id, username, comment, posted_at)
    VALUES ($1, $2, 'comment', current_timestamp), ($3, $4, 'comment 2', current_timestamp)
    RETURNING id, post_id AS "postId", username, comment, posted_at AS "postedAt"
  `, [post1.id, user1.username, post2.id, user2.username]);
  const comment1Data = commentResult.rows[0];
  const comment2Data = commentResult.rows[1];
  const comment1 = new Comment(comment1Data.id, comment1Data.username, comment1Data.comment, comment1Data.postId, new Date(comment1Data.postedAt));
  const comment2 = new Comment(comment2Data.id, comment2Data.username, comment2Data.comment, comment2Data.postId, new Date(comment2Data.postedAt));

  const invitationResult = await db.query(`
    INSERT INTO invitations (club_id, username, sent_from)
    VALUES ($1, $2, $3), ($4, $3, $2)
    RETURNING club_id AS "clubId", username, sent_from AS "sentFrom"
  `, [club1.id, user2.username, user1.username, club2.id]);
  const invitation1Data = invitationResult.rows[0];
  const invitation2Data = invitationResult.rows[1];
  const invitation1 = new Invitation(invitation1Data.clubId, invitation1Data.username, invitation1Data.sentFrom);
  const invitation2 = new Invitation(invitation2Data.clubId, invitation2Data.username, invitation2Data.sentFrom);
  
  return {
    club1,
    club2,
    user1,
    user2,
    userClub1,
    userClub2,
    album1,
    album2,
    albumGenre1,
    albumGenre2,
    post1,
    post2,
    comment1,
    comment2,
    invitation1,
    invitation2
  }
}

async function createTestObjects() {
  const user1 = await User.create('test1', 'test1', 'test1@test.com', 'http://test.com/1.jpg', true)
  const user2 = await User.create('test2', 'test2', 'test2@test.com', 'http://test.com/2.jpg', false);
  // User who is not a member of any club - used for testing club privacy
  const user3 = await User.create('test3', 'test3', 'test3@test.com');
  const club1 = await Club.create('testClub1', 'testing club 1', user1, true, 'http://test.com/1.jpg');
  const club2 = await Club.create('testClub2', 'testing club 2', user2, false, 'http://test.com/2.jpg');
  const userClub1 = await UserClub.create('test1', club1.id);
  const userClub2 = await UserClub.create('test2', club2.id);
  const album1 = await Album.create(33170, 1884, 'Green Day', 'Dookie', 'https://img.discogs.com/_aD_ZCgjICJ9ilW_hdav_yk1tSo=/fit-in/600x600/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-2103788-1507814667-9558.jpeg.jpg');
  const albumGenre1 = await AlbumGenre.create(album1.discogsId, 'Rock');
  const post1 = await Post.create(club1.id, album1.discogsId, user1.username, 'Test Track', 'Check this out');
  const post2 = await Post.create(club2.id, album1.discogsId, user2.username, 'Test Track', 'Check this out');
  const vote1 = await Vote.create(post2.id, user2.username, true);
  const comment1 = await Comment.create(user2.username, 'Comment', post2.id);
  const invitation1 = await Invitation.create(club1.id, user2.username, user1.username);
  const invitation2 = await Invitation.create(club2.id, user1.username, user2.username);
  return {
    user1,
    user2,
    user3,
    club1,
    club2,
    userClub1,
    userClub2,
    album1,
    post1,
    post2,
    vote1,
    comment1,
    invitation1,
    invitation2,
    albumGenre1
  }
}

async function clearDb() {
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM clubs');
  await db.query('DELETE FROM users_clubs');
  await db.query('DELETE FROM albums');
  await db.query('DELETE FROM posts');
  await db.query('DELETE FROM albums_genres');
  await db.query('DELETE FROM votes');
  await db.query('DELETE FROM invitations');
  await db.query('DELETE FROM comments');
}

module.exports = {
  seedDb,
  createTestObjects,
  clearDb,
  adminTokenCookie,
  user2TokenCookie,
  user3TokenCookie,
}