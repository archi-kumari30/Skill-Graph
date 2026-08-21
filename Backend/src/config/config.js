const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.NODE_ENV === 'test'
    ? (process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/skillgraph_test')
    : (process.env.MONGODB_URI || 'mongodb://localhost:27017/skillgraph'),
  jwtSecret: process.env.JWT_SECRET || 'super_secret_skill_graph_jwt_key_12345',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  nodeEnv: process.env.NODE_ENV || 'development'
};
