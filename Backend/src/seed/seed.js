const mongoose = require('mongoose');
const config = require('../config/config');
const User = require('../models/User');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const SkillRelationship = require('../models/SkillRelationship');
const Role = require('../models/Role');
const RoleSkill = require('../models/RoleSkill');
const LearningResource = require('../models/LearningResource');

const seedDB = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(config.mongodbUri);
    console.log('Database connected.');

    // 1. Clear database
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Skill.deleteMany({});
    await UserSkill.deleteMany({});
    await SkillRelationship.deleteMany({});
    await Role.deleteMany({});
    await RoleSkill.deleteMany({});
    await LearningResource.deleteMany({});
    console.log('Database cleared.');

    // 2. Create Skills
    console.log('Seeding skills...');
    const skillsToCreate = [
      { name: 'JavaScript', category: 'Programming', description: 'High-level, core language of the web', aliases: ['JS', 'ES6'] },
      { name: 'HTML', category: 'Frontend', description: 'HyperText Markup Language for structural layout', aliases: ['HTML5'] },
      { name: 'CSS', category: 'Frontend', description: 'Cascading Style Sheets for presentation styling', aliases: ['CSS3', 'Sass'] },
      { name: 'React', category: 'Frontend', description: 'Component-based UI library by Meta', aliases: ['ReactJS', 'React.js'] },
      { name: 'Next.js', category: 'Frontend', description: 'React framework for server-side rendering and static generation', aliases: ['NextJS'] },
      { name: 'Node.js', category: 'Backend', description: 'JavaScript runtime for server-side programming', aliases: ['Node'] },
      { name: 'Express.js', category: 'Backend', description: 'Minimalist web application framework for Node.js', aliases: ['Express'] },
      { name: 'MongoDB', category: 'Database', description: 'Document-oriented NoSQL database', aliases: ['Mongo'] },
      { name: 'SQL', category: 'Database', description: 'Structured Query Language for relational databases', aliases: ['MySQL', 'PostgreSQL'] },
      { name: 'Git', category: 'Tools', description: 'Distributed version control system', aliases: ['GitHub', 'GitLab'] },
      { name: 'Docker', category: 'DevOps', description: 'Containerization engine', aliases: ['Containers'] },
      { name: 'Kubernetes', category: 'DevOps', description: 'Container orchestration platform', aliases: ['K8s'] },
      { name: 'TypeScript', category: 'Programming', description: 'Typed superset of JavaScript', aliases: ['TS'] },
      { name: 'Python', category: 'Programming', description: 'General-purpose versatile programming language', aliases: ['Py'] },
      { name: 'Java', category: 'Programming', description: 'Class-based, object-oriented language', aliases: [] },
      { name: 'REST API', category: 'Architecture', description: 'Representational State Transfer web services design pattern', aliases: ['RESTful'] },
      { name: 'Testing', category: 'Quality Assurance', description: 'Software quality testing and test automation', aliases: ['Jest', 'Mocha', 'Cypress'] }
    ];

    const seededSkills = await Skill.create(skillsToCreate);
    console.log(`Seeded ${seededSkills.length} skills.`);

    // Map skill names to ObjectIds for relationships & requirements
    const skillMap = {};
    seededSkills.forEach(s => {
      skillMap[s.name] = s._id;
    });

    // 3. Create Skill Relationships
    console.log('Seeding skill relationships...');
    const relationships = [
      { sourceSkillId: skillMap['JavaScript'], targetSkillId: skillMap['React'], relationshipType: 'prerequisite', strength: 0.9 },
      { sourceSkillId: skillMap['JavaScript'], targetSkillId: skillMap['TypeScript'], relationshipType: 'related', strength: 0.8 },
      { sourceSkillId: skillMap['Node.js'], targetSkillId: skillMap['Express.js'], relationshipType: 'prerequisite', strength: 0.9 },
      { sourceSkillId: skillMap['React'], targetSkillId: skillMap['Next.js'], relationshipType: 'specialization', strength: 0.8 },
      { sourceSkillId: skillMap['JavaScript'], targetSkillId: skillMap['Testing'], relationshipType: 'related', strength: 0.6 },
      { sourceSkillId: skillMap['Docker'], targetSkillId: skillMap['Kubernetes'], relationshipType: 'prerequisite', strength: 0.8 }
    ];
    await SkillRelationship.create(relationships);
    console.log(`Seeded ${relationships.length} skill relationships.`);

    // 4. Create Roles
    console.log('Seeding roles...');
    const rolesToCreate = [
      { name: 'Frontend Developer', department: 'Engineering', level: 'Mid', description: 'Responsible for building client-side web applications' },
      { name: 'Backend Developer', department: 'Engineering', level: 'Mid', description: 'Responsible for server logic, database management, and API design' },
      { name: 'Full Stack Developer', department: 'Engineering', level: 'Senior', description: 'Handles end-to-end delivery of frontend and backend applications' },
      { name: 'DevOps Engineer', department: 'Platform', level: 'Senior', description: 'Manages CI/CD infrastructure, cloud resources, and container orchestrations' }
    ];
    const seededRoles = await Role.create(rolesToCreate);
    console.log(`Seeded ${seededRoles.length} roles.`);

    const roleMap = {};
    seededRoles.forEach(r => {
      roleMap[r.name] = r._id;
    });

    // 5. Create RoleSkill Requirements
    console.log('Seeding role skill requirements...');
    const roleSkills = [
      // Frontend Developer
      { roleId: roleMap['Frontend Developer'], skillId: skillMap['JavaScript'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['Frontend Developer'], skillId: skillMap['HTML'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['Frontend Developer'], skillId: skillMap['CSS'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['Frontend Developer'], skillId: skillMap['React'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['Frontend Developer'], skillId: skillMap['Git'], requiredProficiency: 2, importance: 'important' },
      { roleId: roleMap['Frontend Developer'], skillId: skillMap['TypeScript'], requiredProficiency: 2, importance: 'nice_to_have' },

      // Backend Developer
      { roleId: roleMap['Backend Developer'], skillId: skillMap['Node.js'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['Backend Developer'], skillId: skillMap['Express.js'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['Backend Developer'], skillId: skillMap['MongoDB'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['Backend Developer'], skillId: skillMap['REST API'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['Backend Developer'], skillId: skillMap['SQL'], requiredProficiency: 2, importance: 'important' },
      { roleId: roleMap['Backend Developer'], skillId: skillMap['Git'], requiredProficiency: 2, importance: 'important' },

      // Full Stack Developer
      { roleId: roleMap['Full Stack Developer'], skillId: skillMap['JavaScript'], requiredProficiency: 4, importance: 'required' },
      { roleId: roleMap['Full Stack Developer'], skillId: skillMap['React'], requiredProficiency: 4, importance: 'required' },
      { roleId: roleMap['Full Stack Developer'], skillId: skillMap['Node.js'], requiredProficiency: 4, importance: 'required' },
      { roleId: roleMap['Full Stack Developer'], skillId: skillMap['MongoDB'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['Full Stack Developer'], skillId: skillMap['Git'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['Full Stack Developer'], skillId: skillMap['HTML'], requiredProficiency: 3, importance: 'important' },
      { roleId: roleMap['Full Stack Developer'], skillId: skillMap['CSS'], requiredProficiency: 3, importance: 'important' },
      { roleId: roleMap['Full Stack Developer'], skillId: skillMap['TypeScript'], requiredProficiency: 3, importance: 'important' },

      // DevOps Engineer
      { roleId: roleMap['DevOps Engineer'], skillId: skillMap['Docker'], requiredProficiency: 4, importance: 'required' },
      { roleId: roleMap['DevOps Engineer'], skillId: skillMap['Kubernetes'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['DevOps Engineer'], skillId: skillMap['Git'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['DevOps Engineer'], skillId: skillMap['Python'], requiredProficiency: 3, importance: 'important' }
    ];
    await RoleSkill.create(roleSkills);
    console.log(`Seeded ${roleSkills.length} role skill requirements.`);

    // 6. Create Learning Resources
    console.log('Seeding learning resources...');
    const resources = [
      { title: 'Modern JavaScript From The Beginning', description: 'Excellent course on Javascript fundamentals', skillId: skillMap['JavaScript'], url: 'https://example.com/courses/js-modern', difficulty: 'beginner', estimatedHours: 20 },
      { title: 'React - The Complete Guide (incl Hooks, React Router, Redux)', description: 'Master React.js with projects', skillId: skillMap['React'], url: 'https://example.com/courses/react-complete', difficulty: 'intermediate', estimatedHours: 40 },
      { title: 'Next.js Production Blueprint', description: 'Build enterprise-grade SSR apps with React/Next', skillId: skillMap['Next.js'], url: 'https://example.com/courses/next-blueprint', difficulty: 'advanced', estimatedHours: 15 },
      { title: 'Node.js Developer BootCamp', description: 'Build APIs, deal with auth, databases, deployment', skillId: skillMap['Node.js'], url: 'https://example.com/courses/node-bootcamp', difficulty: 'intermediate', estimatedHours: 35 },
      { title: 'Express API Design & Implementation', description: 'Clean architecture for REST web services', skillId: skillMap['Express.js'], url: 'https://example.com/courses/express-apis', difficulty: 'beginner', estimatedHours: 10 },
      { title: 'Docker Deep Dive', description: 'Learn how containers work, build images, run containers', skillId: skillMap['Docker'], url: 'https://example.com/courses/docker-dive', difficulty: 'beginner', estimatedHours: 12 },
      { title: 'Kubernetes in Action', description: 'Learn to deploy, monitor, and scale apps in production Kubernetes', skillId: skillMap['Kubernetes'], url: 'https://example.com/courses/kubernetes-action', difficulty: 'advanced', estimatedHours: 25 },
      { title: 'TypeScript Masterclass', description: 'Deep dive into advanced typings, interfaces, and decorators', skillId: skillMap['TypeScript'], url: 'https://example.com/courses/ts-masterclass', difficulty: 'intermediate', estimatedHours: 18 }
    ];
    await LearningResource.create(resources);
    console.log(`Seeded ${resources.length} learning resources.`);

    // 7. Create Users (hashes are automatically generated via pre-save hook)
    console.log('Seeding users...');
    const users = [
      { name: 'System Admin', email: 'admin@skillgraph.com', password: 'adminpassword', accountRole: 'admin', department: 'IT' },
      { name: 'Engineering Manager', email: 'manager@skillgraph.com', password: 'managerpassword', accountRole: 'manager', department: 'Engineering' },
      { name: 'Alice Smith', email: 'alice@skillgraph.com', password: 'alicepassword', accountRole: 'employee', department: 'Engineering' },
      { name: 'Bob Jones', email: 'bob@skillgraph.com', password: 'bobpassword', accountRole: 'employee', department: 'Engineering' }
    ];

    const seededUsers = [];
    for (const u of users) {
      const user = await User.create(u);
      seededUsers.push(user);
    }
    console.log(`Seeded ${seededUsers.length} users.`);

    const userMap = {};
    seededUsers.forEach(u => {
      userMap[u.name] = u._id;
    });

    // 8. Assign User Skills
    console.log('Assigning user skills...');
    const userSkills = [
      // Alice (strong frontend, weak/no react)
      { userId: userMap['Alice Smith'], skillId: skillMap['JavaScript'], proficiency: 3, yearsOfExperience: 3, source: 'self' },
      { userId: userMap['Alice Smith'], skillId: skillMap['HTML'], proficiency: 4, yearsOfExperience: 4, source: 'self' },
      { userId: userMap['Alice Smith'], skillId: skillMap['CSS'], proficiency: 3, yearsOfExperience: 3, source: 'self' },
      { userId: userMap['Alice Smith'], skillId: skillMap['React'], proficiency: 1, yearsOfExperience: 0.5, source: 'assessment' },
      { userId: userMap['Alice Smith'], skillId: skillMap['Git'], proficiency: 2, yearsOfExperience: 2, source: 'self' },

      // Bob (strong backend, no express, no react)
      { userId: userMap['Bob Jones'], skillId: skillMap['JavaScript'], proficiency: 3, yearsOfExperience: 2, source: 'self' },
      { userId: userMap['Bob Jones'], skillId: skillMap['Node.js'], proficiency: 3, yearsOfExperience: 2, source: 'self' },
      { userId: userMap['Bob Jones'], skillId: skillMap['SQL'], proficiency: 3, yearsOfExperience: 3, source: 'self' },
      { userId: userMap['Bob Jones'], skillId: skillMap['Git'], proficiency: 2, yearsOfExperience: 2, source: 'self' }
    ];

    await UserSkill.create(userSkills);
    console.log(`Assigned ${userSkills.length} user skills.`);

    console.log('Database seeding completed successfully! 🎉');
  } catch (error) {
    console.error('Seeding database failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seedDB();
