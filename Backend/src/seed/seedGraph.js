require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/config');
const { connectCognoDB, getSession, closeDriver } = require('../config/cognodb');

const Skill = require('../models/Skill');
const SkillRelationship = require('../models/SkillRelationship');
const Role = require('../models/Role');
const RoleSkill = require('../models/RoleSkill');
const LearningResource = require('../models/LearningResource');
const Company = require('../models/Company');
const Job = require('../models/Job');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const UserTopicProgress = require('../models/UserTopicProgress');
const LearningProgress = require('../models/LearningProgress');

const seedGraph = async () => {
  try {
    console.log('Connecting to databases...');
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB connected.');

    const driver = await connectCognoDB();
    if (!driver) {
      console.error('CognoDB connection details are missing. Seeding aborted.');
      process.exit(1);
    }
    console.log('CognoDB connected.');

    const session = getSession();

    // 1. Clear Graph database
    console.log('Clearing CognoDB graph...');
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('CognoDB graph cleared.');

    // 2. Migrate Skills
    console.log('Migrating Skills in batch...');
    const skills = await Skill.find();
    const skillBatch = skills.map(skill => ({
      id: skill._id.toString(),
      name: skill.name,
      category: skill.category,
      description: skill.description || ''
    }));
    if (skillBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MERGE (s:Skill { id: item.id })
         SET s.name = item.name, s.category = item.category, s.description = item.description`,
        { batch: skillBatch }
      );
    }
    console.log(`Migrated ${skills.length} skills.`);

    // 3. Migrate Skill Relationships
    console.log('Migrating Skill Relationships in batch...');
    const relationships = await SkillRelationship.find();
    const prereqBatch = [];
    const relatedBatch = [];
    for (const rel of relationships) {
      const item = {
        sourceId: rel.sourceSkillId.toString(),
        targetId: rel.targetSkillId.toString(),
        strength: rel.strength || 1.0
      };
      if (rel.relationshipType === 'prerequisite') {
        prereqBatch.push(item);
      } else {
        relatedBatch.push(item);
      }
    }
    if (prereqBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MATCH (s1:Skill { id: item.sourceId }), (s2:Skill { id: item.targetId })
         MERGE (s1)-[r:PREREQUISITE_OF]->(s2)
         SET r.strength = item.strength`,
        { batch: prereqBatch }
      );
    }
    if (relatedBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MATCH (s1:Skill { id: item.sourceId }), (s2:Skill { id: item.targetId })
         MERGE (s1)-[r:RELATED_TO]->(s2)
         SET r.strength = item.strength`,
        { batch: relatedBatch }
      );
    }
    console.log(`Migrated ${relationships.length} relationships.`);

    // 4. Migrate Careers (Roles)
    console.log('Migrating Careers in batch...');
    const roles = await Role.find();
    const roleBatch = roles.map(role => ({
      id: role._id.toString(),
      name: role.name,
      department: role.department || '',
      level: role.level || '',
      description: role.description || ''
    }));
    if (roleBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MERGE (c:Career { id: item.id })
         SET c.name = item.name, c.department = item.department, c.level = item.level, c.description = item.description`,
        { batch: roleBatch }
      );
    }
    console.log(`Migrated ${roles.length} careers.`);

    // 5. Migrate Role Requirements
    console.log('Migrating Role requirements in batch...');
    const roleSkills = await RoleSkill.find();
    const roleSkillBatch = roleSkills.map(rs => ({
      roleId: rs.roleId.toString(),
      skillId: rs.skillId.toString(),
      requiredProficiency: rs.requiredProficiency,
      importance: rs.importance
    }));
    if (roleSkillBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MATCH (c:Career { id: item.roleId }), (s:Skill { id: item.skillId })
         MERGE (c)-[r:REQUIRES]->(s)
         SET r.requiredProficiency = item.requiredProficiency, r.importance = item.importance`,
        { batch: roleSkillBatch }
      );
    }
    console.log(`Migrated ${roleSkills.length} career requirements.`);

    // 6. Migrate Companies
    console.log('Migrating Companies in batch...');
    const companies = await Company.find();
    const companyBatch = companies.map(company => ({
      id: company._id.toString(),
      name: company.name,
      description: company.description || '',
      industry: company.industry || '',
      website: company.website || '',
      location: company.location || ''
    }));
    if (companyBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MERGE (c:Company { id: item.id })
         SET c.name = item.name, c.description = item.description, c.industry = item.industry, c.website = item.website, c.location = item.location`,
        { batch: companyBatch }
      );
    }
    console.log(`Migrated ${companies.length} companies.`);

    // 7. Migrate Jobs
    console.log('Migrating Jobs in batch...');
    const jobs = await Job.find();
    const jobBatch = [];
    const jobCompanyBatch = [];
    const jobSkillBatch = [];

    for (const job of jobs) {
      jobBatch.push({
        id: job._id.toString(),
        title: job.title,
        description: job.description || '',
        location: job.location || '',
        employmentType: job.employmentType || '',
        experienceLevel: job.experienceLevel || '',
        salaryRange: job.salaryRange || '',
        source: job.source || '',
        sourceUrl: job.sourceUrl || ''
      });

      if (job.companyId) {
        jobCompanyBatch.push({
          companyId: job.companyId.toString(),
          jobId: job._id.toString()
        });
      }

      for (const req of job.requirements) {
        if (req.skillId) {
          jobSkillBatch.push({
            jobId: job._id.toString(),
            skillId: req.skillId.toString(),
            requiredProficiency: req.requiredProficiency,
            importance: req.importance
          });
        }
      }
    }

    if (jobBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MERGE (j:Job { id: item.id })
         SET j.title = item.title, j.description = item.description, j.location = item.location,
             j.employmentType = item.employmentType, j.experienceLevel = item.experienceLevel,
             j.salaryRange = item.salaryRange, j.source = item.source, j.sourceUrl = item.sourceUrl`,
        { batch: jobBatch }
      );
    }

    if (jobCompanyBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MATCH (c:Company { id: item.companyId }), (j:Job { id: item.jobId })
         MERGE (c)-[:POSTS]->(j)`,
        { batch: jobCompanyBatch }
      );
    }

    if (jobSkillBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MATCH (j:Job { id: item.jobId }), (s:Skill { id: item.skillId })
         MERGE (j)-[r:REQUIRES]->(s)
         SET r.requiredProficiency = item.requiredProficiency, r.importance = item.importance`,
        { batch: jobSkillBatch }
      );
    }
    console.log(`Migrated ${jobs.length} jobs.`);

    // 8. Migrate Learning Resources
    console.log('Migrating Learning Resources in batch...');
    const resources = await LearningResource.find();
    const resourceBatch = [];
    const resourceTeachesBatch = [];

    for (const res of resources) {
      resourceBatch.push({
        id: res._id.toString(),
        title: res.title,
        provider: res.provider || '',
        type: res.type || '',
        url: res.url || '',
        difficulty: res.difficulty || '',
        estimatedHours: res.estimatedHours || 0
      });

      if (res.skillId) {
        resourceTeachesBatch.push({
          resourceId: res._id.toString(),
          skillId: res.skillId.toString()
        });
      }
    }

    if (resourceBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MERGE (lr:LearningResource { id: item.id })
         SET lr.title = item.title, lr.provider = item.provider, lr.type = item.type, lr.url = item.url,
             lr.difficulty = item.difficulty, lr.estimatedHours = item.estimatedHours`,
        { batch: resourceBatch }
      );
    }

    if (resourceTeachesBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MATCH (lr:LearningResource { id: item.resourceId }), (s:Skill { id: item.skillId })
         MERGE (lr)-[:TEACHES]->(s)`,
        { batch: resourceTeachesBatch }
      );
    }
    console.log(`Migrated ${resources.length} learning resources.`);

    // 9. Migrate Users
    console.log('Migrating Users in batch...');
    const users = await User.find();
    const userBatch = [];
    const userTargetBatch = [];

    for (const user of users) {
      userBatch.push({
        id: user._id.toString(),
        name: user.name,
        email: user.email
      });

      if (user.targetRoleId) {
        userTargetBatch.push({
          userId: user._id.toString(),
          careerId: user.targetRoleId.toString()
        });
      }
    }

    if (userBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MERGE (u:User { id: item.id })
         SET u.name = item.name, u.email = item.email`,
        { batch: userBatch }
      );
    }

    if (userTargetBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MATCH (u:User { id: item.userId }), (c:Career { id: item.careerId })
         MERGE (u)-[:TARGETS]->(c)`,
        { batch: userTargetBatch }
      );
    }
    console.log(`Migrated ${users.length} users.`);

    // 10. Migrate User Skills
    console.log('Migrating User Skills in batch...');
    const userSkills = await UserSkill.find();
    const userSkillBatch = [];

    for (const us of userSkills) {
      if (us.skillId) {
        userSkillBatch.push({
          userId: us.userId.toString(),
          skillId: us.skillId.toString(),
          proficiency: us.proficiency,
          yearsOfExperience: us.yearsOfExperience || 0
        });
      }
    }

    if (userSkillBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MATCH (u:User { id: item.userId }), (s:Skill { id: item.skillId })
         MERGE (u)-[h:HAS_SKILL]->(s)
         SET h.proficiency = item.proficiency, h.yearsOfExperience = item.yearsOfExperience`,
        { batch: userSkillBatch }
      );
    }
    console.log(`Migrated ${userSkills.length} user skills.`);

    // 11. Migrate User Topic Progress
    console.log('Migrating Topic Progress in batch...');
    const topicCompletions = await UserTopicProgress.find();
    const topicBatch = [];
    const topicSkillBatch = [];
    const topicUserBatch = [];

    for (const tc of topicCompletions) {
      if (tc.skillId) {
        const item = {
          userId: tc.userId.toString(),
          skillId: tc.skillId.toString(),
          topicTitle: tc.topicTitle
        };
        topicBatch.push(item);
        topicSkillBatch.push(item);
        topicUserBatch.push(item);
      }
    }

    if (topicBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MERGE (t:LearningTopic { title: item.topicTitle, skillId: item.skillId })`,
        { batch: topicBatch }
      );
    }

    if (topicSkillBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MATCH (s:Skill { id: item.skillId }), (t:LearningTopic { title: item.topicTitle, skillId: item.skillId })
         MERGE (s)-[:HAS_TOPIC]->(t)`,
        { batch: topicSkillBatch }
      );
    }

    if (topicUserBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MATCH (u:User { id: item.userId }), (t:LearningTopic { title: item.topicTitle, skillId: item.skillId })
         MERGE (u)-[:COMPLETED]->(t)`,
        { batch: topicUserBatch }
      );
    }
    console.log(`Migrated ${topicCompletions.length} user topic progress records.`);

    // 12. Migrate Learning Progress
    console.log('Migrating Learning Course Progress in batch...');
    const learningProgress = await LearningProgress.find();
    const progressBatch = [];

    for (const lp of learningProgress) {
      if (lp.resourceId) {
        progressBatch.push({
          userId: lp.userId.toString(),
          resourceId: lp.resourceId.toString(),
          status: lp.status,
          progressPercentage: lp.progressPercentage,
          startedAt: lp.startedAt ? lp.startedAt.toISOString() : '',
          completedAt: lp.completedAt ? lp.completedAt.toISOString() : ''
        });
      }
    }

    if (progressBatch.length > 0) {
      await session.run(
        `UNWIND $batch AS item
         MATCH (u:User { id: item.userId }), (r:LearningResource { id: item.resourceId })
         MERGE (u)-[e:ENROLLED_IN]->(r)
         SET e.status = item.status, e.progressPercentage = item.progressPercentage,
             e.startedAt = item.startedAt, e.completedAt = item.completedAt`,
        { batch: progressBatch }
      );
    }
    console.log(`Migrated ${learningProgress.length} course progress records.`);

    console.log('Migration successfully completed.');
    await session.close();
    await closeDriver();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

seedGraph();
