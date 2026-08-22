require('dotenv').config();
const app = require('./backend/src/app');
const connectDB = require('./backend/src/config/db');

const PORT = 3000;
const HOST = '0.0.0.0';

// Connect to MongoDB asynchronously without blocking server start
connectDB().catch(err => {
  console.warn('[MongoDB] Initial connection warning:', err.message);
});

const server = app.listen(PORT, HOST, () => {
  console.log(`==================================================`);
  console.log(`  KAISAPAISA RUNNING ON http://${HOST}:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`==================================================`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Server Rejection:', err);
});
