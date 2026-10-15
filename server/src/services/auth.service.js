const bcrypt = require('bcrypt');
const User = require('../models/User');
const RevokedToken = require('../models/RevokedToken');
const AppError = require('../utils/AppError');
const normalizeEmail = require('../utils/normalizeEmail');
const { verifyToken } = require('../utils/token');
const { bcryptRounds } = require('../config/env');

// Compared against when the email is unknown, so unknown-email and wrong-password
// logins take the same time and can't be told apart by timing.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', bcryptRounds);

// Only the listed fields are used, so extra body fields (e.g. `role`) are ignored.
const register = async ({ name, email, password, role }) => {
  const normalizedEmail = normalizeEmail(email);
  if (await User.exists({ email: normalizedEmail })) {
    throw new AppError('Email is already registered', 409);
  }
  return User.create({ name: name.trim(), email: normalizedEmail, password, role });
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');
  const passwordMatches = user
    ? await user.comparePassword(password)
    : (await bcrypt.compare(password, DUMMY_HASH), false);
  // Same message for unknown email and wrong password to avoid user enumeration.
  if (!passwordMatches) throw new AppError('Invalid email or password', 401);
  return user;
};

// Revokes the presented token so it stops working even if someone copied it.
// A missing, invalid or expired token needs no revocation, so logout never fails on it.
const logout = async (token) => {
  if (!token) return;
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return;
  }
  if (!payload.jti) return;
  await RevokedToken.updateOne(
    { jti: payload.jti },
    { jti: payload.jti, expiresAt: new Date(payload.exp * 1000) },
    { upsert: true }
  );
};

module.exports = { register, login, logout };
