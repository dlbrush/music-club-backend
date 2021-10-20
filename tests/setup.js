const db = require('../db');
const User = require('../models/User');
const Club = require('../models/Club');
const UserClub = require('../models/UserClub');

async function seedDb() {
  const result = await db.query(`
    INSERT INTO users (username, email, password, admin, profile_img_url)
    VALUES ('test1', 'test1@test.com', 'test1', TRUE, 'http://test.com/1.jpg'), ('test2', 'test2@test.com', 'test2', FALSE, 'http://test.com/2.jpg')
    RETURNING username, email, password, admin, profile_img_url AS "profileImgUrl"
  `);
  const user1Data = result.rows[0];
  const user2Data = result.rows[1];
  const user1 = new User(user1Data.username, user1Data.email, user1Data.profileImgUrl, user1Data.admin);
  const user2 = new User(user2Data.username, user2Data.email, user2Data.profileImgUrl, user2Data.admin);
  
  const clubResult = await db.query(`
    INSERT INTO clubs (name, description, founded, founder, is_public, banner_img_url)
    VALUES ('testClub1', 'testing club 1', current_date, 'test1', TRUE, 'http://test.com/1.jpg'), ('testClub2', 'testing club 2', current_date, 'test2', FALSE, 'http://test.com/2.jpg')
    RETURNING id, name, description, founded, founder, is_public AS "isPublic", banner_img_url AS "bannerImgUrl"
  `);
  const club1Data = clubResult.rows[0];
  const club2Data = clubResult.rows[1];
  const club1 = new Club(club1Data.id, club1Data.name, club1Data.description, club1Data.founder, club1Data.isPublic, club1Data.founded, club1Data.bannerImgUrl);
  const club2 = new Club(club2Data.id, club2Data.name, club2Data.description, club2Data.founder, club2Data.isPublic, club2Data.founded, club2Data.bannerImgUrl);

  // Associate users with the clubs they founded
  const userClubResult = await db.query(`
    INSERT INTO users_clubs (username, club_id)
    VALUES ('test1', $1), ('test2', $2)
  `, [club1.id, club2.id]);
  
  return {
    club1,
    club2,
    user1,
    user2,
  }
}

async function createTestObjects() {
  const user1 = await User.create('test1', 'test1', 'test1@test.com', 'http://test.com/1.jpg', true)
  const user2 = await User.create('test2', 'test2', 'test2@test.com', 'http://test.com/2.jpg', false);
  const club1 = await Club.create('testClub1', 'testing club 1', 'test1', true, 'http://test.com/1.jpg');
  const club2 = await Club.create('testClub2', 'testing club 2', 'test2', false, 'http://test.com/2.jpg');
  const userClub1 = await UserClub.create('test1', club1.id);
  const userClub2 = await UserClub.create('test2', club2.id);
  return {
    user1,
    user2,
    club1,
    club2,
    userClub1,
    userClub2
  }
}

async function clearDb() {
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM clubs');
  await db.query('DELETE FROM users_clubs');
}

module.exports = {
  seedDb,
  createTestObjects,
  clearDb
}