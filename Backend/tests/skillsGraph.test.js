const request = require('supertest');
const app = require('../src/app');
const Skill = require('../src/models/Skill');
const SkillRelationship = require('../src/models/SkillRelationship');
const { wouldCreateCycle } = require('../src/utils/graphValidation');

describe('Module 05: Skills Taxonomy & Graph Engine Integration Tests', () => {
  let adminToken;
  let studentToken;

  let skillA;
  let skillB;
  let skillC;
  let skillD;

  beforeEach(async () => {
    // 1. Seed Skills A, B, C, D
    skillA = await Skill.create({ name: 'Skill A', category: 'Programming' });
    skillB = await Skill.create({ name: 'Skill B', category: 'Programming' });
    skillC = await Skill.create({ name: 'Skill C', category: 'Programming' });
    skillD = await Skill.create({ name: 'Skill D', category: 'Programming' });

    // 2. Register Admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin Graph Master',
        email: 'admin.graph@test.com',
        password: 'password123',
        accountRole: 'admin',
        department: 'IT'
      });
    adminToken = adminRes.body.data.token;

    // 3. Register Student
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student Learner',
        email: 'student.graph@test.com',
        password: 'password123',
        accountRole: 'student',
        college: 'Tech University'
      });
    studentToken = studentRes.body.data.token;
  });

  describe('1. Directed Acyclic Graph (DAG) Cycle Detection', () => {
    it('should detect and reject direct circular prerequisites (A -> B, then B -> A)', async () => {
      // 1. Create A -> B
      const res1 = await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillA._id,
          targetSkillId: skillB._id,
          relationshipType: 'prerequisite'
        });
      expect(res1.statusCode).toBe(201);

      // 2. Attempt B -> A (would close cycle A -> B -> A)
      const res2 = await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillB._id,
          targetSkillId: skillA._id,
          relationshipType: 'prerequisite'
        });

      expect(res2.statusCode).toBe(400);
      expect(res2.body.success).toBe(false);
      expect(res2.body.error.message).toContain('circular dependency cycle detected');
    });

    it('should detect and reject multi-hop circular prerequisites (A -> B -> C -> D, then D -> A)', async () => {
      // Create chain A -> B -> C -> D
      await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillA._id,
          targetSkillId: skillB._id,
          relationshipType: 'prerequisite'
        });

      await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillB._id,
          targetSkillId: skillC._id,
          relationshipType: 'prerequisite'
        });

      await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillC._id,
          targetSkillId: skillD._id,
          relationshipType: 'prerequisite'
        });

      // Attempt D -> A (would close cycle A -> B -> C -> D -> A)
      const res = await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillD._id,
          targetSkillId: skillA._id,
          relationshipType: 'prerequisite'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('circular dependency cycle detected');

      // Verify directly with utility
      const check = await wouldCreateCycle(skillD._id, skillA._id);
      expect(check.hasCycle).toBe(true);
    });

    it('should permit valid diamond branching in prerequisite DAG (A -> B, A -> C, B -> D, C -> D)', async () => {
      // A -> B
      const r1 = await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillA._id,
          targetSkillId: skillB._id,
          relationshipType: 'prerequisite'
        });
      expect(r1.statusCode).toBe(201);

      // A -> C
      const r2 = await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillA._id,
          targetSkillId: skillC._id,
          relationshipType: 'prerequisite'
        });
      expect(r2.statusCode).toBe(201);

      // B -> D
      const r3 = await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillB._id,
          targetSkillId: skillD._id,
          relationshipType: 'prerequisite'
        });
      expect(r3.statusCode).toBe(201);

      // C -> D
      const r4 = await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillC._id,
          targetSkillId: skillD._id,
          relationshipType: 'prerequisite'
        });
      expect(r4.statusCode).toBe(201);
    });

    it('should reject self-referential relationships (A -> A)', async () => {
      const res = await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillA._id,
          targetSkillId: skillA._id,
          relationshipType: 'prerequisite'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('cannot have a relationship with itself');
    });

    it('should permit mutual relationships for non-prerequisite edge types (related, specialization)', async () => {
      // Related A -> B
      const r1 = await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillA._id,
          targetSkillId: skillB._id,
          relationshipType: 'related'
        });
      expect(r1.statusCode).toBe(201);

      // Related B -> A
      const r2 = await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillB._id,
          targetSkillId: skillA._id,
          relationshipType: 'related'
        });
      expect(r2.statusCode).toBe(201);
    });
  });

  describe('2. Cascading Skill Deletion and Edge Cleanup', () => {
    it('should cascade delete all associated relationships when a skill is removed', async () => {
      // Create relationships connected to skillA
      await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillA._id,
          targetSkillId: skillB._id,
          relationshipType: 'related'
        });

      await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceSkillId: skillC._id,
          targetSkillId: skillA._id,
          relationshipType: 'related'
        });

      // Delete skillA
      const delRes = await request(app)
        .delete(`/api/skills/${skillA._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.statusCode).toBe(200);

      // Verify no remaining relationships reference skillA
      const remainingEdges = await SkillRelationship.find({
        $or: [{ sourceSkillId: skillA._id }, { targetSkillId: skillA._id }]
      });
      expect(remainingEdges.length).toBe(0);
    });
  });

  describe('3. Skill Graph RBAC Restrictions', () => {
    it('should block standard students from creating global skill catalog entries', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Global Rust',
          category: 'Programming',
          isPersonal: false
        });

      expect(res.statusCode).toBe(403);
    });

    it('should block standard students from creating graph relationship edges', async () => {
      const res = await request(app)
        .post('/api/skill-graph/relationships')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          sourceSkillId: skillA._id,
          targetSkillId: skillB._id,
          relationshipType: 'prerequisite'
        });

      expect(res.statusCode).toBe(403);
    });

    it('should allow student to query the entire skill graph', async () => {
      const res = await request(app)
        .get('/api/skill-graph')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('nodes');
      expect(res.body.data).toHaveProperty('edges');
    });
  });
});
