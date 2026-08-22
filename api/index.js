const mongoose = require('mongoose');
const app = require('../backend/src/app');
const connectDB = require('../backend/src/config/db');

module.exports = async (req, res) => {
  if (mongoose.connection.readyState === 0) {
    try {
      await connectDB();
    } catch (err) {
      console.error('[Vercel Serverless DB Error]:', err.message);
    }
  }
  return app(req, res);
};
