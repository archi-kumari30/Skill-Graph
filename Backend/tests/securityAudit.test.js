const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const UserSkill = require('../src/models/UserSkill');
const Job = require('../src/models/Job');
const Company = require('../src/models/Company');
const JobApplication = require('../src/models/JobApplication');
const AuditLog = require('../src/models/AuditLog');
const auditService = require('../src/services/auditService');

describe('Module 13: Security Hardening, RBAC & Audit Logging Tests', () => {
  let studentUser;
  let secondStudentUser;
  let managerUser;

  let studentToken;
  let secondStudentToken;
  let managerToken;

  let testSkill;
  let testCompany;
  let testJob;

  beforeEach(async () => {
    // 1. Register student 1
    const stu1Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Audit Student One',
        email: `stu1_${Date.now()}@test.com`,
        password: 'password123',
        accountRole: 'student'
      });
    studentToken = stu1Res.body.data.token;
    studentUser = stu1Res.body.data.user;

    // 2. Register student 2
    const stu2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Audit Student Two',
        email: `stu2_${Date.now()}@test.com`,
        password: 'password123',
        accountRole: 'student'
      });
    secondStudentToken = stu2Res.body.data.token;
    secondStudentUser = stu2Res.body.data.user;

    // 3. Register manager
    const mgrRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Audit Manager',
        email: `mgr_${Date.now()}@test.com`,
        password: 'password123',
        accountRole: 'manager'
      });
    managerToken = mgrRes.body.data.token;
    managerUser = mgrRes.body.data.user;

    // 4. Seed Skill, Company, Job
    testSkill = await Skill.create({
      name: 'Cybersecurity',
      category: 'Security'
    });

    testCompany = await Company.create({
      name: 'SecureNet Systems',
      industry: 'Cybersecurity'
    });

    testJob = await Job.create({
      companyId: testCompany._id,
      title: 'Security Analyst',
      requirements: [{ skillId: testSkill._id, requiredProficiency: 3, importance: 'required' }]
    });
  });

  describe('1. Audit Logging of Privileged Administrative Operations', () => {
    it('should create an AuditLog entry when a manager reviews a skill verification', async () => {
      // Student submits verification
      const userSkill = await UserSkill.create({
        userId: studentUser._id,
        skillId: testSkill._id,
        proficiency: 3,
        verificationStatus: 'pending',
        proofUrl: 'https://credentials.example.com/verify/123'
      });

      // Manager reviews verification
      const reviewRes = await request(app)
        .put(`/api/skills/verifications/${userSkill._id}/review`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ decision: 'verified', notes: 'Valid cryptographic certification verified.' });

      expect(reviewRes.statusCode).toBe(200);

      // Verify AuditLog was recorded
      const log = await AuditLog.findOne({
        action: 'SKILL_VERIFICATION_REVIEW',
        targetEntity: 'UserSkill',
        targetId: userSkill._id.toString()
      });

      expect(log).not.toBeNull();
      expect(log.actorId.toString()).toBe(managerUser._id.toString());
      expect(log.changes.decision).toBe('verified');
    });

    it('should create an AuditLog entry when a manager updates a job application status', async () => {
      // Student applies
      const application = await JobApplication.create({
        userId: studentUser._id,
        jobId: testJob._id,
        resumeUrl: 'https://resumes.example.com/student1.pdf',
        status: 'applied'
      });

      // Manager updates candidate status
      const statusRes = await request(app)
        .put(`/api/jobs/applications/${application._id}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'screening' });

      expect(statusRes.statusCode).toBe(200);

      // Verify AuditLog was recorded
      const log = await AuditLog.findOne({
        action: 'JOB_APPLICATION_STATUS_UPDATE',
        targetEntity: 'JobApplication',
        targetId: application._id.toString()
      });

      expect(log).not.toBeNull();
      expect(log.actorId.toString()).toBe(managerUser._id.toString());
      expect(log.changes.oldStatus).toBe('applied');
      expect(log.changes.newStatus).toBe('screening');
    });

    it('should automatically redact sensitive fields (passwords, tokens, keys) in audit logging', async () => {
      const sensitiveData = {
        name: 'Security Test',
        password: 'supersecretpassword',
        token: 'eyJhGciOi...',
        refreshToken: 'rf_token_value',
        apiKey: 'secret_key_value'
      };

      const clean = auditService.sanitizeChanges(sensitiveData);
      expect(clean.password).toBe('[REDACTED]');
      expect(clean.token).toBe('[REDACTED]');
      expect(clean.refreshToken).toBe('[REDACTED]');
      expect(clean.apiKey).toBe('[REDACTED]');
      expect(clean.name).toBe('Security Test');
    });
  });

  describe('2. RBAC Enforcement & Privilege Escalation Prevention', () => {
    it('should block students from reviewing verifications with 403 Forbidden', async () => {
      const userSkill = await UserSkill.create({
        userId: studentUser._id,
        skillId: testSkill._id,
        proficiency: 3,
        verificationStatus: 'pending'
      });

      const res = await request(app)
        .put(`/api/skills/verifications/${userSkill._id}/review`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ decision: 'verified' });

      expect(res.statusCode).toBe(403);
    });

    it('should block students from updating application status to non-withdrawn with 403 Forbidden', async () => {
      const application = await JobApplication.create({
        userId: studentUser._id,
        jobId: testJob._id,
        status: 'applied'
      });

      const res = await request(app)
        .put(`/api/jobs/applications/${application._id}/status`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'offered' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('3. Multi-Tenant User Isolation & Data Protection', () => {
    it('should prevent student 1 from updating or deleting student 2 user skill relation', async () => {
      const stu2Skill = await UserSkill.create({
        userId: secondStudentUser._id,
        skillId: testSkill._id,
        proficiency: 2
      });

      // Student 1 attempts to delete Student 2 skill relation
      const res = await request(app)
        .delete(`/api/users/${secondStudentUser._id}/skills/${testSkill._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect([401, 403, 404]).toContain(res.statusCode);

      // Verify skill was NOT deleted
      const stillExists = await UserSkill.findById(stu2Skill._id);
      expect(stillExists).not.toBeNull();
    });

    it('should never expose password hash in user query responses', async () => {
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(meRes.statusCode).toBe(200);
      expect(meRes.body.data.user.password).toBeUndefined();
    });

    it('should reject malformed or fake JWT tokens with 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(res.statusCode).toBe(401);
    });
  });
});
