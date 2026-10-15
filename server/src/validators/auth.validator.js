const normalizeEmail = require('../utils/normalizeEmail');
const { SELF_SERVICE_ROLES } = require('../utils/roles');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 50;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72; // bcrypt ignores everything after 72 bytes
const MAX_EMAIL_LENGTH = 254;

const isString = (value) => typeof value === 'string';

const isValidEmail = (email) => {
  if (!isString(email)) return false;
  const normalized = normalizeEmail(email);
  return normalized.length <= MAX_EMAIL_LENGTH && EMAIL_REGEX.test(normalized);
};

// Each validator returns an object of field -> message (empty when valid).
const registerSchema = ({ name, email, password, role } = {}) => {
  const errors = {};
  if (!isString(name) || !name.trim()) errors.name = 'Name is required';
  else if (name.trim().length > MAX_NAME_LENGTH) errors.name = `Name must be at most ${MAX_NAME_LENGTH} characters`;

  if (!isValidEmail(email)) errors.email = 'A valid email is required';

  if (!isString(password) || password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  } else if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) {
    errors.password = `Password must be at most ${MAX_PASSWORD_BYTES} bytes`;
  }
  // Optional; admin-style roles are never self-assignable.
  if (role !== undefined && !SELF_SERVICE_ROLES.includes(role)) {
    errors.role = `Role must be one of: ${SELF_SERVICE_ROLES.join(', ')}`;
  }
  return errors;
};

const loginSchema = ({ email, password } = {}) => {
  const errors = {};
  if (!isValidEmail(email)) errors.email = 'A valid email is required';
  if (!isString(password) || !password) errors.password = 'Password is required';
  return errors;
};

module.exports = { registerSchema, loginSchema };
