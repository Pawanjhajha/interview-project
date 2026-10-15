require('dotenv').config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const isProd = process.env.NODE_ENV === 'production';

const MIN_JWT_SECRET_LENGTH = 32;
if (process.env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
  throw new Error(
    `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters (generate one with: npm run generate-secret)`
  );
}

const bcryptRounds = Number(process.env.BCRYPT_ROUNDS || 12);
if (!Number.isInteger(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 15) {
  throw new Error('BCRYPT_ROUNDS must be an integer between 10 and 15');
}

const SAME_SITE_VALUES = ['lax', 'strict', 'none'];
const cookieSameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
if (!SAME_SITE_VALUES.includes(cookieSameSite)) {
  throw new Error(`COOKIE_SAME_SITE must be one of: ${SAME_SITE_VALUES.join(', ')}`);
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  bcryptRounds,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  cookieSameSite,
  // Browsers reject SameSite=None cookies that are not Secure, so None forces Secure on.
  cookieSecure: isProd || cookieSameSite === 'none',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
