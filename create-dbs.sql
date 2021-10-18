DROP DATABASE music_club;
CREATE DATABASE music_club;
\connect music_club
\i create-tables.sql


DROP DATABASE music_club_test;
CREATE DATABASE music_club_test;
\connect music_club_test
\i create-tables.sql