const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Skill = require('../src/models/Skill');
const SkillRelationship = require('../src/models/SkillRelationship');
const Company = require('../src/models/Company');
const Job = require('../src/models/Job');
const UserSkill = require('../src/models/UserSkill');
const JobApplication = require('../src/models/JobApplication');
const Topic = require('../src/models/Topic');
const UserTopicProgress = require('../src/models/UserTopicProgress');

describe('Job Requirements, Prerequisite Graph Matching & Guided Learning Paths', () => {
  let employeeToken, employeeUser;
  let managerToken, managerUser;
  let otherEmployeeToken, otherEmployeeUser;

  let jsSkill, reactSkill, advancedReactSkill;
  let dsaSkill, javaSkill;
  let company;
  let softwareEngJob;

  beforeEach(async () => {
    // 1. Create skills
    jsSkill = await Skill.create({ name: 'JavaScript', category: 'Programming' });
    reactSkill = await Skill.create({ name: 'React', category: 'Frontend' });
    advancedReactSkill = await Skill.create({ name: 'Advanced React', category: 'Frontend' });
    javaSkill = await Skill.create({ name: 'Java', category: 'Backend' });
    dsaSkill = await Skill.create({ name: 'DSA', category: 'Computer Science' });

    // 2. Create Skill Relationships:
    // JavaScript -> React -> Advanced React
    await SkillRelationship.create({
      sourceSkillId: jsSkill._id,
      targetSkillId: reactSkill._id,
      relationshipType: 'prerequisite',
      strength: 1.0
    });
    await SkillRelationship.create({
      sourceSkillId: reactSkill._id,
      targetSkillId: advancedReactSkill._id,
      relationshipType: 'prerequisite',
      strength: 1.0
    });

    // 3. Create Company
    company = await Company.create({
      name: 'Microsoft',
      industry: 'Cloud & Enterprise',
      location: 'Bangalore'
    });

    // 4. Create Job with structured requirements
    softwareEngJob = await Job.create({
      companyId: company._id,
      title: 'Software Engineer',
      description: 'Build enterprise cloud applications',
      location: 'Bangalore',
      workMode: 'Hybrid',
      employmentType: 'Full-time',
      experience: '0–2 years',
      salary: '8–12 LPA',
      status: 'Active',
      educationRequirements: {
        degree: 'B.Tech',
        branch: 'Computer Science',
        minGraduationYear: 2024,
        minCgpa: 7.5
      },
      requirements: [
        { skillId: javaSkill._id, expectedProficiency: 4, requiredProficiency: 4, importance: 'required' },
        { skillId: advancedReactSkill._id, expectedProficiency: 4, requiredProficiency: 4, importance: 'required' },
        { skillId: dsaSkill._id, expectedProficiency: 3, requiredProficiency: 3, importance: 'important' }
      ]
    });

    // 5. Create users
    const empRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Learner One',
        email: 'learner1@skillgraph.test',
        password: 'password123',
        accountRole: 'employee'
      });
    employeeToken = empRes.body.data.token;
    employeeUser = empRes.body.data.user;

    const mgrRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Manager Lead',
        email: 'manager1@skillgraph.test',
        password: 'password123',
        accountRole: 'manager'
      });
    managerToken = mgrRes.body.data.token;
    managerUser = mgrRes.body.data.user;

    const otherEmpRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Learner Two',
        email: 'learner2@skillgraph.test',
        password: 'password123',
        accountRole: 'employee'
      });
    otherEmployeeToken = otherEmpRes.body.data.token;
    otherEmployeeUser = otherEmpRes.body.data.user;
  });

  describe('1. RBAC Job Management', () => {
    it('should allow manager to create a job with structured skill requirements', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Full Stack Engineer',
          companyId: company._id,
          location: 'Bangalore',
          workMode: 'Hybrid',
          experience: '1-3 years',
          salary: '10-15 LPA',
          requirements: [
            { skillId: jsSkill._id, expectedProficiency: 4, importance: 'required' },
            { skillId: reactSkill._id, expectedProficiency: 3, importance: 'important' }
          ]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.job.title).toBe('Full Stack Engineer');
      expect(res.body.data.job.requirements.length).toBe(2);
      expect(res.body.data.job.requirements[0].expectedProficiency).toBe(4);
    });

    it('should block employee from creating a job with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          title: 'Unauthorized Job',
          location: 'Remote'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate skill requirements in job creation', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Invalid Job',
          requirements: [
            { skillId: jsSkill._id, expectedProficiency: 3, importance: 'required' },
            { skillId: jsSkill._id, expectedProficiency: 4, importance: 'important' }
          ]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('Duplicate requirement');
    });
  });

  describe('2. Prerequisite Graph Analysis & Blocked Skills Detection', () => {
    it('should identify blocked skill when user lacks prerequisite chain (Advanced React blocked by React which requires JavaScript)', async () => {
      // User has Java at level 4, but NO JavaScript and NO React
      await UserSkill.create({
        userId: employeeUser._id,
        skillId: javaSkill._id,
        proficiency: 4
      });

      const res = await request(app)
        .get(`/api/jobs/${softwareEngJob._id}/match`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const matchData = res.body.data;
      expect(matchData.matchedSkills.some(s => s.name === 'Java')).toBe(true);

      // Advanced React should be detected as blocked because user lacks React and JavaScript
      const blockedAdvReact = matchData.blockedSkills.find(s => s.name === 'Advanced React');
      expect(blockedAdvReact).toBeDefined();
      expect(blockedAdvReact.blockedBy.length).toBeGreaterThan(0);
      expect(blockedAdvReact.blockedBy[0].name).toBe('React');
      expect(blockedAdvReact.blockedBy[0].requires).toContain('JavaScript');
    });

    it('should detect satisfied prerequisites and classify as missing when foundational prerequisites are met', async () => {
      // User meets JavaScript (4) and React (3), but does not have Advanced React (0)
      await UserSkill.create({
        userId: employeeUser._id,
        skillId: jsSkill._id,
        proficiency: 4
      });
      await UserSkill.create({
        userId: employeeUser._id,
        skillId: reactSkill._id,
        proficiency: 3
      });

      const res = await request(app)
        .get(`/api/jobs/${softwareEngJob._id}/match`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      const matchData = res.body.data;

      // Now Advanced React is NOT blocked, but missing with prerequisites satisfied
      const missingAdvReact = matchData.missingSkills.find(s => s.name === 'Advanced React');
      expect(missingAdvReact).toBeDefined();
      expect(missingAdvReact.prerequisitesStatus).toBe('Satisfied');
    });

    it('should calculate partial skill when user has level > 0 but less than expected', async () => {
      await UserSkill.create({
        userId: employeeUser._id,
        skillId: javaSkill._id,
        proficiency: 2 // Required is 4
      });

      const res = await request(app)
        .get(`/api/jobs/${softwareEngJob._id}/match`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      const partialJava = res.body.data.partialSkills.find(s => s.name === 'Java');
      expect(partialJava).toBeDefined();
      expect(partialJava.currentProficiency).toBe(2);
      expect(partialJava.expectedProficiency).toBe(4);
      expect(partialJava.gap).toBe(2);
    });
  });

  describe('3. Topological Learning Path Generation', () => {
    it('should generate topologically ordered chapters where foundational prerequisite comes before dependent skill', async () => {
      // User has no JavaScript, no React, no Advanced React
      const res = await request(app)
        .get(`/api/jobs/${softwareEngJob._id}/learning-path`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const path = res.body.data.learningPath;
      expect(path.chapters.length).toBeGreaterThanOrEqual(3);

      // Verify JavaScript comes before React, and React comes before Advanced React
      const jsIdx = path.chapters.findIndex(c => c.skill.name === 'JavaScript');
      const reactIdx = path.chapters.findIndex(c => c.skill.name === 'React');
      const advReactIdx = path.chapters.findIndex(c => c.skill.name === 'Advanced React');

      expect(jsIdx).toBeGreaterThanOrEqual(0);
      expect(reactIdx).toBeGreaterThanOrEqual(0);
      expect(advReactIdx).toBeGreaterThanOrEqual(0);

      // Strict topological prerequisite sequence
      expect(jsIdx).toBeLessThan(reactIdx);
      expect(reactIdx).toBeLessThan(advReactIdx);

      // Chapters must contain structured topics
      expect(path.chapters[0].topics.length).toBeGreaterThan(0);
      expect(path.chapters[0].topics[0]).toHaveProperty('title');
      expect(path.chapters[0].topics[0]).toHaveProperty('completed');
    });
  });

  describe('4. Job Application Security & Constraints', () => {
    it('should prevent duplicate job applications with 409 Conflict', async () => {
      // 1st application
      const firstRes = await request(app)
        .post(`/api/jobs/${softwareEngJob._id}/apply`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ coverLetter: 'First application' });
      expect(firstRes.statusCode).toBe(201);

      // 2nd duplicate application
      const dupRes = await request(app)
        .post(`/api/jobs/${softwareEngJob._id}/apply`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ coverLetter: 'Duplicate attempt' });
      expect(dupRes.statusCode).toBe(409);
      expect(dupRes.body.error.message).toContain('already applied');
    });

    it('should prevent applying to a closed job with 400 Bad Request', async () => {
      // Manager closes job
      softwareEngJob.status = 'Closed';
      await softwareEngJob.save();

      const res = await request(app)
        .post(`/api/jobs/${softwareEngJob._id}/apply`)
        .set('Authorization', `Bearer ${otherEmployeeToken}`)
        .send({ notes: 'Applying to closed job' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toContain('closed');
    });

    it('should allow employee to view own applications and prevent viewing another employee application', async () => {
      // Employee 1 applies
      const applyRes = await request(app)
        .post(`/api/jobs/${softwareEngJob._id}/apply`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ coverLetter: 'Private application' });
      const appId = applyRes.body.data.application._id;

      // Employee 1 accesses own application via /api/applications/:id
      const ownRes = await request(app)
        .get(`/api/applications/${appId}`)
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(ownRes.statusCode).toBe(200);
      expect(ownRes.body.data.application._id.toString()).toBe(appId.toString());

      // Employee 2 attempts to access Employee 1 application -> 403 Forbidden
      const unauthorizedRes = await request(app)
        .get(`/api/applications/${appId}`)
        .set('Authorization', `Bearer ${otherEmployeeToken}`);
      expect(unauthorizedRes.statusCode).toBe(403);
    });
  });
});
