const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RevokedToken = require('../models/RevokedToken');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getTokenFromRequest, verifyToken } = require('../utils/token');

// Authentication only: establishes who the caller is. Role/permission checks
// belong in separate authorization middleware that reads req.user.
const protect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) throw new AppError('Not authenticated', 401);

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    const message = err instanceof jwt.TokenExpiredError ? 'Session expired' : 'Invalid session';
    throw new AppError(message, 401);
  }

  if (payload.jti && (await RevokedToken.exists({ jti: payload.jti }))) {
    throw new AppError('Invalid session', 401);
  }

  // Identity comes from the verified token and the database, never from the request body or headers.
  const user = await User.findById(payload.id);
  if (!user) throw new AppError('User no longer exists', 401);

  req.user = user;
  next();
});

module.exports = { protect };
