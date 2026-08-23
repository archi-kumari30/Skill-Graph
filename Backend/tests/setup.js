const mongoose = require('mongoose');
const config = require('../src/config/config');
const { connectCognoDB, closeDriver } = require('../src/config/cognodb');

// Override environment to test
process.env.NODE_ENV = 'test';
jest.setTimeout(15000);

beforeAll(async () => {
  // Connect to the test database
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongodbUri);
  }
  if (process.env.USE_GRAPH_DB === 'true') {
    try {
      await connectCognoDB();
    } catch (err) {
      console.error('Failed to connect to CognoDB in tests:', err.message);
    }
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
  if (process.env.USE_GRAPH_DB === 'true') {
    await closeDriver();
  }
});
