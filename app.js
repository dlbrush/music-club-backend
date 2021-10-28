const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require("cors");

const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const clubRoutes = require('./routes/clubs');
const postRoutes = require('./routes/posts');
const { authenticateToken } = require('./middleware/auth');

const app = express();

// Setup
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan('tiny'));

// Authentication
app.use(authenticateToken);

// Routes
app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/clubs', clubRoutes);
app.use('/posts', postRoutes);

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