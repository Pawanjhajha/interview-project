const AppError = require('../utils/AppError');

// Authorization only: must run after `protect`, and reads the role from the DB-loaded req.user.
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to do this', 403));
  }
  next();
};

module.exports = authorize;
