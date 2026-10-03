const request = require('supertest');
const app = require('../src/app');
const Job = require('../src/models/Job');
const Company = require('../src/models/Company');
const Skill = require('../src/models/Skill');

describe('Module 12: Declarative Validation, Standardized Pagination & OpenAPI Tests', () => {
  let techCorp;
  let nodeSkill;
  let userToken;

  beforeEach(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Validator User',
        email: `valuser_${Date.now()}@test.com`,
        password: 'password123'
      });
    userToken = regRes.body.data.token;

    techCorp = await Company.create({
      name: 'Validation Tech Corp',
      industry: 'Software',
      location: 'San Francisco, CA'
    });

    nodeSkill = await Skill.create({
      name: 'Node.js',
      category: 'Backend'
    });

    // Seed 5 sample jobs for pagination testing
    const jobsToCreate = [];
    for (let i = 1; i <= 5; i++) {
      jobsToCreate.push({
        companyId: techCorp._id,
        title: `Software Engineer ${i}`,
        description: `Description for job ${i}`,
        location: 'Remote',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        salaryMin: 80000 + i * 5000,
        salaryMax: 120000 + i * 5000,
        requirements: [
          { skillId: nodeSkill._id, requiredProficiency: 3, importance: 'required' }
        ]
      });
    }
    await Job.insertMany(jobsToCreate);
  });

  describe('1. Declarative Request Validation', () => {
    it('should reject registration when required fields are missing with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'missingname@test.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Validation failed');
      expect(Array.isArray(res.body.error.details)).toBe(true);
      expect(res.body.error.details.some(d => d.field === 'name')).toBe(true);
    });

    it('should reject registration with invalid email format with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details.some(d => d.field === 'email')).toBe(true);
    });

    it('should reject registration with password under minimum length with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Password User',
          email: 'shortpass@test.com',
          password: '123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details.some(d => d.field === 'password')).toBe(true);
    });

    it('should reject login with empty body with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('2. Standardized Pagination Helper', () => {
    it('should return standardized pagination envelope when page and limit query params are passed', async () => {
      const res = await request(app)
        .get('/api/jobs?page=1&limit=2')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(res.body.data.items.length).toBe(2);

      const pagination = res.body.data.pagination;
      expect(pagination).toBeDefined();
      expect(pagination.total).toBe(5);
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(2);
      expect(pagination.totalPages).toBe(3);
      expect(pagination.hasNextPage).toBe(true);
      expect(pagination.hasPrevPage).toBe(false);
    });

    it('should correctly flag hasPrevPage and hasNextPage on intermediate pages', async () => {
      const res = await request(app)
        .get('/api/jobs?page=2&limit=2')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      const pagination = res.body.data.pagination;
      expect(pagination.page).toBe(2);
      expect(pagination.hasPrevPage).toBe(true);
      expect(pagination.hasNextPage).toBe(true);
    });

    it('should correctly flag hasNextPage as false on the last page', async () => {
      const res = await request(app)
        .get('/api/jobs?page=3&limit=2')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      const pagination = res.body.data.pagination;
      expect(pagination.page).toBe(3);
      expect(pagination.hasPrevPage).toBe(true);
      expect(pagination.hasNextPage).toBe(false);
    });
  });

  describe('3. Interactive OpenAPI / Swagger Documentation', () => {
    it('should serve Swagger UI HTML documentation at GET /api/docs', async () => {
      const res = await request(app).get('/api/docs/');

      // swagger-ui-express returns 200 or 301 redirect to trailing slash
      expect([200, 301, 302]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(res.text).toContain('Swagger UI');
      }
    });

    it('should serve OpenAPI 3.0 JSON specification at GET /api/docs.json', async () => {
      const res = await request(app).get('/api/docs.json');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.body.openapi).toBe('3.0.0');
      expect(res.body.info.title).toBe('SkillGraph REST API');
      expect(res.body.components.securitySchemes.bearerAuth).toBeDefined();
    });
  });
});
