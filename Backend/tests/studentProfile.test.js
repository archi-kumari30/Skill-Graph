const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const Role = require('../src/models/Role');
const UserSkill = require('../src/models/UserSkill');

describe('Module 04: Student Profile & Verification Integration Tests', () => {
  let studentUser;
  let managerUser;
  let adminUser;

  let studentToken;
  let managerToken;
  let adminToken;

  let testSkill;
  let testRole1;
  let testRole2;

  beforeEach(async () => {
    // 1. Seed Roles
    testRole1 = await Role.create({
      name: 'Frontend Developer',
      department: 'Engineering',
      level: 'junior'
    });

    testRole2 = await Role.create({
      name: 'Full Stack Engineer',
      department: 'Engineering',
      level: 'mid'
    });

    // 2. Seed Skill
    testSkill = await Skill.create({
      name: 'React.js',
      category: 'Frontend',
      description: 'Component-based UI library'
    });

    // 3. Register Student
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alex Rivera',
        email: 'alex.student@test.com',
        password: 'password123',
        accountRole: 'student',
        branch: 'Computer Science',
        college: 'Apex Engineering College',
        yearOfStudy: '3rd Year'
      });
    studentToken = studentRes.body.data.token;
    studentUser = studentRes.body.data.user;

    // 4. Register Manager
    const managerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Manager Sarah',
        email: 'sarah.manager@test.com',
        password: 'password123',
        accountRole: 'manager',
        department: 'Engineering'
      });
    managerToken = managerRes.body.data.token;
    managerUser = managerRes.body.data.user;

    // 5. Register Admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin Victor',
        email: 'victor.admin@test.com',
        password: 'password123',
        accountRole: 'admin',
        department: 'IT'
      });
    adminToken = adminRes.body.data.token;
    adminUser = adminRes.body.data.user;
  });

  describe('1. Academic Profile Management', () => {
    it('should retrieve student academic profile details via /api/users/profile', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Alex Rivera');
      expect(res.body.data.user.college).toBe('Apex Engineering College');
      expect(res.body.data.user.accountRole).toBe('student');
    });

    it('should allow student to update their academic fields and target role', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          college: 'National University of Technology',
          yearOfStudy: '4th Year',
          targetRoleId: testRole1._id
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.college).toBe('National University of Technology');
      expect(res.body.data.user.yearOfStudy).toBe('4th Year');
      expect(res.body.data.user.targetRoleId.toString()).toBe(testRole1._id.toString());
    });

    it('should allow student to save and remove alternative target roles in savedRoleIds', async () => {
      // 1. Add saved role
      const addRes = await request(app)
        .put('/api/users/profile/saved-roles')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          roleId: testRole2._id,
          action: 'add'
        });

      expect(addRes.statusCode).toBe(200);
      expect(addRes.body.success).toBe(true);
      const savedIds = addRes.body.data.user.savedRoleIds.map((r) =>
        r._id ? r._id.toString() : r.toString()
      );
      expect(savedIds).toContain(testRole2._id.toString());

      // 2. Remove saved role
      const removeRes = await request(app)
        .put('/api/users/profile/saved-roles')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          roleId: testRole2._id,
          action: 'remove'
        });

      expect(removeRes.statusCode).toBe(200);
      const updatedSavedIds = removeRes.body.data.user.savedRoleIds.map((r) =>
        r._id ? r._id.toString() : r.toString()
      );
      expect(updatedSavedIds).not.toContain(testRole2._id.toString());
    });
  });

  describe('2. Skill Verification Submission Pipeline', () => {
    beforeEach(async () => {
      // Add testSkill to student profile
      await request(app)
        .post(`/api/users/${studentUser._id}/skills`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          skillId: testSkill._id,
          proficiency: 4,
          yearsOfExperience: 2
        });
    });

    it('should submit proof of competency and set status to pending', async () => {
      const res = await request(app)
        .post(`/api/skills/my-skills/${testSkill._id}/verify`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          proofUrl: 'https://github.com/alexrivera/react-e-commerce-app',
          notes: 'Built a full-stack shopping platform with React, Redux, and Tailwind.'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userSkill.verificationStatus).toBe('pending');
      expect(res.body.data.userSkill.proofUrl).toBe(
        'https://github.com/alexrivera/react-e-commerce-app'
      );
      expect(res.body.data.userSkill.verified).toBe(false);
    });

    it('should reject invalid proof URL format', async () => {
      const res = await request(app)
        .post(`/api/skills/my-skills/${testSkill._id}/verify`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          proofUrl: 'not-a-valid-http-url'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('valid web URL');
    });

    it('should reject verification for a skill not logged in user inventory', async () => {
      const otherSkill = await Skill.create({
        name: 'Docker',
        category: 'DevOps'
      });

      const res = await request(app)
        .post(`/api/skills/my-skills/${otherSkill._id}/verify`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          proofUrl: 'https://github.com/alexrivera/docker-demo'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.error.message).toContain('Skill not found in user inventory');
    });
  });

  describe('3. Manager & Admin Verification Review', () => {
    let pendingUserSkill;

    beforeEach(async () => {
      // Add skill and submit verification
      await request(app)
        .post(`/api/users/${studentUser._id}/skills`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          skillId: testSkill._id,
          proficiency: 3
        });

      const subRes = await request(app)
        .post(`/api/skills/my-skills/${testSkill._id}/verify`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          proofUrl: 'https://github.com/alexrivera/portfolio',
          notes: 'Certified React developer certificate'
        });

      pendingUserSkill = subRes.body.data.userSkill;
    });

    it('should block regular student from accessing pending verifications queue', async () => {
      const res = await request(app)
        .get('/api/skills/verifications/pending')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should allow manager to view pending verifications queue', async () => {
      const res = await request(app)
        .get('/api/skills/verifications/pending')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verifications.length).toBeGreaterThanOrEqual(1);
      const found = res.body.data.verifications.find(
        (v) => v._id.toString() === pendingUserSkill._id.toString()
      );
      expect(found).toBeDefined();
      expect(found.userId.email).toBe('alex.student@test.com');
    });

    it('should allow manager to approve verification and set verified: true', async () => {
      const res = await request(app)
        .put(`/api/skills/verifications/${pendingUserSkill._id}/review`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          decision: 'verified',
          notes: 'High quality code with tests reviewed by lead architect.'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userSkill.verified).toBe(true);
      expect(res.body.data.userSkill.verificationStatus).toBe('verified');
      expect(res.body.data.userSkill.verifiedBy.toString()).toBe(managerUser._id.toString());
      expect(res.body.data.userSkill.verifiedAt).toBeDefined();

      // Ensure student cannot re-submit proof for already verified skill
      const duplicateRes = await request(app)
        .post(`/api/skills/my-skills/${testSkill._id}/verify`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          proofUrl: 'https://github.com/alexrivera/other-repo'
        });

      expect(duplicateRes.statusCode).toBe(409);
      expect(duplicateRes.body.error.message).toContain('already verified');
    });

    it('should allow manager to reject verification with constructive notes', async () => {
      const res = await request(app)
        .put(`/api/skills/verifications/${pendingUserSkill._id}/review`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          decision: 'rejected',
          notes: 'Repository is missing live demo and test coverage.'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userSkill.verified).toBe(false);
      expect(res.body.data.userSkill.verificationStatus).toBe('rejected');
      expect(res.body.data.userSkill.verificationNotes).toBe(
        'Repository is missing live demo and test coverage.'
      );
    });

    it('should reject invalid decision parameters', async () => {
      const res = await request(app)
        .put(`/api/skills/verifications/${pendingUserSkill._id}/review`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          decision: 'maybe'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain("must strictly be 'verified' or 'rejected'");
    });
  });
});
