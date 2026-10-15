const { port } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

const start = async () => {
  await connectDB();
  app.listen(port, () => console.log(`Server running on port ${port}`));
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
