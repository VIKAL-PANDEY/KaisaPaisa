require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  KAISAPAISA BACKEND RUNNING ON PORT ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Server Rejection:', err);
});
