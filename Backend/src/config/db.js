const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    if (config.nodeEnv !== 'test') {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    
    // Safely drop the old name_1 unique index to allow compound unique index { name, userId }
    try {
      await conn.connection.collection('skills').dropIndex('name_1');
      if (config.nodeEnv !== 'test') {
        console.log('Dropped old single-field unique index "name_1" from skills.');
      }
    } catch (indexErr) {
      // Ignore errors if index does not exist or already dropped
    }

    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
