const mongoose = require('mongoose');
const { mongoUri } = require('./env');

let connecting;

// Safe to call repeatedly (serverless invocations); the connection is made once.
const connectDB = () => {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    connecting = mongoose
      .connect(mongoUri)
      .then(() => console.log('MongoDB connected'))
      .catch((err) => {
        connecting = undefined;
        throw err;
      });
  }
  return connecting;
};

module.exports = connectDB;
