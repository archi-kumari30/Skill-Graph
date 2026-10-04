const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const Role = require('../src/models/Role');
const RoleSkill = require('../src/models/RoleSkill');
const Question = require('../src/models/Question');
const Assessment = require('../src/models/Assessment');
const UserSkill = require('../src/models/UserSkill');
const Project = require('../src/models/Project');
const DailyActivity = require('../src/models/DailyActivity');

describe('Assessments, Projects & Career Evidence Suite', () => {
  let authToken;
  let testUser;
  let testSkill;
  let testRole;
  let testAssessment;
  let testQuestion;

  beforeEach(async () => {
    // 1. Create and authenticate user with unique email
    const uniqueEmail = `candidate_${Date.now()}_${Math.random().toString(36).substring(7)}@skillgraph.io`;
    testUser = await User.create({
      name: 'Career Candidate',
      email: uniqueEmail,
      password: 'password123',
      accountRole: 'student'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: 'password123'
      });

    authToken = loginRes.body.data?.token || loginRes.body.data?.accessToken;

    // 2. Create Skill and Role
    testSkill = await Skill.create({
      name: 'TypeScript',
      category: 'Programming',
      description: 'Typed superset of JavaScript'
    });

    testRole = await Role.create({
      name: 'Full Stack Engineer',
      department: 'Engineering',
      level: 'mid',
      description: 'End to end product builder'
    });

    await RoleSkill.create({
      roleId: testRole._id,
      skillId: testSkill._id,
      requiredProficiency: 3,
      importance: 'required'
    });

    // 3. Create Question and Assessment
    testQuestion = await Question.create({
      skillId: testSkill._id,
      prompt: 'What keyword defines a compile-time static type in TypeScript?',
      options: [
        { id: 'a', text: 'type' },
        { id: 'b', text: 'package' },
        { id: 'c', text: 'dynamic' },
        { id: 'd', text: 'label' }
      ],
      correctOptionId: 'a',
      explanation: 'The `type` alias keyword allows declaring custom types in TypeScript.',
      difficulty: 'intermediate'
    });

    testAssessment = await Assessment.create({
      title: 'TypeScript Core Competency',
      description: 'Validate type-safety and interfaces',
      skillId: testSkill._id,
      difficulty: 'intermediate',
      passingScore: 70,
      timeLimitMinutes: 10,
      questions: [testQuestion._id]
    });
  });

  describe('Skill Assessments API (/api/assessments)', () => {
    it('should list all active assessments', async () => {
      const res = await request(app)
        .get('/api/assessments');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toBe('TypeScript Core Competency');
    });

    it('should retrieve single assessment and hide correct answers from test taker', async () => {
      const res = await request(app)
        .get(`/api/assessments/${testAssessment._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('TypeScript Core Competency');
      expect(res.body.data.questions).toBeDefined();
      expect(res.body.data.questions[0].prompt).toBe(testQuestion.prompt);

      // Verify security: correctOptionId and explanation MUST NOT be exposed
      expect(res.body.data.questions[0].correctOptionId).toBeUndefined();
      expect(res.body.data.questions[0].explanation).toBeUndefined();
    });

    it('should evaluate submission, score correctly, and grant verified status when passed', async () => {
      const submitRes = await request(app)
        .post(`/api/assessments/${testAssessment._id}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [
            {
              questionId: testQuestion._id.toString(),
              selectedOptionId: 'a' // Correct option
            }
          ]
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.success).toBe(true);
      expect(submitRes.body.data.score).toBe(100);
      expect(submitRes.body.data.passed).toBe(true);
      expect(submitRes.body.data.answers[0].isCorrect).toBe(true);

      // Verify UserSkill is now verified in MongoDB
      const verifiedSkill = await UserSkill.findOne({
        userId: testUser._id,
        skillId: testSkill._id
      });

      expect(verifiedSkill).not.toBeNull();
      expect(verifiedSkill.verified).toBe(true);
      expect(verifiedSkill.verificationStatus).toBe('verified');
      expect(verifiedSkill.proficiency).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Project Evidence API (/api/projects)', () => {
    it('should create a project linked to proven skills', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Distributed Event Bus',
          description: 'High-throughput event queue with WebSocket streaming',
          technologies: ['TypeScript', 'Node.js', 'Redis'],
          skillsUsed: [testSkill._id.toString()],
          githubUrl: 'https://github.com/candidate/event-bus',
          liveUrl: 'https://event-bus.dev',
          difficulty: 'advanced'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Distributed Event Bus');
      expect(res.body.data.skillsUsed[0].name).toBe('TypeScript');
    });

    it('should retrieve current user project portfolio', async () => {
      await Project.create({
        userId: testUser._id,
        title: 'Cloud Task Runner',
        description: 'Serverless task orchestration engine',
        skillsUsed: [testSkill._id]
      });

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Cloud Task Runner');
    });
  });

  describe('Daily Study Activity API (/api/activity)', () => {
    it('should log a study practice session', async () => {
      const res = await request(app)
        .post('/api/activity')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Practiced Type Gymnastics & Generics',
          details: 'Built conditional types and template literal types',
          minutesSpent: 45
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.minutesSpent).toBe(45);
    });

    it('should retrieve streak and 7-day study output stats', async () => {
      const today = new Date().toISOString().split('T')[0];
      await DailyActivity.create({
        userId: testUser._id,
        date: today,
        activityType: 'practice_session',
        title: 'Built TypeScript REST Endpoints',
        minutesSpent: 60
      });

      const res = await request(app)
        .get('/api/activity')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.streak).toBeGreaterThanOrEqual(1);
      expect(res.body.data.hoursThisWeek).toBeGreaterThanOrEqual(1);
      expect(res.body.data.last7Days).toHaveLength(7);
    });
  });

  describe('Career Onboarding & Command Center API', () => {
    it('should complete onboarding flow and persist target role & skills', async () => {
      const res = await request(app)
        .post('/api/users/onboarding')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetRoleId: testRole._id.toString(),
          experienceLevel: 'intermediate',
          weeklyStudyHours: 15,
          primaryFocus: 'TypeScript & Cloud Backend',
          skills: [
            {
              skillId: testSkill._id.toString(),
              proficiency: 3
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.onboardingCompleted).toBe(true);
      expect(updatedUser.weeklyStudyHours).toBe(15);
      expect(updatedUser.targetRoleId.toString()).toBe(testRole._id.toString());
    });

    it('should return aggregated Command Center payload with readiness metrics', async () => {
      // Set user target role
      await User.findByIdAndUpdate(testUser._id, {
        targetRoleId: testRole._id,
        onboardingCompleted: true
      });

      const res = await request(app)
        .get('/api/dashboard/command-center')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.quickStats).toBeDefined();
      expect(res.body.data.quickStats.readinessScore).toBeDefined();
    });
  });
});
