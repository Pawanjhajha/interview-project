const connectDB = require('../src/config/db');
const app = require('../src/app');

// Vercel runs this file as a function; connect lazily and reuse the connection across warm invocations.
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
