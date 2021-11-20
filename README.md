# Music Club (Backend)

An Express backend for the Music Club app.

Frontend repo located here: [https://github.com/dlbrush/music-club-frontend](https://github.com/dlbrush/music-club-frontend)

## Summary

The Music Club app creates a network of users who post and discuss music in "clubs". A Music Club is intended to be like a book club - post an album for others to listen to, and post comments to discuss it afterwards. Users who sign up for the site can join clubs or start their own and invite their friends. Then, they can search for albums using the Discogs database, and share those albums with their thoughts in any club they're a member of.

The Music Club is intended to be a platform for sharing, discovering, and discussing music with other like-minded users.

## Starting the app locally

### Prerequisites

Make sure the following software is installed on your machine before trying to run the app. PostgresQL needs to be running for the app to start.

1. [PostgresQL](https://www.postgresql.org/)
2. [Node.js](https://nodejs.org/)

Also, make sure you have cloned both the [backend]() and [frontend]() repos.

### Configuring environment variables

**Backend**
1. Make a file called .env in the root directory of the backend repo.
2. There should be a file there called .env.example. Copy the contents of this into your .env file.
3. The SECRET_KEY var can be set to any string.
4. The FRONTEND_URI variable needs to be set to whatever URI your frontend will be running from. In the next section I'll recommend setting a port in a .env file in the frontend repo, but the easiest is to have the backend on 3000 and the frontend on 3001. If you don't plan on changing that you can leave it as-is.
5. The DISCOGS_USER_AGENT variable is used to identify the app to the Discogs server. You can use MusicClub as the name, but please specify this with some unique identifier for your version, as MusicClub should be reserved for the deployed app.
6. The trickiest one here is DISCOGS_ACCESS_TOKEN. This is used to authenticate the app's access to the Discogs API. The full OAuth flow for apps to acces Discogs requires each user to have a Discogs account, which is unnecessary for the purposes of this app. So this app uses a personal access token which is much easier to generate. Here's how you do it;
   1. Register for an account on [Discogs](discogs.com)
   2. Go to the [Developer Settings](https://www.discogs.com/settings/developers) page while logged in.
   3. At the bottom of the page, click "Generate new token".
   4. Paste this token into the field for DISCOGS_ACCESS_TOKEN in the .env file. Make sure to keep this a secret, since this token gives access to your personal Discogs account.

**Frontend**
1. Make a file called .env in the root directory of the frontend repo.
2. Because the frontend is built using Create-React-App, there's not much to configure. CRA natively accepts a PORT variable to set the port that the frontend server should run on locally. In my opinion it is easiest to set `PORT=3001` and call it a day, but configure whichever port you'd like here. As noted above, make sure to keep the frontend URI updated in your backend .env or communication between the two halves will break down.

### Running the app

1. Run the backend first so that the frontend can immediately access the API. From the command line in the backend repo root directory, run `npm start` to start the Express server. The server is configured to run on localhost port 3000. 
   - Nodemon is not installed natively for this app, but if you'd like to use nodemon to enable hot reloading (the backend restarts whenever you update a file), install nodemon globally in npm and run `nodemon` from the backend repo. Alternatively, you can run it via npx using `npx nodemon` - this will cache nodemon on your machine while you're using it but does not require a global install.
2. Run the frontend second. The frontend is built on Create-React-App and uses Webpack to load assets, so hot reloading is enabled by default. Run `npm start` from the command line in the root directory of the frontend repo to load the app - it should launch in your browser when loaded.

The backend can run on its own and be accessed via API endpoints using software like [Insomnia](https://insomnia.rest/). Make sure to use the `/auth/register` or `/auth/login` routes to authenticate access to the rest of the routes of the app.

## Database

The database is built on [PostgresQL](https://www.postgresql.org/), and accessed in the app through [node-postgres](https://www.npmjs.com/package/pg).

The frontend accesses the DB entirely by making API calls to the backend. All API calls are made by the API class defined by **api.js** in the frontend root directory.

### Seeding the DB

1. Start PostgresQL on your machine.
2. From this repo on the command line, first run `npm run create-dbs` to create the DB and the test DB.
3. Then run `npm run seed-db` to seed the database. This will give you a test user and a test club to explore.

Test user:
Username: 'test1'
Password: 'test1'

## API

This app uses the [Discogs API.](https://www.discogs.com/developers).

Discogs requires some level of authentication for using its API. Specifically, its search feature requires you to be logged in as an authenticated user. Since the search feature is key to finding albums to post in this app, this app uses personal access tokens generated by the developer to grant that access on the backend. This is not ideal for sure, but the alternative would be requiring each Music Club user to authenticate with Discogs through OAuth, but that felt unnecessary for the purposes of this app. These requests are all handled by the server in order to avoid making the personal access key public.

Discogs provides all of the album title, genre, artist, and cover image data used in the app. Because getting this data for each album every time we need it would result in a lot of requests from the server, this data is stored in the Music Club database whenever an album is posted for the first time in the app. This logic is handled by the backend in the `/clubs/:clubId/new-post` route.

Any request to the Discogs API is handled by the **DiscogsService** file in the backend.
