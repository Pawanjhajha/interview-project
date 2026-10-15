const mongoose = require('mongoose');

// Denylist of logged-out JWTs. Entries expire with the token itself (TTL index),
// so the collection only holds tokens that would otherwise still be valid.
const revokedTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

module.exports = mongoose.model('RevokedToken', revokedTokenSchema);
