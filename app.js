const express = require('express');
const morgan = require('morgan');

const userRoutes = require('./routes/users');
const clubRoutes = require('./routes/clubs');

const app = express();

app.use(express.json());
app.use(morgan('tiny'));

// Routes
app.use('/users', userRoutes);
app.use('/clubs', clubRoutes);

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;