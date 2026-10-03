const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const Topic = require('../src/models/Topic');
const LearningResource = require('../src/models/LearningResource');
const LearningProgress = require('../src/models/LearningProgress');
const Role = require('../src/models/Role');
const RoleSkill = require('../src/models/RoleSkill');
const UserSkill = require('../src/models/UserSkill');
const UserTopicProgress = require('../src/models/UserTopicProgress');

describe('Module 07: Learning Topics, Progress Proof & Dynamic Recommendations Tests', () => {
  let studentToken;
  let studentUser;
  let adminToken;
  let adminUser;

  let reactSkill;
  let nodeSkill;
  let reactTopic1;
  let reactTopic2;
  let beginnerResource;
  let longResource;
  let targetRole;

  beforeEach(async () => {
    // 1. Create Skills
    reactSkill = await Skill.create({
      name: 'React',
      category: 'Frontend',
      description: 'Component-based UI library'
    });

    nodeSkill = await Skill.create({
      name: 'Node.js',
      category: 'Backend',
      description: 'JavaScript runtime'
    });

    // 2. Create Topics for React
    reactTopic1 = await Topic.create({
      skillId: reactSkill._id,
      title: 'Components & JSX',
      slug: 'components-jsx',
      order: 1,
      summary: 'Functional components and JSX syntax'
    });

    reactTopic2 = await Topic.create({
      skillId: reactSkill._id,
      title: 'Hooks & State',
      slug: 'hooks-state',
      order: 2,
      summary: 'useState and useEffect lifecycle'
    });

    // 3. Create Learning Resources
    beginnerResource = await LearningResource.create({
      title: 'React Quickstart',
      skillId: reactSkill._id,
      url: 'https://react.dev/learn',
      difficulty: 'beginner',
      estimatedHours: 5
    });

    longResource = await LearningResource.create({
      title: 'Advanced Full-Stack Engineering',
      skillId: nodeSkill._id,
      url: 'https://example.com/advanced-node',
      difficulty: 'advanced',
      estimatedHours: 40
    });

    // 4. Create Role & Requirements
    targetRole = await Role.create({
      name: 'Junior Frontend Engineer',
      department: 'Engineering',
      level: 'junior'
    });

    await RoleSkill.create({
      roleId: targetRole._id,
      skillId: reactSkill._id,
      requiredProficiency: 3,
      importance: 'required'
    });

    // 5. Register Admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Curriculum Director',
        email: 'director@university.edu',
        password: 'password123',
        accountRole: 'admin'
      });
    adminToken = adminRes.body.data.token;
    adminUser = adminRes.body.data.user;

    // 6. Register Student
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Taylor Learner',
        email: 'taylor.student@university.edu',
        password: 'password123',
        accountRole: 'student'
      });
    studentToken = studentRes.body.data.token;
    studentUser = studentRes.body.data.user;

    // Give student basic proficiency in React
    await UserSkill.create({
      userId: studentUser._id,
      skillId: reactSkill._id,
      proficiency: 3
    });
  });

  describe('1. Dynamic Topic Retrieval & Cataloging', () => {
    it('should retrieve ordered topics for a specific skill via GET /api/learning/skills/:skillId/topics', async () => {
      const res = await request(app)
        .get(`/api/learning/skills/${reactSkill._id}/topics`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.topics.length).toBe(2);
      expect(res.body.data.topics[0].slug).toBe('components-jsx');
      expect(res.body.data.topics[1].slug).toBe('hooks-state');
      expect(res.body.data.topics[0].order).toBeLessThan(res.body.data.topics[1].order);
    });

    it('should return 404 when querying topics for a non-existent skill', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/learning/skills/${fakeId}/topics`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.message).toContain('Skill not found');
    });

    it('should retrieve topic catalog across skills via GET /api/learning/topics/catalog', async () => {
      const res = await request(app)
        .get('/api/learning/topics/catalog')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.topics.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.topics[0].skillId).toBeDefined();
    });
  });

  describe('2. Dynamic Topic Creation & RBAC Validation', () => {
    it('should allow admin to create a new topic for a skill', async () => {
      const res = await request(app)
        .post(`/api/learning/skills/${reactSkill._id}/topics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Context API & Redux',
          slug: 'context-api-redux',
          order: 3,
          summary: 'Global state management in React'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.topic.title).toBe('Context API & Redux');
      expect(res.body.data.topic.slug).toBe('context-api-redux');
      expect(res.body.data.topic.order).toBe(3);
    });

    it('should reject topic creation by a student with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/learning/skills/${reactSkill._id}/topics`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Unauthorized Topic',
          slug: 'unauthorized-topic'
        });

      expect(res.statusCode).toBe(403);
    });

    it('should reject topic creation with invalid slug formatting (spaces or uppercase)', async () => {
      const res = await request(app)
        .post(`/api/learning/skills/${reactSkill._id}/topics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Slug Topic',
          slug: 'Invalid Slug!'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('Slug must contain only lowercase');
    });

    it('should reject duplicate topic slug for the same skill with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/learning/skills/${reactSkill._id}/topics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Duplicate Components',
          slug: 'components-jsx'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('already exists');
    });
  });

  describe('3. Dynamic Topic Progress & Scoring Recalibration', () => {
    it('should record completed topic and dynamically calibrate skill gap readiness', async () => {
      // 1. Initially student has completed 0 topics for React (which has 2 topics in DB)
      // When student completes 1 topic:
      const completeRes = await request(app)
        .post('/api/learning/topics/complete')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          skillId: reactSkill._id,
          topicTitle: 'Components & JSX',
          completed: true
        });

      expect(completeRes.statusCode).toBe(200);

      // Verify UserTopicProgress record
      const progressRecord = await UserTopicProgress.findOne({
        userId: studentUser._id,
        skillId: reactSkill._id
      });
      expect(progressRecord).toBeDefined();
      expect(progressRecord.completed).toBe(true);

      // 2. Query skill gap - 1 completed out of 2 topics = 50% completion rate
      // User proficiency 3 * 0.5 = 1.5 effective proficiency out of required 3
      const gapRes = await request(app)
        .get(`/api/skill-gap/${targetRole._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(gapRes.statusCode).toBe(200);
      expect(gapRes.body.data.readinessScore).toBe(50);
      expect(gapRes.body.data.skills[0].totalTopics).toBe(2);
      expect(gapRes.body.data.skills[0].completedTopicsCount).toBe(1);
    });
  });

  describe('4. Course Progress & Proof Submission', () => {
    it('should update course progress with valid proofUrl', async () => {
      const res = await request(app)
        .put(`/api/learning/progress/${beginnerResource._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          progressPercentage: 100,
          proofUrl: 'https://certificates.example.com/taylor-react-cert.pdf'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.progress.status).toBe('completed');
      expect(res.body.data.progress.proofUrl).toBe('https://certificates.example.com/taylor-react-cert.pdf');
    });

    it('should reject invalid proofUrl format with 400 Bad Request', async () => {
      const res = await request(app)
        .put(`/api/learning/progress/${beginnerResource._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          progressPercentage: 100,
          proofUrl: 'not-a-valid-url'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('Invalid proofUrl format');
    });
  });

  describe('5. Quick-Wins & Effort-Adjusted Recommendations', () => {
    it('should return quick-win learning resources (duration <= 10 hours, beginner difficulty)', async () => {
      const res = await request(app)
        .get('/api/recommendations/quick-wins')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quickWins.length).toBeGreaterThanOrEqual(1);

      const quickWin = res.body.data.quickWins[0];
      expect(quickWin.isQuickWin).toBe(true);
      expect(quickWin.durationHours).toBeLessThanOrEqual(10);
      expect(quickWin.difficulty).toBe('beginner');
    });
  });
});
