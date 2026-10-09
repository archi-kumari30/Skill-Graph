const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const Role = require('../src/models/Role');
const RoleSkill = require('../src/models/RoleSkill');
const UserSkill = require('../src/models/UserSkill');
const Job = require('../src/models/Job');
const Company = require('../src/models/Company');

describe('Dashboard Command Center & Logout Lifecycle Tests', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    // 1. Create a user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dashboard Tester',
        email: 'dashboard_test@test.com',
        password: 'Password123!',
        accountRole: 'student',
        department: 'Engineering'
      });

    expect(registerRes.statusCode).toBe(201);
    authToken = registerRes.body.data.token || registerRes.body.data.accessToken;
    testUser = registerRes.body.data.user;

    // 2. Create skills, role, and job for realistic command center verification
    const skillA = await Skill.create({ name: 'Node.js', category: 'Backend' });
    const skillB = await Skill.create({ name: 'MongoDB', category: 'Database' });

    const role = await Role.create({
      name: 'Backend Engineer',
      description: 'Build robust APIs',
      level: 'Junior'
    });

    await RoleSkill.create({
      roleId: role._id,
      skillId: skillA._id,
      requiredProficiency: 3,
      importance: 'required'
    });

    await RoleSkill.create({
      roleId: role._id,
      skillId: skillB._id,
      requiredProficiency: 3,
      importance: 'required'
    });

    // Update user target role
    await User.findByIdAndUpdate(testUser._id || testUser.id, {
      targetRoleId: role._id
    });

    // Log one user skill
    await UserSkill.create({
      userId: testUser._id || testUser.id,
      skillId: skillA._id,
      proficiency: 3,
      verified: true
    });

    // Create a company and job
    const company = await Company.create({
      name: 'Tech Corp',
      industry: 'Software'
    });

    await Job.create({
      companyId: company._id,
      title: 'Junior Backend Developer',
      status: 'Active',
      requirements: [
        {
          skillId: skillA._id,
          requiredProficiency: 3,
          importance: 'required'
        }
      ]
    });
  });

  describe('GET /api/dashboard/command-center', () => {
    it('should return 401 if unauthenticated', async () => {
      const res = await request(app).get('/api/dashboard/command-center');
      expect(res.statusCode).toBe(401);
    });

    it('should quickly return the complete command center data structure for authenticated student', async () => {
      const startTime = Date.now();
      const res = await request(app)
        .get('/api/dashboard/command-center')
        .set('Authorization', `Bearer ${authToken}`);

      const elapsed = Date.now() - startTime;

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const data = res.body.data;
      expect(data).toHaveProperty('user');
      expect(data.user.name).toBe('Dashboard Tester');
      expect(data).toHaveProperty('quickStats');
      expect(data.quickStats.totalSkills).toBe(1);
      expect(data.quickStats.verifiedSkills).toBe(1);

      expect(data).toHaveProperty('readiness');
      expect(data.readiness).not.toBeNull();
      expect(data.readiness.score).toBeGreaterThan(0);

      expect(data).toHaveProperty('topGaps');
      expect(Array.isArray(data.topGaps)).toBe(true);

      expect(data).toHaveProperty('jobMatches');
      expect(Array.isArray(data.jobMatches)).toBe(true);
      expect(data.jobMatches.length).toBeGreaterThan(0);
      expect(data.jobMatches[0].title).toBe('Junior Backend Developer');
      expect(data.jobMatches[0].matchScore).toBe(100);

      expect(data).toHaveProperty('applicationStats');
      expect(data.applicationStats.total).toBe(0);

      // Verify fast execution (well under 2000ms threshold in unit test environment)
      expect(elapsed).toBeLessThan(2000);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully clear cookies and return 200', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .send();

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');

      // Verify clear-cookie header is present
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
    });
  });
});
