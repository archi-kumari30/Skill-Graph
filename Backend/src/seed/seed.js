const mongoose = require('mongoose');
const config = require('../config/config');
const User = require('../models/User');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const SkillRelationship = require('../models/SkillRelationship');
const Role = require('../models/Role');
const RoleSkill = require('../models/RoleSkill');
const LearningResource = require('../models/LearningResource');
const Company = require('../models/Company');
const Job = require('../models/Job');
const LearningProgress = require('../models/LearningProgress');

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
    await Company.deleteMany({});
    await Job.deleteMany({});
    await LearningProgress.deleteMany({});
    console.log('Database cleared.');

    // 2. Create 30 Skills
    console.log('Seeding skills...');
    const skillsToCreate = [
      { name: 'JavaScript', category: 'Programming', description: 'Core language of the web', aliases: ['JS', 'ES6'] },
      { name: 'HTML', category: 'Frontend', description: 'HyperText Markup Language', aliases: ['HTML5'] },
      { name: 'CSS', category: 'Frontend', description: 'Cascading Style Sheets', aliases: ['CSS3', 'Sass'] },
      { name: 'React', category: 'Frontend', description: 'Component-based UI library', aliases: ['ReactJS'] },
      { name: 'Next.js', category: 'Frontend', description: 'React framework for SSR and Static Sites', aliases: ['NextJS'] },
      { name: 'Node.js', category: 'Backend', description: 'JavaScript runtime for server-side code', aliases: ['Node'] },
      { name: 'Express.js', category: 'Backend', description: 'Minimalist web framework for Node', aliases: ['Express'] },
      { name: 'MongoDB', category: 'Database', description: 'Document-oriented NoSQL database', aliases: ['Mongo'] },
      { name: 'SQL', category: 'Database', description: 'Structured Query Language', aliases: ['MySQL', 'PostgreSQL'] },
      { name: 'Git', category: 'Tools', description: 'Distributed version control system', aliases: ['GitHub'] },
      { name: 'Docker', category: 'DevOps', description: 'Containerization engine', aliases: [] },
      { name: 'Kubernetes', category: 'DevOps', description: 'Container orchestration platform', aliases: ['K8s'] },
      { name: 'TypeScript', category: 'Programming', description: 'Typed superset of JavaScript', aliases: ['TS'] },
      { name: 'Python', category: 'Programming', description: 'General-purpose versatile programming language', aliases: ['Py'] },
      { name: 'Java', category: 'Programming', description: 'Class-based object-oriented language', aliases: [] },
      { name: 'REST API', category: 'Architecture', description: 'RESTful API web services design patterns', aliases: ['REST'] },
      { name: 'Testing', category: 'Quality Assurance', description: 'Software quality testing and automation', aliases: ['Jest', 'Selenium'] },
      { name: 'Data Structures & Algorithms', category: 'Computer Science Fundamentals', description: 'Core DSA concepts, trees, graphs, sorting', aliases: ['DSA'] },
      { name: 'Object Oriented Programming', category: 'Computer Science Fundamentals', description: 'OOP concepts, inheritance, polymorphism', aliases: ['OOP'] },
      { name: 'DBMS', category: 'Computer Science Fundamentals', description: 'Database Management System parameters', aliases: [] },
      { name: 'System Design', category: 'Computer Science Fundamentals', description: 'Scalability, microservices, load balancers', aliases: [] },
      { name: 'Machine Learning', category: 'AI / ML', description: 'Supervised and unsupervised learning algos', aliases: ['ML'] },
      { name: 'Deep Learning', category: 'AI / ML', description: 'Neural networks, convolution, transformers', aliases: ['DL'] },
      { name: 'Natural Language Processing', category: 'AI / ML', description: 'Text tokenization, sentiment analysis', aliases: ['NLP'] },
      { name: 'AWS', category: 'Cloud', description: 'Amazon Web Services cloud suite', aliases: [] },
      { name: 'GCP', category: 'Cloud', description: 'Google Cloud Platform environments', aliases: [] },
      { name: 'CI/CD Pipelines', category: 'DevOps', description: 'Continuous integration and delivery configurations', aliases: ['CI/CD'] },
      { name: 'Terraform', category: 'DevOps', description: 'Infrastructure as Code deployment definitions', aliases: [] },
      { name: 'Cybersecurity', category: 'Security', description: 'Network protection and threat mitigation', aliases: [] },
      { name: 'Mobile Development', category: 'Mobile', description: 'React Native mobile application building', aliases: [] }
    ];

    const seededSkills = await Skill.create(skillsToCreate);
    console.log(`Seeded ${seededSkills.length} skills.`);

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
      { sourceSkillId: skillMap['Docker'], targetSkillId: skillMap['Kubernetes'], relationshipType: 'prerequisite', strength: 0.8 },
      { sourceSkillId: skillMap['JavaScript'], targetSkillId: skillMap['Mobile Development'], relationshipType: 'prerequisite', strength: 0.75 },
      { sourceSkillId: skillMap['Python'], targetSkillId: skillMap['Machine Learning'], relationshipType: 'prerequisite', strength: 0.9 },
      { sourceSkillId: skillMap['Machine Learning'], targetSkillId: skillMap['Deep Learning'], relationshipType: 'prerequisite', strength: 0.85 }
    ];
    await SkillRelationship.create(relationships);
    console.log(`Seeded ${relationships.length} skill relationships.`);

    // 4. Create 10 Roles
    console.log('Seeding 10 roles...');
    const rolesToCreate = [
      { name: 'Frontend Developer', department: 'Engineering', level: 'Mid', description: 'Responsible for building client-side web applications' },
      { name: 'Backend Developer', department: 'Engineering', level: 'Mid', description: 'Responsible for server logic, database management, and API design' },
      { name: 'Full Stack Developer', department: 'Engineering', level: 'Senior', description: 'Handles end-to-end delivery of frontend and backend applications' },
      { name: 'DevOps Engineer', department: 'Platform', level: 'Senior', description: 'Manages CI/CD infrastructure, cloud resources, and container orchestrations' },
      { name: 'Cloud Architect', department: 'Platform', level: 'Lead', description: 'Architects cloud environments and microservice infrastructures' },
      { name: 'Data Scientist', department: 'Data', level: 'Mid', description: 'Builds analytical data models and resolves business queries' },
      { name: 'Machine Learning Engineer', department: 'AI', level: 'Senior', description: 'Trains and deploys deep neural networks in production environments' },
      { name: 'Cybersecurity Analyst', department: 'Security', level: 'Mid', description: 'Protects enterprise services from intrusion targets' },
      { name: 'Mobile App Developer', department: 'Engineering', level: 'Mid', description: 'Delivers native iOS/Android client apps using React Native' },
      { name: 'QA Automation Engineer', department: 'Quality Assurance', level: 'Mid', description: 'Builds automated regression testing scripts for APIs and clients' }
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

      // Backend Developer
      { roleId: roleMap['Backend Developer'], skillId: skillMap['Node.js'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['Backend Developer'], skillId: skillMap['Express.js'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['Backend Developer'], skillId: skillMap['MongoDB'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['Backend Developer'], skillId: skillMap['SQL'], requiredProficiency: 2, importance: 'important' },

      // Full Stack
      { roleId: roleMap['Full Stack Developer'], skillId: skillMap['JavaScript'], requiredProficiency: 4, importance: 'required' },
      { roleId: roleMap['Full Stack Developer'], skillId: skillMap['React'], requiredProficiency: 4, importance: 'required' },
      { roleId: roleMap['Full Stack Developer'], skillId: skillMap['Node.js'], requiredProficiency: 4, importance: 'required' },
      { roleId: roleMap['Full Stack Developer'], skillId: skillMap['MongoDB'], requiredProficiency: 3, importance: 'required' },

      // DevOps
      { roleId: roleMap['DevOps Engineer'], skillId: skillMap['Docker'], requiredProficiency: 4, importance: 'required' },
      { roleId: roleMap['DevOps Engineer'], skillId: skillMap['Kubernetes'], requiredProficiency: 3, importance: 'required' },
      { roleId: roleMap['DevOps Engineer'], skillId: skillMap['Git'], requiredProficiency: 3, importance: 'required' },

      // Machine Learning
      { roleId: roleMap['Machine Learning Engineer'], skillId: skillMap['Python'], requiredProficiency: 4, importance: 'required' },
      { roleId: roleMap['Machine Learning Engineer'], skillId: skillMap['Machine Learning'], requiredProficiency: 4, importance: 'required' },
      { roleId: roleMap['Machine Learning Engineer'], skillId: skillMap['Deep Learning'], requiredProficiency: 3, importance: 'required' }
    ];
    await RoleSkill.create(roleSkills);
    console.log(`Seeded ${roleSkills.length} role requirements.`);

    // 6. Seed 30 Learning Resources
    console.log('Seeding 30 learning resources...');
    const resources = [
      { title: 'MDN JavaScript Guide', description: 'Core JavaScript manual documentation', skillId: skillMap['JavaScript'], url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', difficulty: 'beginner', estimatedHours: 20 },
      { title: 'W3Schools JavaScript Tutorial', description: 'Hands-on programming steps for JS', skillId: skillMap['JavaScript'], url: 'https://www.w3schools.com/js/default.asp', difficulty: 'beginner', estimatedHours: 10 },
      { title: 'YouTube JS Full Course', description: 'Comprehensive video on web languages', skillId: skillMap['JavaScript'], url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', difficulty: 'beginner', estimatedHours: 12 },
      
      { title: 'React Documentation', description: 'Official React docs catalog', skillId: skillMap['React'], url: 'https://react.dev/reference/react', difficulty: 'intermediate', estimatedHours: 35 },
      { title: 'W3Schools React Tutorial', description: 'Interactive React components sandbox', skillId: skillMap['React'], url: 'https://www.w3schools.com/react/default.asp', difficulty: 'intermediate', estimatedHours: 15 },
      { title: 'YouTube React for Beginners', description: 'Premium visual walk-through', skillId: skillMap['React'], url: 'https://www.youtube.com/watch?v=SqcY0GlETPk', difficulty: 'intermediate', estimatedHours: 10 },
      
      { title: 'Node.js Documentation', description: 'Official server runtime directories', skillId: skillMap['Node.js'], url: 'https://nodejs.org/en/docs', difficulty: 'intermediate', estimatedHours: 30 },
      { title: 'Next.js App Router Guide', description: 'Official Next framework configs', skillId: skillMap['Next.js'], url: 'https://nextjs.org/docs', difficulty: 'advanced', estimatedHours: 18 },
      { title: 'Express API Design Guide', description: 'Official Express web framework parameters', skillId: skillMap['Express.js'], url: 'https://expressjs.com', difficulty: 'beginner', estimatedHours: 8 },
      
      { title: 'W3Schools SQL Tutorial', description: 'Relational DB concepts and statements', skillId: skillMap['SQL'], url: 'https://www.w3schools.com/sql/default.asp', difficulty: 'beginner', estimatedHours: 10 },
      { title: 'PostgreSQL Manual Docs', description: 'Official Postgres database specs', skillId: skillMap['SQL'], url: 'https://www.postgresql.org/docs/', difficulty: 'intermediate', estimatedHours: 25 },
      { title: 'YouTube SQL Tutorial', description: 'Database creation and query fundamentals', skillId: skillMap['SQL'], url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', difficulty: 'beginner', estimatedHours: 6 },
      
      { title: 'Docker Official Get Started', description: 'Container builder directories', skillId: skillMap['Docker'], url: 'https://docs.docker.com/get-started/', difficulty: 'beginner', estimatedHours: 8 },
      { title: 'Kubernetes Interactive Docs', description: 'Orchestration engines reference docs', skillId: skillMap['Kubernetes'], url: 'https://kubernetes.io/docs/home/', difficulty: 'advanced', estimatedHours: 24 },
      
      { title: 'DSA by MIT OpenCourseWare', description: 'Data structures & algorithm lecture series', skillId: skillMap['Data Structures & Algorithms'], url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/', difficulty: 'intermediate', estimatedHours: 40 },
      { title: 'GeeksforGeeks DSA Catalog', description: 'Visual structures reference library', skillId: skillMap['Data Structures & Algorithms'], url: 'https://www.geeksforgeeks.org/data-structures/', difficulty: 'beginner', estimatedHours: 30 },
      { title: 'OOP in Java - W3Schools', description: 'Object oriented designs tutorial', skillId: skillMap['Object Oriented Programming'], url: 'https://www.w3schools.com/java/java_oop.asp', difficulty: 'beginner', estimatedHours: 8 },
      
      { title: 'System Design Interview Guide', description: 'Microservices & high-availability designs', skillId: skillMap['System Design'], url: 'https://github.com/donnemartin/system-design-primer', difficulty: 'advanced', estimatedHours: 30 },
      { title: 'MongoDB Official University', description: 'NoSQL document database paths', skillId: skillMap['MongoDB'], url: 'https://learn.mongodb.com/', difficulty: 'beginner', estimatedHours: 15 },
      
      { title: 'Git Complete Guide - Atlassian', description: 'Version control branch strategies', skillId: skillMap['Git'], url: 'https://www.atlassian.com/git', difficulty: 'beginner', estimatedHours: 6 },
      { title: 'TypeScript Handbook', description: 'Static typing for web applications', skillId: skillMap['TypeScript'], url: 'https://www.typescriptlang.org/docs/handbook/intro.html', difficulty: 'intermediate', estimatedHours: 12 },
      
      { title: 'Python Docs for Beginners', description: 'Official Python code manual', skillId: skillMap['Python'], url: 'https://docs.python.org/3/tutorial/', difficulty: 'beginner', estimatedHours: 15 },
      { title: 'Machine Learning by freeCodeCamp', description: 'Practical ML models with python', skillId: skillMap['Machine Learning'], url: 'https://www.freecodecamp.org/news/machine-learning-mean-median-mode/', difficulty: 'intermediate', estimatedHours: 20 },
      
      { title: 'Deep Learning Specialization', description: 'Deep neural networks reference guide', skillId: skillMap['Deep Learning'], url: 'https://www.coursera.org/specializations/deep-learning', difficulty: 'advanced', estimatedHours: 50 },
      { title: 'AWS Cloud Practitioner - YouTube', description: 'AWS infrastructure fundamentals video', skillId: skillMap['AWS'], url: 'https://www.youtube.com/watch?v=SOTamWNgDKc', difficulty: 'beginner', estimatedHours: 12 },
      { title: 'GCP Cloud Architecture Path', description: 'Google Cloud Platform documentation', skillId: skillMap['GCP'], url: 'https://cloud.google.com/docs', difficulty: 'advanced', estimatedHours: 30 },
      
      { title: 'CI/CD Pipelines by GitLab', description: 'Continuous integration configurations manual', skillId: skillMap['CI/CD Pipelines'], url: 'https://docs.gitlab.com/ee/ci/', difficulty: 'intermediate', estimatedHours: 10 },
      { title: 'Terraform Get Started - HashiCorp', description: 'Infrastructure as Code tutorials', skillId: skillMap['Terraform'], url: 'https://developer.hashicorp.com/terraform/tutorials', difficulty: 'advanced', estimatedHours: 15 },
      { title: 'OWASP Security Guide', description: 'Web application vulnerability prevention', skillId: skillMap['Cybersecurity'], url: 'https://owasp.org/www-project-top-ten/', difficulty: 'intermediate', estimatedHours: 12 },
      { title: 'React Native Mobile Developer', description: 'Cross-platform app building with Javascript', skillId: skillMap['Mobile Development'], url: 'https://reactnative.dev/docs/getting-started', difficulty: 'intermediate', estimatedHours: 20 }
    ];
    const seededResources = await LearningResource.create(resources);
    console.log(`Seeded ${seededResources.length} learning resources.`);

    const resourceMap = {};
    seededResources.forEach(r => {
      resourceMap[r.title] = r._id;
    });

    // 7. Seed 10 Companies (Sample Opportunities)
    console.log('Seeding 10 companies...');
    const companiesToCreate = [
      { name: 'Google (Sample)', description: 'Search and cloud engineering corporation', industry: 'Technology', website: 'https://google.com', location: 'Mountain View, CA' },
      { name: 'Stripe (Sample)', description: 'Online payment infrastructure platform', industry: 'Fintech', website: 'https://stripe.com', location: 'San Francisco, CA' },
      { name: 'Meta (Sample)', description: 'Social connectivity and VR platforms', industry: 'Social Media', website: 'https://meta.com', location: 'Menlo Park, CA' },
      { name: 'Microsoft (Sample)', description: 'Personal computing and enterprise SaaS', industry: 'Software', website: 'https://microsoft.com', location: 'Redmond, WA' },
      { name: 'Apple (Sample)', description: 'Consumer electronics and operating systems', industry: 'Hardware', website: 'https://apple.com', location: 'Cupertino, CA' },
      { name: 'Netflix (Sample)', description: 'Subscription media streaming network', industry: 'Entertainment', website: 'https://netflix.com', location: 'Los Gatos, CA' },
      { name: 'Amazon (Sample)', description: 'E-commerce and cloud infrastructure', industry: 'Retail', website: 'https://amazon.com', location: 'Seattle, WA' },
      { name: 'Twitter (Sample)', description: 'Microblogging and social networking', industry: 'Social Media', website: 'https://x.com', location: 'San Francisco, CA' },
      { name: 'Airbnb (Sample)', description: 'Lodging and vacation home rental index', industry: 'Travel', website: 'https://airbnb.com', location: 'San Francisco, CA' },
      { name: 'Uber (Sample)', description: 'Ride-sharing and delivery services platform', industry: 'Logistics', website: 'https://uber.com', location: 'San Francisco, CA' }
    ];
    const seededCompanies = await Company.create(companiesToCreate);
    console.log(`Seeded ${seededCompanies.length} companies.`);

    const companyMap = {};
    seededCompanies.forEach(c => {
      companyMap[c.name.split(' ')[0]] = c._id;
    });

    // 8. Seed 20 Jobs (Sample Opportunities with detailed requirements)
    console.log('Seeding 20 jobs...');
    const jobsToCreate = [
      {
        companyId: companyMap['Google'],
        title: 'Backend Engineer (Sample Job)',
        description: 'Design robust web APIs and handle server deployment architectures.',
        location: 'Mountain View, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillId: skillMap['Node.js'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['Express.js'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['MongoDB'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['REST API'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://google.com/jobs'
      },
      {
        companyId: companyMap['Google'],
        title: 'Cloud Systems Architect (Sample Job)',
        description: 'Design distributed high-availability GCP and AWS environments.',
        location: 'Sunnyvale, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Lead',
        requirements: [
          { skillId: skillMap['AWS'], requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['GCP'], requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['Docker'], requiredProficiency: 3, importance: 'important', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://google.com/jobs'
      },
      {
        companyId: companyMap['Stripe'],
        title: 'Frontend Engineer (Sample Job)',
        description: 'Build user-facing payment flows with clean interactive web interfaces.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillId: skillMap['JavaScript'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['HTML'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['CSS'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['React'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://stripe.com/jobs'
      },
      {
        companyId: companyMap['Stripe'],
        title: 'Full Stack Engineer (Sample Job)',
        description: 'Develop features across the visual client applications and transaction engines.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillId: skillMap['JavaScript'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['React'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['Node.js'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://stripe.com/jobs'
      },
      {
        companyId: companyMap['Meta'],
        title: 'Senior Full Stack Developer (Sample Job)',
        description: 'Deliver scale client interfaces and high-performance backend pipelines.',
        location: 'Menlo Park, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        requirements: [
          { skillId: skillMap['JavaScript'], requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['React'], requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['Node.js'], requiredProficiency: 4, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://meta.com/jobs'
      },
      {
        companyId: companyMap['Meta'],
        title: 'Machine Learning Engineer (Sample Job)',
        description: 'Train recommendation pipelines and neural models for visual services.',
        location: 'Seattle, WA',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        requirements: [
          { skillId: skillMap['Python'], requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['Machine Learning'], requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['Deep Learning'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://meta.com/jobs'
      },
      {
        companyId: companyMap['Microsoft'],
        title: 'DevOps Infrastructure Specialist (Sample Job)',
        description: 'Automate build operations, maintain CI/CD pipelines, and secure servers.',
        location: 'Redmond, WA',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        requirements: [
          { skillId: skillMap['Docker'], requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['Kubernetes'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['Git'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://microsoft.com/jobs'
      },
      {
        companyId: companyMap['Microsoft'],
        title: 'QA Test Automation Engineer (Sample Job)',
        description: 'Author unit test frameworks, mock endpoints, and write regression tests.',
        location: 'Redmond, WA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillId: skillMap['Testing'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['JavaScript'], requiredProficiency: 2, importance: 'important', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://microsoft.com/jobs'
      },
      {
        companyId: companyMap['Apple'],
        title: 'Mobile App Developer (Sample Job)',
        description: 'Develop native iOS applications using React Native layout engines.',
        location: 'Cupertino, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillId: skillMap['Mobile Development'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['JavaScript'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://apple.com/jobs'
      },
      {
        companyId: companyMap['Apple'],
        title: 'System Software Architect (Sample Job)',
        description: 'Deliver operating system logic and optimize memory utilization.',
        location: 'Cupertino, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Lead',
        requirements: [
          { skillId: skillMap['Object Oriented Programming'], requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['Data Structures & Algorithms'], requiredProficiency: 4, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://apple.com/jobs'
      },
      {
        companyId: companyMap['Netflix'],
        title: 'Backend Platform Engineer (Sample Job)',
        description: 'Build high-throughput media ingest services and microservices systems.',
        location: 'Los Gatos, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        requirements: [
          { skillId: skillMap['Node.js'], requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['System Design'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://netflix.com/jobs'
      },
      {
        companyId: companyMap['Netflix'],
        title: 'Data Integration Engineer (Sample Job)',
        description: 'Deliver scale analytics pipelines and optimize database query latency.',
        location: 'Los Gatos, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillId: skillMap['SQL'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['DBMS'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://netflix.com/jobs'
      },
      {
        companyId: companyMap['Amazon'],
        title: 'Cloud Operations Engineer (Sample Job)',
        description: 'Deploy enterprise server designs and configure routing systems on AWS.',
        location: 'Seattle, WA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillId: skillMap['AWS'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['Docker'], requiredProficiency: 2, importance: 'important', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://amazon.com/jobs'
      },
      {
        companyId: companyMap['Amazon'],
        title: 'ML Operations Specialist (Sample Job)',
        description: 'Monitor training cycles and deploy model microservices to production cloud.',
        location: 'Palo Alto, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        requirements: [
          { skillId: skillMap['Python'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['Machine Learning'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://amazon.com/jobs'
      },
      {
        companyId: companyMap['Twitter'],
        title: 'Security Infrastructure Analyst (Sample Job)',
        description: 'Secure networks from visual intrusion targets and configure firewall policies.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillId: skillMap['Cybersecurity'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://x.com/jobs'
      },
      {
        companyId: companyMap['Twitter'],
        title: 'Frontend UI Developer (Sample Job)',
        description: 'Deliver high-performance responsive web layout components.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillId: skillMap['HTML'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['CSS'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://x.com/jobs'
      },
      {
        companyId: companyMap['Airbnb'],
        title: 'Full Stack Product Engineer (Sample Job)',
        description: 'Deliver search layouts and optimize inventory reservation endpoints.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillId: skillMap['JavaScript'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['React'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://airbnb.com/jobs'
      },
      {
        companyId: companyMap['Airbnb'],
        title: 'Data Science Analyst (Sample Job)',
        description: 'Analyze booking patterns and perform statistical significance testing.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillId: skillMap['Python'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['SQL'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://airbnb.com/jobs'
      },
      {
        companyId: companyMap['Uber'],
        title: 'Site Reliability Engineer (Sample Job)',
        description: 'Optimize service delivery and resolve container scaling latencies.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        requirements: [
          { skillId: skillMap['Kubernetes'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['Docker'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://uber.com/jobs'
      },
      {
        companyId: companyMap['Uber'],
        title: 'Real-time Platform Developer (Sample Job)',
        description: 'Develop low-latency server logic for rider routing systems.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillId: skillMap['Java'], requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillId: skillMap['Data Structures & Algorithms'], requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://uber.com/jobs'
      }
    ];
    const seededJobs = await Job.create(jobsToCreate);
    console.log(`Seeded ${seededJobs.length} jobs.`);

    // 9. Create Users
    console.log('Seeding users...');
    const users = [
      { name: 'System Admin', email: 'admin@skillgraph.com', password: 'adminpassword', accountRole: 'admin', department: 'IT' },
      { name: 'Engineering Manager', email: 'manager@skillgraph.com', password: 'managerpassword', accountRole: 'manager', department: 'Engineering' },
      { name: 'Alice Smith', email: 'alice@skillgraph.com', password: 'alicepassword', accountRole: 'employee', department: 'Engineering' },
      { name: 'Bob Jones', email: 'bob@skillgraph.com', password: 'bobpassword', accountRole: 'employee', department: 'Engineering' },
      
      // Seed Demo Student Account
      {
        name: 'Demo Student',
        email: 'demo.student@skillgraph.com',
        password: 'SkillGraph@123',
        accountRole: 'employee',
        department: 'Engineering',
        branch: 'Computer Science',
        yearOfStudy: '3rd Year',
        college: 'State Engineering College',
        targetRoleId: roleMap['Frontend Developer']
      }
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

    // 10. Assign User Skills
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
      { userId: userMap['Bob Jones'], skillId: skillMap['Git'], proficiency: 2, yearsOfExperience: 2, source: 'self' },

      // Demo Student Skills
      { userId: userMap['Demo Student'], skillId: skillMap['JavaScript'], proficiency: 3, yearsOfExperience: 2, source: 'self' },
      { userId: userMap['Demo Student'], skillId: skillMap['HTML'], proficiency: 3, yearsOfExperience: 3, source: 'self' },
      { userId: userMap['Demo Student'], skillId: skillMap['CSS'], proficiency: 2, yearsOfExperience: 1, source: 'self' },
      { userId: userMap['Demo Student'], skillId: skillMap['Git'], proficiency: 2, yearsOfExperience: 1, source: 'self' }
    ];
    await UserSkill.create(userSkills);
    console.log(`Assigned ${userSkills.length} user skills.`);

    // 11. Assign Demo Student Learning Progress
    console.log('Seeding learning progress...');
    const progressList = [
      {
        userId: userMap['Demo Student'],
        resourceId: resourceMap['React Documentation'],
        status: 'in_progress',
        progressPercentage: 60,
        startedAt: new Date()
      },
      {
        userId: userMap['Demo Student'],
        resourceId: resourceMap['Node.js Documentation'],
        status: 'in_progress',
        progressPercentage: 20,
        startedAt: new Date()
      },
      {
        userId: userMap['Demo Student'],
        resourceId: resourceMap['MDN JavaScript Guide'],
        status: 'completed',
        progressPercentage: 100,
        startedAt: new Date(),
        completedAt: new Date()
      }
    ];
    await LearningProgress.create(progressList);
    console.log(`Seeded ${progressList.length} progress entries.`);

    console.log('Database seeding completed successfully! 🎉');
  } catch (error) {
    console.error('Seeding database failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seedDB();
