const request = require('supertest');
const app = require('../src/app');
const Skill = require('../src/models/Skill');
const SkillRelationship = require('../src/models/SkillRelationship');
const Role = require('../src/models/Role');
const RoleSkill = require('../src/models/RoleSkill');
const UserSkill = require('../src/models/UserSkill');
const LearningResource = require('../src/models/LearningResource');
const Company = require('../src/models/Company');
const Job = require('../src/models/Job');
const LearningProgress = require('../src/models/LearningProgress');
const UserTopicProgress = require('../src/models/UserTopicProgress');

describe('SkillGraph Backend API Integration Tests', () => {
  let adminToken;
  let employeeToken;
  let adminUser;
  let employeeUser;

  beforeEach(async () => {
    // 1. Register admin user
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        accountRole: 'admin',
        department: 'IT'
      });
    adminToken = adminRes.body.data.token;
    adminUser = adminRes.body.data.user;

    // 2. Register standard employee
    const empRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Employee User',
        email: 'employee@test.com',
        password: 'password123',
        accountRole: 'employee',
        department: 'Engineering'
      });
    employeeToken = empRes.body.data.token;
    employeeUser = empRes.body.data.user;
  });

  describe('Authentication APIs', () => {
    it('should log in a user and return a token and user details', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@test.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('employee@test.com');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should block login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@test.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Incorrect email or password');
    });

    it('should fetch the current user profile under /me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('employee@test.com');
    });
  });

  describe('Skill Management APIs', () => {
    it('should allow admin/manager to create a skill', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Java',
          category: 'Programming',
          description: 'OOP Language',
          aliases: ['JDK']
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.skill.name).toBe('Java');
    });

    it('should block standard employees from creating a skill', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Java',
          category: 'Programming'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('User Skill Profiles', () => {
    let skill;

    beforeEach(async () => {
      skill = await Skill.create({
        name: 'JavaScript',
        category: 'Programming'
      });
    });

    it('should allow user to assign a skill to their own profile', async () => {
      const res = await request(app)
        .post(`/api/users/${employeeUser._id}/skills`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          skillId: skill._id,
          proficiency: 3,
          yearsOfExperience: 2
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.userSkill.proficiency).toBe(3);
    });

    it('should restrict standard users from assigning skills to other profiles', async () => {
      const res = await request(app)
        .post(`/api/users/${adminUser._id}/skills`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          skillId: skill._id,
          proficiency: 3
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Core Analysis & Graph Engines', () => {
    let jsSkill, reactSkill, nextSkill;
    let frontendRole;

    beforeEach(async () => {
      // 1. Create Skills
      jsSkill = await Skill.create({ name: 'JavaScript', category: 'Programming' });
      reactSkill = await Skill.create({ name: 'React', category: 'Frontend' });
      nextSkill = await Skill.create({ name: 'Next.js', category: 'Frontend' });

      // 2. Setup Prerequisite relationships (JS -> React, React -> Next.js)
      await SkillRelationship.create({
        sourceSkillId: jsSkill._id,
        targetSkillId: reactSkill._id,
        relationshipType: 'prerequisite'
      });
      await SkillRelationship.create({
        sourceSkillId: reactSkill._id,
        targetSkillId: nextSkill._id,
        relationshipType: 'prerequisite'
      });

      // 3. Setup learning resources
      await LearningResource.create({
        title: 'Complete React Tutorial',
        skillId: reactSkill._id,
        url: 'https://example.com/react',
        difficulty: 'intermediate'
      });

      // 4. Create target role
      frontendRole = await Role.create({
        name: 'Frontend Developer',
        department: 'Engineering',
        level: 'Mid'
      });

      // 5. Add required role skills
      // React: proficiency 4 (required)
      await RoleSkill.create({
        roleId: frontendRole._id,
        skillId: reactSkill._id,
        requiredProficiency: 4,
        importance: 'required'
      });
      // Next.js: proficiency 3 (important)
      await RoleSkill.create({
        roleId: frontendRole._id,
        skillId: nextSkill._id,
        requiredProficiency: 3,
        importance: 'important'
      });

      // 6. Setup employee profile: JS = 5 (satisfied), React = 1 (unsatisfied gap), Next.js = 0 (unsatisfied gap)
      await UserSkill.create({
        userId: employeeUser._id,
        skillId: jsSkill._id,
        proficiency: 5
      });
      await UserSkill.create({
        userId: employeeUser._id,
        skillId: reactSkill._id,
        proficiency: 1
      });

      // 7. Seed completed topics for React (8 topics) & Next.js (3 topics) to satisfy learning completion rate in tests
      await UserTopicProgress.deleteMany({});
      for (let i = 1; i <= 8; i++) {
        await UserTopicProgress.create({
          userId: employeeUser._id,
          skillId: reactSkill._id,
          topicTitle: `React Topic ${i}`,
          completed: true
        });
      }
      for (let i = 1; i <= 3; i++) {
        await UserTopicProgress.create({
          userId: employeeUser._id,
          skillId: nextSkill._id,
          topicTitle: `Next.js Topic ${i}`,
          completed: true
        });
      }
    });

    it('should calculate the skill gap analysis with weights correctly', async () => {
      const res = await request(app)
        .get(`/api/skill-gap/users/${employeeUser._id}/roles/${frontendRole._id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);

      // Calculations details:
      // Required skills: React (4, req, weight 3), Next (3, imp, weight 2)
      // Max score: 3*4 + 2*3 = 18
      // User current: React 1, Next 0
      // User score: 3*min(1,4) + 2*min(0,3) = 3 + 0 = 3
      // Readiness score: Math.round(3 / 18 * 100) = 17%
      expect(res.body.data.readinessScore).toBe(17);
      expect(res.body.data.matchedSkills).toBe(0);
      expect(res.body.data.skillsToImprove).toBe(1); // React (current 1 < required 4)
      expect(res.body.data.missingSkills).toBe(1); // Next (current 0)
    });

    it('should order recommendations prioritising React since Next.js has unsatisfied prereqs', async () => {
      const res = await request(app)
        .get(`/api/recommendations/users/${employeeUser._id}/roles/${frontendRole._id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      const recs = res.body.data.recommendations;
      expect(recs.length).toBe(2);

      // React must rank first since its prereqs (JS) are satisfied, whereas Next.js requires React (not satisfied)
      expect(recs[0].skill.name).toBe('React');
      expect(recs[1].skill.name).toBe('Next.js');
      expect(recs[1].unsatisfiedPrerequisites[0].name).toBe('React');
      expect(recs[0].learningResources[0].title).toBe('Complete React Tutorial');
    });

    it('should rank role matches for a user profile', async () => {
      const res = await request(app)
        .get(`/api/matching/users/${employeeUser._id}/roles`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.matches[0].name).toBe('Frontend Developer');
      expect(res.body.data.matches[0].matchScore).toBe(17);
    });

    it('should compile the full visual graph of skills and edges', async () => {
      const res = await request(app)
        .get('/api/skill-graph')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.nodes.length).toBe(3);
      expect(res.body.data.edges.length).toBe(2);
    });
  });

  describe('Job Matching and Companies APIs', () => {
    let company, job, skill;

    beforeEach(async () => {
      company = await Company.create({
        name: 'Stripe',
        industry: 'Fintech'
      });
      skill = await Skill.create({
        name: 'React',
        category: 'Frontend'
      });
      job = await Job.create({
        companyId: company._id,
        title: 'React Dev',
        requirements: [{
          skillId: skill._id,
          requiredProficiency: 3,
          importance: 'required',
          requirementType: 'required'
        }]
      });
    });

    it('should fetch matched jobs ranked by compatibility score', async () => {
      const res = await request(app)
        .get('/api/jobs/matches')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.matches.length).toBeGreaterThan(0);
      expect(res.body.data.matches[0].title).toBe('React Dev');
    });
  });

  describe('Learning Progress APIs', () => {
    let resource, skill;

    beforeEach(async () => {
      skill = await Skill.create({ name: 'Docker', category: 'DevOps' });
      resource = await LearningResource.create({
        title: 'Docker Course',
        skillId: skill._id,
        url: 'https://example.com',
        difficulty: 'beginner'
      });
    });

    it('should start, update, and complete progress records for a resource', async () => {
      // 1. Start
      const startRes = await request(app)
        .post(`/api/learning/${resource._id}/start`)
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(startRes.statusCode).toBe(201);
      expect(startRes.body.data.progress.status).toBe('in_progress');

      // 2. Update
      const updateRes = await request(app)
        .put(`/api/learning/${resource._id}/progress`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ progressPercentage: 50 });
      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.progress.progressPercentage).toBe(50);

      // 3. Complete
      const completeRes = await request(app)
        .post(`/api/learning/${resource._id}/complete`)
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(completeRes.statusCode).toBe(200);
      expect(completeRes.body.data.progress.status).toBe('completed');
    });
  });

  describe('AI Career Assistant API', () => {
    it('should return a configuration error when Gemini API Key is missing', async () => {
      // Temporarily clear API key if set to test fallback
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const res = await request(app)
        .post('/api/ai/career-assistant')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ question: 'What should I learn next?' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('AI Career Assistant is not configured');

      // Restore key
      process.env.GEMINI_API_KEY = originalKey;
    });
  });
});
