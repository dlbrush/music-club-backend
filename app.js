const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require("cors");

const { FRONTEND_URI } = require('./config');

const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/clubs');
const postRoutes = require('./routes/posts');
const albumRoutes = require('./routes/albums');
const commentRoutes = require('./routes/comments');
const { authenticateToken } = require('./middleware/auth');

const app = express();

const corsOptions = {
  origin: FRONTEND_URI,
  optionsSuccessStatus: 200,
  credentials: true
}

// Setup
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('tiny'));

// Authentication
app.use(authenticateToken);

app.options('*', function (req, res, next) {
  res.set({
    'Access-Control-Allow-Origin':  FRONTEND_URI,
    'Access-Control-Allow-Methods': 'POST, GET, PATCH, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.json({message: 'success'});
});

// Routes
app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/clubs', clubRoutes);
app.use('/posts', postRoutes);
app.use('/albums', albumRoutes);
app.use('/comments', commentRoutes);

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  let message = err.message;
  if (Array.isArray(message)) {
    message = message.toString();
  }

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;