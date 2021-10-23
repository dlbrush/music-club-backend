DELETE FROM users;
DELETE FROM clubs;
DELETE FROM users_clubs;

-- passwords are hash of username
INSERT INTO users (username, email, password, admin, profile_img_url)
VALUES ('test1', 'test1@test.com', '$2b$04$T3kw1oD3fFaP1FNyDin1M.kIRdJxhKwMjUbACB3g/H0f9fB3ukuG.', TRUE, 'http://test.com/1.jpg'), ('test2', 'test2@test.com', '$2b$04$PNjnQP5xXccLy4K5SbOxcOcad3ujVBzL5TzBawd08AAAccDOewRP2', FALSE, 'http://test.com/2.jpg');

INSERT INTO clubs (name, description, founded, founder, is_public, banner_img_url)
VALUES ('testClub1', 'testing club 1', current_date, 'test1', TRUE, 'http://test.com/1.jpg'), ('testClub2', 'testing club 2', current_date, 'test2', FALSE, 'http://test.com/2.jpg');

WITH inputvalues (username, club_name) AS (
  values
    ('test1', 'testClub1'),
    ('test2', 'testClub2')
)
INSERT INTO users_clubs (username, club_id)
SELECT d.username, c.id
FROM inputvalues d
JOIN clubs c
ON c.name = d.club_name;