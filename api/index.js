const app = require('../backend/src/app');
const connectDB = require('../backend/src/config/db');

let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.error('[Vercel Serverless DB Error]:', err.message);
    }
  }
  return app(req, res);
};
