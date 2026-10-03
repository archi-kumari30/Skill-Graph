const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const Role = require('../src/models/Role');
const RoleSkill = require('../src/models/RoleSkill');
const UserSkill = require('../src/models/UserSkill');
const { calculateReadiness } = require('../src/utils/scoring');

describe('Module 06: Career Readiness & Seniority Tiers Integration Tests', () => {
  let studentUser;
  let studentToken;

  let htmlSkill;
  let cssSkill;
  let jsSkill;
  let archSkill;

  let juniorRole;
  let seniorRole;

  beforeEach(async () => {
    // 1. Seed Skills
    htmlSkill = await Skill.create({ name: 'HTML5', category: 'Frontend' });
    cssSkill = await Skill.create({ name: 'CSS3', category: 'Frontend' });
    jsSkill = await Skill.create({ name: 'JavaScript ES6', category: 'Frontend' });
    archSkill = await Skill.create({ name: 'System Architecture', category: 'Engineering' });

    // 2. Seed Junior Role
    juniorRole = await Role.create({
      name: 'Junior Web Developer',
      department: 'Engineering',
      level: 'junior',
      description: 'Entry-level position for learning and building web features'
    });

    // 3. Seed Senior Role
    seniorRole = await Role.create({
      name: 'Senior Frontend Architect',
      department: 'Engineering',
      level: 'senior',
      description: 'Senior leadership role responsible for performance and large-scale UI'
    });

    // 4. Seed Requirements for Junior Role (accessible baseline)
    await RoleSkill.create({
      roleId: juniorRole._id,
      skillId: htmlSkill._id,
      requiredProficiency: 2,
      importance: 'required' // weight 3
    });
    await RoleSkill.create({
      roleId: juniorRole._id,
      skillId: cssSkill._id,
      requiredProficiency: 2,
      importance: 'required' // weight 3
    });
    await RoleSkill.create({
      roleId: juniorRole._id,
      skillId: jsSkill._id,
      requiredProficiency: 2,
      importance: 'important' // weight 2
    });

    // 5. Seed Requirements for Senior Role (rigorous benchmark)
    await RoleSkill.create({
      roleId: seniorRole._id,
      skillId: htmlSkill._id,
      requiredProficiency: 4,
      importance: 'required' // weight 3
    });
    await RoleSkill.create({
      roleId: seniorRole._id,
      skillId: cssSkill._id,
      requiredProficiency: 4,
      importance: 'required' // weight 3
    });
    await RoleSkill.create({
      roleId: seniorRole._id,
      skillId: jsSkill._id,
      requiredProficiency: 5,
      importance: 'required' // weight 3
    });
    await RoleSkill.create({
      roleId: seniorRole._id,
      skillId: archSkill._id,
      requiredProficiency: 5,
      importance: 'required' // weight 3
    });

    // 6. Register Student User
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jordan Lee',
        email: 'jordan.student@test.com',
        password: 'password123',
        accountRole: 'student',
        college: 'Polytechnic Institute'
      });
    studentToken = regRes.body.data.token;
    studentUser = regRes.body.data.user;

    // 7. Add foundational skills to Student: proficiency 2 in HTML, CSS, JS
    await UserSkill.create({
      userId: studentUser._id,
      skillId: htmlSkill._id,
      proficiency: 2
    });
    await UserSkill.create({
      userId: studentUser._id,
      skillId: cssSkill._id,
      proficiency: 2
    });
    await UserSkill.create({
      userId: studentUser._id,
      skillId: jsSkill._id,
      proficiency: 2
    });
  });

  describe('1. Role Seniority Tier Querying', () => {
    it('should filter roles by seniority tier using ?level=junior', async () => {
      const res = await request(app)
        .get('/api/roles?level=junior')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roles.length).toBeGreaterThanOrEqual(1);

      const allJunior = res.body.data.roles.every((r) => r.level === 'junior');
      expect(allJunior).toBe(true);
    });

    it('should filter roles by seniority tier using ?level=senior', async () => {
      const res = await request(app)
        .get('/api/roles?level=senior')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const allSenior = res.body.data.roles.every((r) => r.level === 'senior');
      expect(allSenior).toBe(true);
    });
  });

  describe('2. Mathematical Readiness Scoring & Tier Calibration', () => {
    it('should yield higher readiness score for Junior role compared to Senior role for a beginner student', async () => {
      // Calculate gap against Junior Role
      const juniorGapRes = await request(app)
        .get(`/api/skill-gap/${juniorRole._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(juniorGapRes.statusCode).toBe(200);
      const juniorScore = juniorGapRes.body.data.readinessScore;

      // Calculate gap against Senior Role
      const seniorGapRes = await request(app)
        .get(`/api/skill-gap/${seniorRole._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(seniorGapRes.statusCode).toBe(200);
      const seniorScore = seniorGapRes.body.data.readinessScore;

      // The beginner student meets 100% of Junior expectations (2/2 across HTML, CSS, JS)
      expect(juniorScore).toBe(100);

      // Against Senior role (requires 4, 4, 5, 5), student only achieves ~27%
      expect(seniorScore).toBeLessThan(40);
      expect(seniorScore).toBeGreaterThan(0);

      // Verify level badge is returned in role payload
      expect(juniorGapRes.body.data.role.level).toBe('junior');
      expect(seniorGapRes.body.data.role.level).toBe('senior');
    });

    it('should calculate 0% readiness without error when user has 0 skills', async () => {
      // Register brand new student with 0 skills
      const newStudentRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Empty Student',
          email: 'empty@test.com',
          password: 'password123',
          accountRole: 'student'
        });
      const emptyToken = newStudentRes.body.data.token;

      const res = await request(app)
        .get(`/api/skill-gap/${juniorRole._id}`)
        .set('Authorization', `Bearer ${emptyToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.readinessScore).toBe(0);
      expect(res.body.data.missingSkills).toBe(3);
      expect(res.body.data.skills.length).toBe(3);
    });

    it('should return 404 for non-existent role in skill gap evaluation', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/skill-gap/${fakeId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.message).toContain('Role not found');
    });
  });

  describe('3. Multi-Role Matching Compatibility', () => {
    it('should rank roles by match score descending and include role level', async () => {
      const res = await request(app)
        .get('/api/matching')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const matches = res.body.data.matches;
      expect(matches.length).toBeGreaterThanOrEqual(2);

      // The Junior Web Developer role should rank higher than Senior Frontend Architect
      const juniorMatch = matches.find((m) => m.roleId.toString() === juniorRole._id.toString());
      const seniorMatch = matches.find((m) => m.roleId.toString() === seniorRole._id.toString());

      expect(juniorMatch).toBeDefined();
      expect(seniorMatch).toBeDefined();
      expect(juniorMatch.level).toBe('junior');
      expect(seniorMatch.level).toBe('senior');
      expect(juniorMatch.matchScore).toBeGreaterThan(seniorMatch.matchScore);
    });
  });
});
