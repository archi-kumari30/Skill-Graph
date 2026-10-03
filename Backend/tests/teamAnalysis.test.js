const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const Role = require('../src/models/Role');
const RoleSkill = require('../src/models/RoleSkill');
const UserSkill = require('../src/models/UserSkill');

describe('Module 09: Team Capability Analytics, Cohorts & What-If Simulation Tests', () => {
  let adminToken;
  let adminUser;
  let managerToken;
  let managerUser;
  let studentToken;
  let studentUser;

  let engStudent;
  let designStudent;

  let k8sSkill;
  let dockerSkill;
  let devopsRole;

  beforeEach(async () => {
    // 1. Seed Skills
    k8sSkill = await Skill.create({ name: 'Kubernetes', category: 'DevOps' });
    dockerSkill = await Skill.create({ name: 'Docker', category: 'DevOps' });

    // 2. Seed Role with requirements
    devopsRole = await Role.create({
      name: 'Cloud Infrastructure Engineer',
      department: 'Engineering',
      level: 'senior'
    });

    await RoleSkill.create({
      roleId: devopsRole._id,
      skillId: k8sSkill._id,
      requiredProficiency: 4,
      importance: 'required' // weight 3
    });

    await RoleSkill.create({
      roleId: devopsRole._id,
      skillId: dockerSkill._id,
      requiredProficiency: 3,
      importance: 'required' // weight 3
    });

    // 3. Register Admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Dean of Engineering',
        email: 'dean@university.edu',
        password: 'password123',
        accountRole: 'admin',
        department: 'Engineering'
      });
    adminToken = adminRes.body.data.token;
    adminUser = adminRes.body.data.user;

    // 4. Register Manager
    const mgrRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'DevOps Team Lead',
        email: 'lead@university.edu',
        password: 'password123',
        accountRole: 'manager',
        department: 'Engineering'
      });
    managerToken = mgrRes.body.data.token;
    managerUser = mgrRes.body.data.user;

    // 5. Register Student
    const stuRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'General Student',
        email: 'general.student@test.com',
        password: 'password123',
        accountRole: 'student'
      });
    studentToken = stuRes.body.data.token;
    studentUser = stuRes.body.data.user;

    // 6. Register Cohort Members: 1 in Engineering, 1 in Design
    const engRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Engineering Member',
        email: 'eng.member@test.com',
        password: 'password123',
        accountRole: 'student',
        department: 'Engineering',
        branch: 'Computer Science'
      });
    engStudent = engRes.body.data.user;

    const designRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Design Member',
        email: 'design.member@test.com',
        password: 'password123',
        accountRole: 'student',
        department: 'Design',
        branch: 'UI/UX'
      });
    designStudent = designRes.body.data.user;

    // Assign skills:
    // engStudent has Docker at proficiency 3 (satisfies Docker requirement), but 0 in Kubernetes
    await UserSkill.create({
      userId: engStudent._id,
      skillId: dockerSkill._id,
      proficiency: 3
    });
  });

  describe('1. RBAC Authorization Boundaries', () => {
    it('should deny students access to team analytics with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/team/skill-analysis')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should deny students access to role readiness with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/team/role-readiness/${devopsRole._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should deny students access to simulation with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/team/simulate')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          roleId: devopsRole._id,
          hypotheticalChanges: [{ skillId: k8sSkill._id, proficiency: 4 }]
        });

      expect(res.statusCode).toBe(403);
    });

    it('should allow manager to access team analytics and role readiness', async () => {
      const res = await request(app)
        .get(`/api/team/role-readiness/${devopsRole._id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role.name).toBe('Cloud Infrastructure Engineer');
    });
  });

  describe('2. Department & Cohort Filtering', () => {
    it('should filter team analytics by department via ?department=Engineering', async () => {
      const res = await request(app)
        .get('/api/team/skill-analysis?department=Engineering')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // Only users in Engineering (Dean, Lead, engStudent)
      expect(res.body.data.totalUsers).toBe(3);
    });

    it('should return empty structured payload for non-existent cohort without crashing', async () => {
      const res = await request(app)
        .get('/api/team/skill-analysis?department=NonExistentDepartment')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalUsers).toBe(0);
      expect(res.body.data.mostCommonSkills).toEqual([]);
    });
  });

  describe('3. Aggregate Capability & Skill Lead Identification', () => {
    it('should calculate collective readiness score and designate skill lead', async () => {
      const res = await request(app)
        .get(`/api/team/role-readiness/${devopsRole._id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      const data = res.body.data;

      // Role requirements:
      // K8s (weight 3 * 4 = 12), team max = 0
      // Docker (weight 3 * 3 = 9), team max = 3 (engStudent)
      // Total max = 21, Total team score = 9
      // Team readiness = Math.round((9 / 21) * 100) = 43%
      expect(data.teamReadinessScore).toBe(43);
      expect(data.summary.matchedSkills).toBe(1); // Docker met
      expect(data.summary.missingSkills).toBe(1); // K8s missing

      // Verify Skill Lead for Docker is engStudent
      const dockerDetail = data.skills.find(s => s.skill.name === 'Docker');
      expect(dockerDetail.lead).toBeDefined();
      expect(dockerDetail.lead.name).toBe('Engineering Member');
      expect(dockerDetail.lead.proficiency).toBe(3);
    });
  });

  describe('4. Interactive "What-If" Training Simulation', () => {
    it('should simulate training impact, calculate projected score gain and resolved gaps', async () => {
      const res = await request(app)
        .post('/api/team/simulate')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          roleId: devopsRole._id,
          hypotheticalChanges: [
            { skillId: k8sSkill._id, proficiency: 4 }
          ]
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const sim = res.body.data;

      // Baseline was 43%
      expect(sim.baselineReadiness).toBe(43);

      // With K8s at proficiency 4, team now satisfies 100% of requirements:
      // K8s: 4/4 (score 12), Docker: 3/3 (score 9) -> 21/21 = 100%
      expect(sim.projectedReadiness).toBe(100);
      expect(sim.readinessGain).toBe(57);
      expect(sim.resolvedGaps).toContain('Kubernetes');

      // Verify simulation is strictly non-persistent (database unchanged)
      const afterRes = await request(app)
        .get(`/api/team/role-readiness/${devopsRole._id}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(afterRes.body.data.teamReadinessScore).toBe(43);
    });

    it('should validate hypotheticalChanges proficiency bounds (1-5)', async () => {
      const res = await request(app)
        .post('/api/team/simulate')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          roleId: devopsRole._id,
          hypotheticalChanges: [
            { skillId: k8sSkill._id, proficiency: 99 } // Invalid proficiency
          ]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('proficiency between 1 and 5');
    });
  });
});
