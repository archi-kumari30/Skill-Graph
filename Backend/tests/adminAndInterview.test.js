const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Job = require('../src/models/Job');
const Company = require('../src/models/Company');
const JobApplication = require('../src/models/JobApplication');
const InterviewQuestion = require('../src/models/InterviewQuestion');
const UserInterviewProgress = require('../src/models/UserInterviewProgress');
const { generateToken } = require('../src/services/authService');


describe('Admin Management & Interview Preparation Suite', () => {
  let adminUser, adminToken;
  let recruiterUser, recruiterToken;
  let studentUser, studentToken;
  let testJob;
  let testQuestion;

  beforeEach(async () => {
    const timestamp = `${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 1. Create Admin
    adminUser = await User.create({
      name: 'System Admin Test',
      email: `admin_${timestamp}@skillgraph.com`,
      password: 'password123',
      accountRole: 'admin',
      department: 'IT'
    });
    adminToken = generateToken(adminUser._id, 'admin');

    // 2. Create Recruiter
    recruiterUser = await User.create({
      name: 'Tech Recruiter Test',
      email: `recruiter_${timestamp}@skillgraph.com`,
      password: 'password123',
      accountRole: 'recruiter',
      company: 'Tech Talent Inc'
    });
    recruiterToken = generateToken(recruiterUser._id, 'recruiter');

    // 3. Create Student
    studentUser = await User.create({
      name: 'Test Student',
      email: `student_${timestamp}@skillgraph.com`,
      password: 'password123',
      accountRole: 'student',
      department: 'Engineering'
    });
    studentToken = generateToken(studentUser._id, 'student');


    // 4. Create Company & Job
    const company = await Company.create({
      name: `Test Corp ${timestamp}`,
      description: 'Testing company'
    });

    testJob = await Job.create({
      companyId: company._id,
      recruiterId: recruiterUser._id,
      title: 'Full Stack Test Engineer',
      description: 'Test position',
      location: 'Remote',
      status: 'Active',
      employmentType: 'Full-time',
      experienceLevel: 'Mid'
    });

    // 5. Create Job Application
    await JobApplication.create({
      userId: studentUser._id,
      jobId: testJob._id,
      fullName: studentUser.name,
      email: studentUser.email,
      status: 'applied',
      matchScore: 85
    });

    // 6. Create Interview Question
    testQuestion = await InterviewQuestion.create({
      domain: 'Frontend',
      technology: 'JavaScript',
      topic: 'Event Loop',
      difficulty: 'Intermediate',
      question: `What is the microtask queue? ${timestamp}`,
      answer: 'The microtask queue handles promises and queueMicrotask callbacks.',
      keyPoints: ['Promises execute before macrotasks'],
      order: 1
    });
  });

  describe('Admin Platform Governance API (/api/admin)', () => {
    it('should reject unauthorized or student access with 403', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to retrieve platform stats', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalStudents).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalRecruiters).toBeGreaterThanOrEqual(1);
      expect(res.body.data.applicationStatusMap).toBeDefined();
    });

    it('should list enrolled students with readiness and verified skill counts', async () => {
      const res = await request(app)
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const foundStudent = res.body.data.find(s => s._id.toString() === studentUser._id.toString());
      expect(foundStudent).toBeDefined();
      expect(foundStudent.email).toBe(studentUser.email);
    });

    it('should list recruiters with job counts and total applicants', async () => {
      const res = await request(app)
        .get('/api/admin/recruiters')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const foundRecruiter = res.body.data.find(r => r._id.toString() === recruiterUser._id.toString());
      expect(foundRecruiter).toBeDefined();
      expect(foundRecruiter.company).toBe('Tech Talent Inc');
    });

    it('should toggle student account activation status', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${studentUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);

      // Re-enable
      const reactivate = await request(app)
        .patch(`/api/admin/users/${studentUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });

      expect(reactivate.status).toBe(200);
      expect(reactivate.body.data.isActive).toBe(true);
    });
  });

  describe('Recruiter Dashboard API (/api/dashboard/recruiter)', () => {
    it('should return recruiter metrics and pipeline for recruiter token', async () => {
      const res = await request(app)
        .get('/api/dashboard/recruiter')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalJobs).toBeGreaterThanOrEqual(1);
      expect(res.body.data.totalApplicants).toBeGreaterThanOrEqual(1);
      expect(res.body.data.pipeline).toBeDefined();
      expect(res.body.data.recentApplications.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Interview Preparation API (/api/interview-prep)', () => {
    it('should retrieve list of interview questions with mastery stats', async () => {
      const res = await request(app)
        .get('/api/interview-prep')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.questions).toBeDefined();
      expect(res.body.data.stats).toBeDefined();
    });

    it('should toggle question mastered status for authenticated user', async () => {
      const res = await request(app)
        .post(`/api/interview-prep/${testQuestion._id}/toggle-mastered`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isMastered).toBe(true);

      // Toggle off
      const res2 = await request(app)
        .post(`/api/interview-prep/${testQuestion._id}/toggle-mastered`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.isMastered).toBe(false);
    });
  });
});
