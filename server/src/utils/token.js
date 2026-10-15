const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn, cookieSameSite, cookieSecure } = require('../config/env');

const COOKIE_NAME = 'token';
// Pinned so a token can't pick its own algorithm (e.g. "none").
const JWT_ALGORITHM = 'HS256';

const cookieOptions = {
  httpOnly: true,
  secure: cookieSecure,
  sameSite: cookieSameSite,
};

const signToken = (userId) =>
  jwt.sign({ id: userId }, jwtSecret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: jwtExpiresIn,
    jwtid: crypto.randomUUID(), // unique id so this one token can be revoked on logout
  });

const verifyToken = (token) => jwt.verify(token, jwtSecret, { algorithms: [JWT_ALGORITHM] });

// The only place that knows where the token travels (httpOnly cookie).
const getTokenFromRequest = (req) => req.cookies?.[COOKIE_NAME];

// The cookie expires exactly when the token does, so JWT_EXPIRES_IN is the only lifetime setting.
const setAuthCookie = (res, token) =>
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, expires: new Date(jwt.decode(token).exp * 1000) });

const clearAuthCookie = (res) => res.clearCookie(COOKIE_NAME, cookieOptions);

module.exports = {
  COOKIE_NAME,
  signToken,
  verifyToken,
  getTokenFromRequest,
  setAuthCookie,
  clearAuthCookie,
};
