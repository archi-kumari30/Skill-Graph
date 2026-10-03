const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const Company = require('../src/models/Company');
const Job = require('../src/models/Job');
const UserSkill = require('../src/models/UserSkill');
const JobApplication = require('../src/models/JobApplication');

describe('Module 08: Job Matching, Applications & Market Analytics Tests', () => {
  let studentToken;
  let studentUser;
  let managerToken;
  let managerUser;

  let jsSkill;
  let reactSkill;
  let techCompany;
  let juniorDevJob;
  let seniorDevJob;

  beforeEach(async () => {
    // 1. Seed Skills
    jsSkill = await Skill.create({ name: 'JavaScript', category: 'Programming' });
    reactSkill = await Skill.create({ name: 'React', category: 'Frontend' });

    // 2. Seed Company
    techCompany = await Company.create({
      name: 'Acme Cloud Innovations',
      industry: 'Software',
      location: 'San Francisco, CA (Remote)'
    });

    // 3. Seed Jobs with requirements and structured salary
    juniorDevJob = await Job.create({
      companyId: techCompany._id,
      title: 'Junior Web Developer',
      description: 'Build web UIs with React and modern JavaScript',
      location: 'Remote',
      employmentType: 'Full-time',
      experienceLevel: 'Junior',
      salaryMin: 70000,
      salaryMax: 90000,
      salaryCurrency: 'USD',
      requirements: [
        { skillId: jsSkill._id, requiredProficiency: 3, importance: 'required' },
        { skillId: reactSkill._id, requiredProficiency: 3, importance: 'required' }
      ]
    });

    seniorDevJob = await Job.create({
      companyId: techCompany._id,
      title: 'Lead Architect',
      description: 'Scale micro-frontends and distributed systems',
      location: 'New York, NY',
      employmentType: 'Full-time',
      experienceLevel: 'Senior',
      salaryMin: 150000,
      salaryMax: 180000,
      salaryCurrency: 'USD',
      requirements: [
        { skillId: jsSkill._id, requiredProficiency: 5, importance: 'required' }
      ]
    });

    // 4. Register Manager
    const mgrRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hiring Lead',
        email: 'lead@acme.com',
        password: 'password123',
        accountRole: 'manager'
      });
    managerToken = mgrRes.body.data.token;
    managerUser = mgrRes.body.data.user;

    // 5. Register Student
    const stuRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alex Coder',
        email: 'alex.coder@test.com',
        password: 'password123',
        accountRole: 'student'
      });
    studentToken = stuRes.body.data.token;
    studentUser = stuRes.body.data.user;

    // Student has JavaScript at proficiency 1 (beginner) and React at proficiency 4 (proficient)
    await UserSkill.create({
      userId: studentUser._id,
      skillId: jsSkill._id,
      proficiency: 1
    });
    await UserSkill.create({
      userId: studentUser._id,
      skillId: reactSkill._id,
      proficiency: 4
    });
  });

  describe('1. Job Catalog & Structured Salary Filtering', () => {
    it('should retrieve catalog of jobs populated with company info via GET /api/jobs', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.jobs.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.jobs[0].companyId).toBeDefined();
      expect(res.body.data.jobs[0].companyId.name).toBe('Acme Cloud Innovations');
    });

    it('should filter jobs by minimum salary via ?minSalary=100000', async () => {
      const res = await request(app)
        .get('/api/jobs?minSalary=100000')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.jobs.length).toBe(1);
      expect(res.body.data.jobs[0].title).toBe('Lead Architect');
    });

    it('should filter jobs by maximum salary via ?maxSalary=100000', async () => {
      const res = await request(app)
        .get('/api/jobs?maxSalary=100000')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.jobs.length).toBe(1);
      expect(res.body.data.jobs[0].title).toBe('Junior Web Developer');
    });

    it('should return 404 for invalid job ID query', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/jobs/${fakeId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.message).toContain('Job not found');
    });
  });

  describe('2. Proficiency-Weighted Skill Matching', () => {
    it('should calculate proficiency-weighted match score (beginner proficiency receives partial 50% credit)', async () => {
      const res = await request(app)
        .get('/api/jobs/matches')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const matches = res.body.data.matches;

      // Find Junior Web Developer job
      const juniorMatch = matches.find(m => m.jobId.toString() === juniorDevJob._id.toString());
      expect(juniorMatch).toBeDefined();

      // Calculation:
      // JS proficiency 1 (>=1 and <3): score = 0.5
      // React proficiency 4 (>=3): score = 1.0
      // Total score = 1.5 / 2 = 75%
      expect(juniorMatch.matchScore).toBe(75);
      expect(juniorMatch.matchedSkills).toBe(1); // React mastered
      expect(juniorMatch.skillsToImprove).toBe(1); // JS needs improvement
    });
  });

  describe('3. In-App Application Tracking & Lifecycle', () => {
    it('should allow student to submit an application to a job', async () => {
      const res = await request(app)
        .post(`/api/jobs/${juniorDevJob._id}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          resumeUrl: 'https://storage.example.com/alex-resume.pdf',
          notes: 'Passionate about frontend development and React architecture.'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.application.status).toBe('applied');
      expect(res.body.data.application.resumeUrl).toBe('https://storage.example.com/alex-resume.pdf');
    });

    it('should reject duplicate applications to the same job with 409 Conflict', async () => {
      // First application
      await request(app)
        .post(`/api/jobs/${juniorDevJob._id}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ resumeUrl: 'https://storage.example.com/resume.pdf' });

      // Duplicate application
      const res = await request(app)
        .post(`/api/jobs/${juniorDevJob._id}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ resumeUrl: 'https://storage.example.com/resume.pdf' });

      expect(res.statusCode).toBe(409);
      expect(res.body.error.message).toContain('already applied');
    });

    it('should reject application with invalid resume URL with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/jobs/${juniorDevJob._id}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ resumeUrl: 'not-a-valid-url' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('Invalid resumeUrl format');
    });

    it('should retrieve student personal applications via GET /api/jobs/my-applications', async () => {
      await request(app)
        .post(`/api/jobs/${juniorDevJob._id}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ resumeUrl: 'https://storage.example.com/resume.pdf' });

      const res = await request(app)
        .get('/api/jobs/my-applications')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.applications.length).toBe(1);
      expect(res.body.data.applications[0].jobId.title).toBe('Junior Web Developer');
    });

    it('should allow student to withdraw application, but reject unauthorized status promotion', async () => {
      const applyRes = await request(app)
        .post(`/api/jobs/${juniorDevJob._id}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ resumeUrl: 'https://storage.example.com/resume.pdf' });
      const applicationId = applyRes.body.data.application._id;

      // Student tries to promote self to 'offered' -> 403 Forbidden
      const hackRes = await request(app)
        .put(`/api/jobs/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'offered' });
      expect(hackRes.statusCode).toBe(403);

      // Student withdraws application -> 200 OK
      const withdrawRes = await request(app)
        .put(`/api/jobs/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'withdrawn' });
      expect(withdrawRes.statusCode).toBe(200);
      expect(withdrawRes.body.data.application.status).toBe('withdrawn');
    });

    it('should allow manager to transition application status to interviewing', async () => {
      const applyRes = await request(app)
        .post(`/api/jobs/${juniorDevJob._id}/apply`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ resumeUrl: 'https://storage.example.com/resume.pdf' });
      const applicationId = applyRes.body.data.application._id;

      const reviewRes = await request(app)
        .put(`/api/jobs/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'interviewing' });

      expect(reviewRes.statusCode).toBe(200);
      expect(reviewRes.body.data.application.status).toBe('interviewing');
    });
  });

  describe('4. Dynamic Market Analytics', () => {
    it('should aggregate top required skills, average salary, and remote percentage via GET /api/jobs/analytics', async () => {
      const res = await request(app)
        .get('/api/jobs/analytics')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const analytics = res.body.data.analytics;

      expect(analytics.totalOpenings).toBeGreaterThanOrEqual(2);
      expect(analytics.topSkills.length).toBeGreaterThanOrEqual(2);
      expect(analytics.topSkills[0].count).toBeDefined();
      expect(analytics.avgSalary).toBeGreaterThan(0);
      expect(analytics.remotePercentage).toBeGreaterThanOrEqual(50);
    });
  });
});
