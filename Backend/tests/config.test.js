const request = require('supertest');
const app = require('../src/app');
const config = require('../src/config/config');

describe('Module 01: Project Setup & Environment Pipeline', () => {
  describe('Configuration Schema & Environment Validation', () => {
    it('should export all required configuration keys with valid types', () => {
      expect(typeof config.port).toBe('number');
      expect(typeof config.mongodbUri).toBe('string');
      expect(typeof config.jwtSecret).toBe('string');
      expect(typeof config.jwtExpiresIn).toBe('string');
      expect(typeof config.refreshTokenSecret).toBe('string');
      expect(typeof config.refreshTokenExpiresIn).toBe('string');
      expect(typeof config.cookieSecret).toBe('string');
      expect(typeof config.clientUrl).toBe('string');
      expect(typeof config.nodeEnv).toBe('string');
      expect(typeof config.useGraphDb).toBe('boolean');
    });

    it('should validate clean configuration in test/development mode', () => {
      const result = config.validateConfig();
      expect(result.isValid).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should flag warnings when default secrets are used in production environment', () => {
      const originalEnv = config.nodeEnv;
      config.nodeEnv = 'production';

      const result = config.validateConfig();
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('JWT_SECRET'))).toBe(true);
      expect(result.warnings.some(w => w.includes('COOKIE_SECRET'))).toBe(true);

      // Restore environment
      config.nodeEnv = originalEnv;
    });
  });

  describe('Security Middleware: NoSQL Injection Sanitization', () => {
    it('should sanitize request body by stripping $ operators', async () => {
      // Send a request with a $gt operator in the body
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: { '$gt': '' },
          password: 'password123'
        });

      // The sanitizer strips out keys starting with $, so email becomes empty/undefined
      // This results in a validation error rather than executing an injection query
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Enhanced Health Check Endpoint', () => {
    it('should return UP status and service indicators on /api/health', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('UP');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('services');
      expect(res.body.services).toHaveProperty('database');
      expect(res.body.services).toHaveProperty('graphEngine');
      expect(res.body).toHaveProperty('environment');
    });

    it('should return UP status on fallback /health endpoint', async () => {
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('UP');
    });
  });
});
