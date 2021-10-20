/** ExpressError extends the normal JS error so we can easily
 *  add a status when we make an instance of it.
 *
 *  The error-handling middleware will return this.
 */

 class ExpressError extends Error {
  constructor(message, status) {
    super();
    this.message = message;
    this.status = status;
    // Hide error stack during testing
    if (process.env.NODE_ENV !== 'test') {
      console.error(this.stack);
    }
  }
}

class NotFoundError extends ExpressError {
  constructor(message) {
    super(message, 404);
  }
}

class BadRequestError extends ExpressError {
  constructor(message) {
    super(message, 400);
  }
}

module.exports = {
  ExpressError,
  NotFoundError,
  BadRequestError
};