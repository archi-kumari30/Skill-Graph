const dns = require('dns');
const mongoose = require('mongoose');
const config = require('./config');

// Configure reliable DNS servers for SRV resolution (fixes querySrv ECONNREFUSED on Windows/ISPs)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Gracefully fallback to system default if setting custom DNS servers is unsupported
}

const connectDB = async () => {
  try {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (_) {}

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
