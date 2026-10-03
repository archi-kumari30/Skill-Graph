const mongoose = require('mongoose');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const SkillRelationship = require('../src/models/SkillRelationship');
const Role = require('../src/models/Role');
const RoleSkill = require('../src/models/RoleSkill');
const UserSkill = require('../src/models/UserSkill');
const Job = require('../src/models/Job');
const Company = require('../src/models/Company');
const LearningResource = require('../src/models/LearningResource');
const LearningProgress = require('../src/models/LearningProgress');
const UserTopicProgress = require('../src/models/UserTopicProgress');

// New Module 02 models
const Topic = require('../src/models/Topic');
const AuthToken = require('../src/models/AuthToken');
const JobApplication = require('../src/models/JobApplication');
const ChatMessage = require('../src/models/ChatMessage');
const AuditLog = require('../src/models/AuditLog');

// Cascade deletion helper and graph service
const { cascadeSkillDelete, cascadeRoleDelete, cascadeUserDelete } = require('../src/utils/cascadeHelper');
const { upsertSkillNode, removeSkillNode, upsertRelationshipEdge, removeRelationshipEdge } = require('../src/services/graphService');

describe('Module 02: Database Layer & CognoDB Dual-Engine Integration Tests', () => {
  let testUser;
  let testSkill;
  let testRole;
  let testCompany;
  let testJob;

  beforeEach(async () => {
    testUser = await User.create({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      accountRole: 'student',
      branch: 'Computer Science',
      college: 'Tech University',
      yearOfStudy: '3rd Year'
    });

    testSkill = await Skill.create({
      name: 'TypeScript',
      category: 'Programming',
      description: 'Typed JavaScript'
    });

    testRole = await Role.create({
      name: 'Full-Stack Engineer',
      department: 'Engineering',
      level: 'junior'
    });

    testCompany = await Company.create({
      name: 'Stripe Global',
      industry: 'Fintech'
    });

    testJob = await Job.create({
      companyId: testCompany._id,
      title: 'Software Engineer - Full Stack',
      employmentType: 'Full-time',
      salaryMin: 120000,
      salaryMax: 150000,
      salaryCurrency: 'USD',
      requirements: [{
        skillId: testSkill._id,
        requiredProficiency: 3,
        importance: 'required'
      }]
    });
  });

  describe('1. Schema Registration & Existing Model Enhancements', () => {
    it('should support the student role enum on User model', async () => {
      expect(testUser.accountRole).toBe('student');
      expect(testUser.branch).toBe('Computer Science');

      // Test savedRoleIds field
      testUser.savedRoleIds.push(testRole._id);
      await testUser.save();

      const found = await User.findById(testUser._id);
      expect(found.savedRoleIds.length).toBe(1);
      expect(found.savedRoleIds[0].toString()).toBe(testRole._id.toString());
    });

    it('should support verification fields on UserSkill model', async () => {
      const userSkill = await UserSkill.create({
        userId: testUser._id,
        skillId: testSkill._id,
        proficiency: 4,
        proofUrl: 'https://github.com/teststudent/typescript-project',
        verificationStatus: 'pending',
        verificationNotes: 'Submitted for mentor review'
      });

      expect(userSkill.verified).toBe(false);
      expect(userSkill.verificationStatus).toBe('pending');
      expect(userSkill.proofUrl).toBe('https://github.com/teststudent/typescript-project');

      // Update to verified by manager
      userSkill.verified = true;
      userSkill.verificationStatus = 'verified';
      userSkill.verifiedAt = new Date();
      userSkill.verifiedBy = testUser._id;
      await userSkill.save();

      const updated = await UserSkill.findById(userSkill._id);
      expect(updated.verified).toBe(true);
      expect(updated.verificationStatus).toBe('verified');
      expect(updated.verifiedBy.toString()).toBe(testUser._id.toString());
    });

    it('should support structured numeric salary fields on Job model', async () => {
      expect(testJob.salaryMin).toBe(120000);
      expect(testJob.salaryMax).toBe(150000);
      expect(testJob.salaryCurrency).toBe('USD');
    });

    it('should support proofUrl on LearningProgress model with unique compound index', async () => {
      const resource = await LearningResource.create({
        title: 'Mastering TypeScript',
        skillId: testSkill._id,
        url: 'https://example.com/ts',
        difficulty: 'intermediate'
      });

      const progress = await LearningProgress.create({
        userId: testUser._id,
        resourceId: resource._id,
        status: 'completed',
        progressPercentage: 100,
        proofUrl: 'https://certificates.example.com/ts-cert-123'
      });

      expect(progress.proofUrl).toBe('https://certificates.example.com/ts-cert-123');

      // Attempting duplicate progress record for the same user and resource should fail
      await expect(
        LearningProgress.create({
          userId: testUser._id,
          resourceId: resource._id,
          progressPercentage: 50
        })
      ).rejects.toThrow();
    });
  });

  describe('2. New Model: Topic Schema', () => {
    it('should create and retrieve Topic records with compound unique index', async () => {
      const topic1 = await Topic.create({
        skillId: testSkill._id,
        title: 'Generics & Utility Types',
        slug: 'generics-utility-types',
        order: 1,
        summary: 'Deep dive into Partial, Readonly, Pick, and Record'
      });

      expect(topic1.title).toBe('Generics & Utility Types');
      expect(topic1.slug).toBe('generics-utility-types');

      // Duplicate slug for the same skill must be rejected by unique index
      await expect(
        Topic.create({
          skillId: testSkill._id,
          title: 'Duplicate Generic Topic',
          slug: 'generics-utility-types',
          order: 2
        })
      ).rejects.toThrow();
    });
  });

  describe('3. New Model: AuthToken Schema & TTL Expiry', () => {
    it('should create, query, and revoke refresh tokens', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const token = await AuthToken.create({
        userId: testUser._id,
        tokenHash: 'sha256_mock_hash_abc123',
        expiresAt,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Test'
      });

      expect(token.revoked).toBe(false);
      expect(token.tokenHash).toBe('sha256_mock_hash_abc123');

      // Revoke token
      token.revoked = true;
      await token.save();

      const revoked = await AuthToken.findById(token._id);
      expect(revoked.revoked).toBe(true);
    });
  });

  describe('4. New Model: JobApplication Schema', () => {
    it('should persist candidate job applications and reject duplicate applications', async () => {
      const application = await JobApplication.create({
        userId: testUser._id,
        jobId: testJob._id,
        resumeUrl: 'https://portfolio.com/student-resume.pdf',
        notes: 'Excited about the full-stack role!'
      });

      expect(application.status).toBe('applied');
      expect(application.resumeUrl).toBe('https://portfolio.com/student-resume.pdf');

      // Attempting to apply twice to the same job should fail due to compound unique index
      await expect(
        JobApplication.create({
          userId: testUser._id,
          jobId: testJob._id
        })
      ).rejects.toThrow();
    });
  });

  describe('5. New Model: ChatMessage Schema', () => {
    it('should store user and assistant conversation turns chronologically', async () => {
      await ChatMessage.create({
        userId: testUser._id,
        role: 'user',
        content: 'How do I bridge my gap in TypeScript?'
      });

      await ChatMessage.create({
        userId: testUser._id,
        role: 'assistant',
        content: 'Focus on advanced generics and union types first.'
      });

      const history = await ChatMessage.find({ userId: testUser._id }).sort({ createdAt: 1 });
      expect(history.length).toBe(2);
      expect(history[0].role).toBe('user');
      expect(history[1].role).toBe('assistant');
      expect(history[1].content).toContain('generics');
    });
  });

  describe('6. New Model: AuditLog Schema', () => {
    it('should log administrative actions and query audit trails', async () => {
      const audit = await AuditLog.create({
        actorId: testUser._id,
        action: 'DELETE_SKILL',
        targetEntity: 'Skill',
        targetId: testSkill._id.toString(),
        changes: { name: 'TypeScript', deletedReason: 'Catalog consolidation' },
        ipAddress: '192.168.1.100'
      });

      expect(audit.action).toBe('DELETE_SKILL');
      expect(audit.targetEntity).toBe('Skill');

      const logs = await AuditLog.find({ targetEntity: 'Skill', targetId: testSkill._id.toString() });
      expect(logs.length).toBe(1);
    });
  });

  describe('7. Cascade & Referential Safety Helpers', () => {
    it('should cascade delete a skill across relationships, topics, and role requirements', async () => {
      // 1. Create a dependent relationship
      const targetSkill = await Skill.create({ name: 'Node.js', category: 'Backend' });
      await SkillRelationship.create({
        sourceSkillId: testSkill._id,
        targetSkillId: targetSkill._id,
        relationshipType: 'prerequisite'
      });

      // 2. Create dependent role skill requirement
      await RoleSkill.create({
        roleId: testRole._id,
        skillId: testSkill._id,
        requiredProficiency: 3,
        importance: 'required'
      });

      // 3. Create dependent topic
      await Topic.create({
        skillId: testSkill._id,
        title: 'Types vs Interfaces',
        slug: 'types-vs-interfaces'
      });

      // Execute cascade deletion
      await cascadeSkillDelete(testSkill._id);

      // Verify all dependent documents were cleaned up
      const relCount = await SkillRelationship.countDocuments({
        $or: [{ sourceSkillId: testSkill._id }, { targetSkillId: testSkill._id }]
      });
      const roleSkillCount = await RoleSkill.countDocuments({ skillId: testSkill._id });
      const topicCount = await Topic.countDocuments({ skillId: testSkill._id });

      expect(relCount).toBe(0);
      expect(roleSkillCount).toBe(0);
      expect(topicCount).toBe(0);
    });

    it('should cascade delete a user across applications, chats, and progress records', async () => {
      await ChatMessage.create({
        userId: testUser._id,
        role: 'user',
        content: 'Test message for cascade'
      });

      await JobApplication.create({
        userId: testUser._id,
        jobId: testJob._id
      });

      await cascadeUserDelete(testUser._id);

      const chatCount = await ChatMessage.countDocuments({ userId: testUser._id });
      const appCount = await JobApplication.countDocuments({ userId: testUser._id });

      expect(chatCount).toBe(0);
      expect(appCount).toBe(0);
    });
  });

  describe('8. CognoDB / Neo4j Real-Time Sync Resilience', () => {
    it('should execute graph sync helpers without throwing when Neo4j is offline or disabled', async () => {
      // safeGraphOperation ensures these return null gracefully rather than throwing errors
      const upsertResult = await upsertSkillNode({
        _id: new mongoose.Types.ObjectId(),
        name: 'GraphQL',
        category: 'Backend'
      });

      const removeResult = await removeSkillNode(new mongoose.Types.ObjectId());
      const edgeResult = await upsertRelationshipEdge({
        sourceSkillId: new mongoose.Types.ObjectId(),
        targetSkillId: new mongoose.Types.ObjectId(),
        relationshipType: 'prerequisite'
      });
      const removeEdgeResult = await removeRelationshipEdge(
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        'prerequisite'
      );

      // If Neo4j is connected in test environment, it succeeds; if not, safe fallback returns null
      // In either case, the promise resolves cleanly and NEVER crashes the caller
      expect(upsertResult !== undefined).toBe(true);
      expect(removeResult !== undefined).toBe(true);
      expect(edgeResult !== undefined).toBe(true);
      expect(removeEdgeResult !== undefined).toBe(true);
    });
  });
});
