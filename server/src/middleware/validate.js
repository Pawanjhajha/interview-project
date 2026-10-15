const AppError = require('../utils/AppError');

// Validates the request body by default; pass 'query' for GET endpoints.
const validate = (schema, source = 'body') => (req, res, next) => {
  const errors = schema(req[source]);
  if (Object.keys(errors).length) {
    return next(new AppError('Validation failed', 400, errors));
  }
  next();
};

module.exports = validate;
