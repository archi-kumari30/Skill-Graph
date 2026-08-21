const mongoose = require('mongoose');
const config = require('../src/config/config');

// Override environment to test
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  // Connect to the test database
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongodbUri);
  }
});

beforeEach(async () => {
  // Clean all database collections between tests to avoid state contamination
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  // Safely close the database connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
