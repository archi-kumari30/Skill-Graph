const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.NODE_ENV === 'test'
    ? (process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/skillgraph_test')
    : (process.env.MONGODB_URI || 'mongodb://localhost:27017/skillgraph'),
  jwtSecret: process.env.JWT_SECRET || 'super_secret_skill_graph_jwt_key_12345',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'super_secret_skill_graph_refresh_key_67890',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  cookieSecret: process.env.COOKIE_SECRET || 'super_secret_cookie_signing_key_13579',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  useGraphDb: process.env.USE_GRAPH_DB === 'true',
  cognodbUri: process.env.COGNODB_URI || process.env.NEO4J_URI || 'bolt://localhost:7687',
  cognodbUsername: process.env.COGNODB_USERNAME || process.env.NEO4J_USER || 'neo4j',
  cognodbPassword: process.env.COGNODB_PASSWORD || process.env.NEO4J_PASSWORD || 'password',

  validateConfig() {
    const warnings = [];
    if (this.nodeEnv === 'production') {
      if (this.jwtSecret === 'super_secret_skill_graph_jwt_key_12345') {
        warnings.push('CRITICAL: Default JWT_SECRET used in production environment!');
      }
      if (this.cookieSecret === 'super_secret_cookie_signing_key_13579') {
        warnings.push('CRITICAL: Default COOKIE_SECRET used in production environment!');
      }
      if (!this.geminiApiKey) {
        warnings.push('WARNING: GEMINI_API_KEY is not set. AI assistant will operate in heuristic fallback mode.');
      }
    }
    return {
      isValid: warnings.length === 0 || this.nodeEnv !== 'production',
      warnings
    };
  }
};

module.exports = config;
