// This seeds the production database by default - to seed the test database, uncomment the line below
// process.env.NODE_ENV = 'test';

const Album = require('./models/Album');
const AlbumGenre = require('./models/AlbumGenre');
const Club = require('./models/Club');
const Comment = require('./models/Comment');
const Post = require('./models/Post');
const User = require('./models/User');
const UserClub = require('./models/UserClub');

async function seedDB () {
  try {
    console.log('Seeding database...');
  
    const user1Data = await User.register('test1', 'test1', 'test1@test.com');
    const user2Data = await User.register('test2', 'test2', 'test2@test.com');
    const user1 = user1Data.newUser;
    const user2 = user2Data.newUser;
  
    const club1 = await Club.create('testClub1', 'testing club 1', user1, true);
    const club2 = await Club.create('testClub2', 'testing club 2', user2, false);
  
    // Make sure to make users members of their clubs
    const userClub1 = await UserClub.create('test1', club1.id);
    const userClub2 = await UserClub.create('test2', club2.id);
  
    // Add an album to the DB for a post
    const album = await Album.create(59536, 1985, 'Eagles', 'Best of Eagles', 'https://img.discogs.com/xpaKEZDatE2MSOxnqm7jSo4-KkU=/fit-in/481x480/filters:strip_icc():format(jpeg):mode_rgb():quality(90)/discogs-images/R-1662123-1247939788.jpeg.jpg');
  
    const albumGenre1 = await AlbumGenre.create(album.discogsId, 'Rock');
    const albumGenre2 = await AlbumGenre.create(album.discogsId, 'Pop');
  
    const post = await Post.create(club1.id, album.discogsId, user1.username, 'All of them!', 'Hey have you guys heard of this band?');
  
    const comment = await Comment.create(user1.username, 'Still love this one!', post.id);
  
    console.log('DB successfully seeded!');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

seedDB();