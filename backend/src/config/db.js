const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kaisapaisa';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB] Connected to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Could not connect to ${uri}`);
    console.error(`[MongoDB] Error: ${error.message}`);
    console.log('');
    console.log('==================================================');
    console.log('  KAISAPAISA: MongoDB connection failed.');
    console.log('  Please install & start MongoDB Community Server:');
    console.log('  https://www.mongodb.com/try/download/community');
    console.log('  Then run: mongod');
    console.log('  Or set MONGODB_URI in .env to a MongoDB Atlas URI');
    console.log('==================================================');
    console.log('');
    console.log('  [Demo Mode] The API will start but DB operations');
    console.log('  will fail. Use MongoDB Atlas (free) for full use.');
    console.log('==================================================');
    // Don't exit — let the server run so frontend can connect
    // Users can still see the UI; only DB ops will fail
  }
};

module.exports = connectDB;
