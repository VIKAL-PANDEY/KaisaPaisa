require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Connect to MongoDB (with in-memory fallback & auto-seeding)
connectDB();

const server = app.listen(PORT, HOST, () => {
  console.log(`==================================================`);
  console.log(`  KAISAPAISA RUNNING ON http://${HOST}:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Server Rejection:', err);
});
