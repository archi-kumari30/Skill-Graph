const mongoose = require('mongoose');
const config = require('../config/config');
const Skill = require('../models/Skill');
const SkillRelationship = require('../models/SkillRelationship');
const Role = require('../models/Role');
const RoleSkill = require('../models/RoleSkill');
const LearningResource = require('../models/LearningResource');
const Company = require('../models/Company');
const Job = require('../models/Job');

const run = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(config.mongodbUri);
    console.log('Database connected.');

    // 1. Seed 30 Skills (Idempotent)
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

    const skillMap = {};
    for (const s of skillsToCreate) {
      let skill = await Skill.findOne({ name: s.name });
      if (!skill) {
        skill = await Skill.create(s);
        console.log(`Created skill: ${s.name}`);
      } else {
        skill.category = s.category;
        skill.description = s.description;
        skill.aliases = s.aliases;
        await skill.save();
      }
      skillMap[s.name] = skill._id;
    }

    // 2. Seed 8 Skill Relationships (Idempotent)
    const relationships = [
      { source: 'JavaScript', target: 'React', type: 'prerequisite', strength: 0.9 },
      { source: 'JavaScript', target: 'TypeScript', type: 'related', strength: 0.8 },
      { source: 'Node.js', target: 'Express.js', type: 'prerequisite', strength: 0.9 },
      { source: 'React', target: 'Next.js', type: 'specialization', strength: 0.8 },
      { source: 'Docker', target: 'Kubernetes', type: 'prerequisite', strength: 0.8 },
      { source: 'JavaScript', target: 'Mobile Development', type: 'prerequisite', strength: 0.75 },
      { source: 'Python', target: 'Machine Learning', type: 'prerequisite', strength: 0.9 },
      { source: 'Machine Learning', target: 'Deep Learning', type: 'prerequisite', strength: 0.85 }
    ];

    for (const rel of relationships) {
      const sourceId = skillMap[rel.source];
      const targetId = skillMap[rel.target];
      if (sourceId && targetId) {
        let existing = await SkillRelationship.findOne({
          sourceSkillId: sourceId,
          targetSkillId: targetId,
          relationshipType: rel.type
        });
        if (!existing) {
          await SkillRelationship.create({
            sourceSkillId: sourceId,
            targetSkillId: targetId,
            relationshipType: rel.type,
            strength: rel.strength
          });
          console.log(`Created relationship: ${rel.source} -> ${rel.target} (${rel.type})`);
        }
      }
    }

    // 3. Seed 10 Roles (Idempotent)
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

    const roleMap = {};
    for (const r of rolesToCreate) {
      let role = await Role.findOne({ name: r.name, level: r.level });
      if (!role) {
        role = await Role.create(r);
        console.log(`Created role: ${r.name} (${r.level})`);
      } else {
        role.department = r.department;
        role.description = r.description;
        await role.save();
      }
      roleMap[r.name] = role._id;
    }

    // 4. Seed Role-Skill Requirements (Idempotent)
    const roleSkills = [
      // Frontend Developer
      { role: 'Frontend Developer', skill: 'JavaScript', requiredProficiency: 3, importance: 'required' },
      { role: 'Frontend Developer', skill: 'HTML', requiredProficiency: 3, importance: 'required' },
      { role: 'Frontend Developer', skill: 'CSS', requiredProficiency: 3, importance: 'required' },
      { role: 'Frontend Developer', skill: 'React', requiredProficiency: 3, importance: 'required' },
      { role: 'Frontend Developer', skill: 'Git', requiredProficiency: 2, importance: 'important' },

      // Backend Developer
      { role: 'Backend Developer', skill: 'Node.js', requiredProficiency: 3, importance: 'required' },
      { role: 'Backend Developer', skill: 'Express.js', requiredProficiency: 3, importance: 'required' },
      { role: 'Backend Developer', skill: 'MongoDB', requiredProficiency: 3, importance: 'required' },
      { role: 'Backend Developer', skill: 'SQL', requiredProficiency: 2, importance: 'important' },

      // Full Stack
      { role: 'Full Stack Developer', skill: 'JavaScript', requiredProficiency: 4, importance: 'required' },
      { role: 'Full Stack Developer', skill: 'React', requiredProficiency: 4, importance: 'required' },
      { role: 'Full Stack Developer', skill: 'Node.js', requiredProficiency: 4, importance: 'required' },
      { role: 'Full Stack Developer', skill: 'MongoDB', requiredProficiency: 3, importance: 'required' },

      // DevOps
      { role: 'DevOps Engineer', skill: 'Docker', requiredProficiency: 4, importance: 'required' },
      { role: 'DevOps Engineer', skill: 'Kubernetes', requiredProficiency: 3, importance: 'required' },
      { role: 'DevOps Engineer', skill: 'Git', requiredProficiency: 3, importance: 'required' },

      // Machine Learning
      { role: 'Machine Learning Engineer', skill: 'Python', requiredProficiency: 4, importance: 'required' },
      { role: 'Machine Learning Engineer', skill: 'Machine Learning', requiredProficiency: 4, importance: 'required' },
      { role: 'Machine Learning Engineer', skill: 'Deep Learning', requiredProficiency: 3, importance: 'required' }
    ];

    for (const rs of roleSkills) {
      const roleId = roleMap[rs.role];
      const skillId = skillMap[rs.skill];
      if (roleId && skillId) {
        let existing = await RoleSkill.findOne({ roleId, skillId });
        if (!existing) {
          await RoleSkill.create({
            roleId,
            skillId,
            requiredProficiency: rs.requiredProficiency,
            importance: rs.importance
          });
          console.log(`Created role-skill req: ${rs.role} -> ${rs.skill}`);
        } else {
          existing.requiredProficiency = rs.requiredProficiency;
          existing.importance = rs.importance;
          await existing.save();
        }
      }
    }

    // 5. Seed 10 Companies (Idempotent)
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

    const companyMap = {};
    for (const c of companiesToCreate) {
      let company = await Company.findOne({ name: c.name });
      if (!company) {
        company = await Company.create(c);
        console.log(`Created company: ${c.name}`);
      } else {
        company.description = c.description;
        company.industry = c.industry;
        company.website = c.website;
        company.location = c.location;
        await company.save();
      }
      companyMap[c.name.split(' ')[0]] = company._id;
    }

    // 6. Seed 20 Jobs (Idempotent)
    const jobsToCreate = [
      {
        companyNameKey: 'Google',
        title: 'Backend Engineer (Sample Job)',
        description: 'Design robust web APIs and handle server deployment architectures.',
        location: 'Mountain View, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillName: 'Node.js', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'Express.js', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'MongoDB', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'REST API', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://google.com/jobs'
      },
      {
        companyNameKey: 'Google',
        title: 'Cloud Systems Architect (Sample Job)',
        description: 'Design distributed high-availability GCP and AWS environments.',
        location: 'Sunnyvale, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Lead',
        requirements: [
          { skillName: 'AWS', requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillName: 'GCP', requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillName: 'Docker', requiredProficiency: 3, importance: 'important', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://google.com/jobs'
      },
      {
        companyNameKey: 'Stripe',
        title: 'Frontend Engineer (Sample Job)',
        description: 'Build user-facing payment flows with clean interactive web interfaces.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillName: 'JavaScript', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'HTML', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'CSS', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'React', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://stripe.com/jobs'
      },
      {
        companyNameKey: 'Stripe',
        title: 'Full Stack Engineer (Sample Job)',
        description: 'Develop features across the visual client applications and transaction engines.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillName: 'JavaScript', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'React', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'Node.js', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://stripe.com/jobs'
      },
      {
        companyNameKey: 'Meta',
        title: 'Senior Full Stack Developer (Sample Job)',
        description: 'Deliver scale client interfaces and high-performance backend pipelines.',
        location: 'Menlo Park, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        requirements: [
          { skillName: 'JavaScript', requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillName: 'React', requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillName: 'Node.js', requiredProficiency: 4, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://meta.com/jobs'
      },
      {
        companyNameKey: 'Meta',
        title: 'Machine Learning Engineer (Sample Job)',
        description: 'Train recommendation pipelines and neural models for visual services.',
        location: 'Seattle, WA',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        requirements: [
          { skillName: 'Python', requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillName: 'Machine Learning', requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillName: 'Deep Learning', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://meta.com/jobs'
      },
      {
        companyNameKey: 'Microsoft',
        title: 'DevOps Infrastructure Specialist (Sample Job)',
        description: 'Automate build operations, maintain CI/CD pipelines, and secure servers.',
        location: 'Redmond, WA',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        requirements: [
          { skillName: 'Docker', requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillName: 'Kubernetes', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'Git', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://microsoft.com/jobs'
      },
      {
        companyNameKey: 'Microsoft',
        title: 'QA Test Automation Engineer (Sample Job)',
        description: 'Author unit test frameworks, mock endpoints, and write regression tests.',
        location: 'Redmond, WA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillName: 'Testing', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'JavaScript', requiredProficiency: 2, importance: 'important', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://microsoft.com/jobs'
      },
      {
        companyNameKey: 'Apple',
        title: 'Mobile App Developer (Sample Job)',
        description: 'Develop native iOS applications using React Native layout engines.',
        location: 'Cupertino, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillName: 'Mobile Development', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'JavaScript', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://apple.com/jobs'
      },
      {
        companyNameKey: 'Apple',
        title: 'System Software Architect (Sample Job)',
        description: 'Deliver operating system logic and optimize memory utilization.',
        location: 'Cupertino, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Lead',
        requirements: [
          { skillName: 'Object Oriented Programming', requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillName: 'Data Structures & Algorithms', requiredProficiency: 4, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://apple.com/jobs'
      },
      {
        companyNameKey: 'Netflix',
        title: 'Backend Platform Engineer (Sample Job)',
        description: 'Build high-throughput media ingest services and microservices systems.',
        location: 'Los Gatos, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        requirements: [
          { skillName: 'Node.js', requiredProficiency: 4, importance: 'required', requirementType: 'required' },
          { skillName: 'System Design', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://netflix.com/jobs'
      },
      {
        companyNameKey: 'Netflix',
        title: 'Data Integration Engineer (Sample Job)',
        description: 'Deliver scale analytics pipelines and optimize database query latency.',
        location: 'Los Gatos, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillName: 'SQL', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'DBMS', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://netflix.com/jobs'
      },
      {
        companyNameKey: 'Amazon',
        title: 'Cloud Operations Engineer (Sample Job)',
        description: 'Deploy enterprise server designs and configure routing systems on AWS.',
        location: 'Seattle, WA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillName: 'AWS', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'Docker', requiredProficiency: 2, importance: 'important', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://amazon.com/jobs'
      },
      {
        companyNameKey: 'Amazon',
        title: 'ML Operations Specialist (Sample Job)',
        description: 'Monitor training cycles and deploy model microservices to production cloud.',
        location: 'Palo Alto, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        requirements: [
          { skillName: 'Python', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'Machine Learning', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://amazon.com/jobs'
      },
      {
        companyNameKey: 'Twitter',
        title: 'Security Infrastructure Analyst (Sample Job)',
        description: 'Secure networks from visual intrusion targets and configure firewall policies.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillName: 'Cybersecurity', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://x.com/jobs'
      },
      {
        companyNameKey: 'Twitter',
        title: 'Frontend UI Developer (Sample Job)',
        description: 'Deliver high-performance responsive web layout components.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillName: 'HTML', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'CSS', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://x.com/jobs'
      },
      {
        companyNameKey: 'Airbnb',
        title: 'Full Stack Product Engineer (Sample Job)',
        description: 'Deliver search layouts and optimize inventory reservation endpoints.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillName: 'JavaScript', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'React', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://airbnb.com/jobs'
      },
      {
        companyNameKey: 'Airbnb',
        title: 'Data Science Analyst (Sample Job)',
        description: 'Analyze booking patterns and perform statistical significance testing.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillName: 'Python', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'SQL', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://airbnb.com/jobs'
      },
      {
        companyNameKey: 'Uber',
        title: 'Site Reliability Engineer (Sample Job)',
        description: 'Optimize service delivery and resolve container scaling latencies.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Senior',
        requirements: [
          { skillName: 'Kubernetes', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'Docker', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://uber.com/jobs'
      },
      {
        companyNameKey: 'Uber',
        title: 'Real-time Platform Developer (Sample Job)',
        description: 'Develop low-latency server logic for rider routing systems.',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        experienceLevel: 'Mid',
        requirements: [
          { skillName: 'Java', requiredProficiency: 3, importance: 'required', requirementType: 'required' },
          { skillName: 'Data Structures & Algorithms', requiredProficiency: 3, importance: 'required', requirementType: 'required' }
        ],
        source: 'Internal',
        sourceUrl: 'https://uber.com/jobs'
      }
    ];

    for (const j of jobsToCreate) {
      const companyId = companyMap[j.companyNameKey];
      if (companyId) {
        let job = await Job.findOne({ title: j.title, companyId });
        const requirements = j.requirements.map(req => ({
          skillId: skillMap[req.skillName],
          requiredProficiency: req.requiredProficiency,
          importance: req.importance,
          requirementType: req.requirementType
        })).filter(req => req.skillId !== undefined);

        if (!job) {
          await Job.create({
            companyId,
            title: j.title,
            description: j.description,
            location: j.location,
            employmentType: j.employmentType,
            experienceLevel: j.experienceLevel,
            requirements,
            source: j.source,
            sourceUrl: j.sourceUrl
          });
          console.log(`Created job: ${j.title}`);
        } else {
          job.description = j.description;
          job.location = j.location;
          job.employmentType = j.employmentType;
          job.experienceLevel = j.experienceLevel;
          job.requirements = requirements;
          job.source = j.source;
          job.sourceUrl = j.sourceUrl;
          await job.save();
        }
      }
    }

    // 7. Seed 30 Learning Resources (Idempotent)
    const resources = [
      { title: 'MDN JavaScript Guide', description: 'Core JavaScript manual documentation', skillName: 'JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', difficulty: 'beginner', estimatedHours: 20 },
      { title: 'W3Schools JavaScript Tutorial', description: 'Hands-on programming steps for JS', skillName: 'JavaScript', url: 'https://www.w3schools.com/js/default.asp', difficulty: 'beginner', estimatedHours: 10 },
      { title: 'YouTube JS Full Course', description: 'Comprehensive video on web languages', skillName: 'JavaScript', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', difficulty: 'beginner', estimatedHours: 12 },
      
      { title: 'React Documentation', description: 'Official React docs catalog', skillName: 'React', url: 'https://react.dev/reference/react', difficulty: 'intermediate', estimatedHours: 35 },
      { title: 'W3Schools React Tutorial', description: 'Interactive React components sandbox', skillName: 'React', url: 'https://www.w3schools.com/react/default.asp', difficulty: 'intermediate', estimatedHours: 15 },
      { title: 'YouTube React for Beginners', description: 'Premium visual walk-through', skillName: 'React', url: 'https://www.youtube.com/watch?v=SqcY0GlETPk', difficulty: 'intermediate', estimatedHours: 10 },
      
      { title: 'Node.js Documentation', description: 'Official server runtime directories', skillName: 'Node.js', url: 'https://nodejs.org/en/docs', difficulty: 'intermediate', estimatedHours: 30 },
      { title: 'Next.js App Router Guide', description: 'Official Next framework configs', skillName: 'Next.js', url: 'https://nextjs.org/docs', difficulty: 'advanced', estimatedHours: 18 },
      { title: 'Express API Design Guide', description: 'Official Express web framework parameters', skillName: 'Express.js', url: 'https://expressjs.com', difficulty: 'beginner', estimatedHours: 8 },
      
      { title: 'W3Schools SQL Tutorial', description: 'Relational DB concepts and statements', skillName: 'SQL', url: 'https://www.w3schools.com/sql/default.asp', difficulty: 'beginner', estimatedHours: 10 },
      { title: 'PostgreSQL Manual Docs', description: 'Official Postgres database specs', skillName: 'SQL', url: 'https://www.postgresql.org/docs/', difficulty: 'intermediate', estimatedHours: 25 },
      { title: 'YouTube SQL Tutorial', description: 'Database creation and query fundamentals', skillName: 'SQL', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', difficulty: 'beginner', estimatedHours: 6 },
      
      { title: 'Docker Official Get Started', description: 'Container builder directories', skillName: 'Docker', url: 'https://docs.docker.com/get-started/', difficulty: 'beginner', estimatedHours: 8 },
      { title: 'Kubernetes Interactive Docs', description: 'Orchestration engines reference docs', skillName: 'Kubernetes', url: 'https://kubernetes.io/docs/home/', difficulty: 'advanced', estimatedHours: 24 },
      
      { title: 'DSA by MIT OpenCourseWare', description: 'Data structures & algorithm lecture series', skillName: 'Data Structures & Algorithms', url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/', difficulty: 'intermediate', estimatedHours: 40 },
      { title: 'GeeksforGeeks DSA Catalog', description: 'Visual structures reference library', skillName: 'Data Structures & Algorithms', url: 'https://www.geeksforgeeks.org/data-structures/', difficulty: 'beginner', estimatedHours: 30 },
      { title: 'OOP in Java - W3Schools', description: 'Object oriented designs tutorial', skillName: 'Object Oriented Programming', url: 'https://www.w3schools.com/java/java_oop.asp', difficulty: 'beginner', estimatedHours: 8 },
      
      { title: 'System Design Interview Guide', description: 'Microservices & high-availability designs', skillName: 'System Design', url: 'https://github.com/donnemartin/system-design-primer', difficulty: 'advanced', estimatedHours: 30 },
      { title: 'MongoDB Official University', description: 'NoSQL document database paths', skillName: 'MongoDB', url: 'https://learn.mongodb.com/', difficulty: 'beginner', estimatedHours: 15 },
      
      { title: 'Git Complete Guide - Atlassian', description: 'Version control branch strategies', skillName: 'Git', url: 'https://www.atlassian.com/git', difficulty: 'beginner', estimatedHours: 6 },
      { title: 'TypeScript Handbook', description: 'Static typing for web applications', skillName: 'TypeScript', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', difficulty: 'intermediate', estimatedHours: 12 },
      
      { title: 'Python Docs for Beginners', description: 'Official Python code manual', skillName: 'Python', url: 'https://docs.python.org/3/tutorial/', difficulty: 'beginner', estimatedHours: 15 },
      { title: 'Machine Learning by freeCodeCamp', description: 'Practical ML models with python', skillName: 'Machine Learning', url: 'https://www.freecodecamp.org/news/machine-learning-mean-median-mode/', difficulty: 'intermediate', estimatedHours: 20 },
      
      { title: 'Deep Learning Specialization', description: 'Deep neural networks reference guide', skillName: 'Deep Learning', url: 'https://www.coursera.org/specializations/deep-learning', difficulty: 'advanced', estimatedHours: 50 },
      { title: 'AWS Cloud Practitioner - YouTube', description: 'AWS infrastructure fundamentals video', skillName: 'AWS', url: 'https://www.youtube.com/watch?v=SOTamWNgDKc', difficulty: 'beginner', estimatedHours: 12 },
      { title: 'GCP Cloud Architecture Path', description: 'Google Cloud Platform documentation', skillName: 'GCP', url: 'https://cloud.google.com/docs', difficulty: 'advanced', estimatedHours: 30 },
      
      { title: 'CI/CD Pipelines by GitLab', description: 'Continuous integration configurations manual', skillName: 'CI/CD Pipelines', url: 'https://docs.gitlab.com/ee/ci/', difficulty: 'intermediate', estimatedHours: 10 },
      { title: 'Terraform Get Started - HashiCorp', description: 'Infrastructure as Code tutorials', skillName: 'Terraform', url: 'https://developer.hashicorp.com/terraform/tutorials', difficulty: 'advanced', estimatedHours: 15 },
      { title: 'OWASP Security Guide', description: 'Web application vulnerability prevention', skillName: 'Cybersecurity', url: 'https://owasp.org/www-project-top-ten/', difficulty: 'intermediate', estimatedHours: 12 },
      { title: 'React Native Mobile Developer', description: 'Cross-platform app building with Javascript', skillName: 'Mobile Development', url: 'https://reactnative.dev/docs/getting-started', difficulty: 'intermediate', estimatedHours: 20 }
    ];

    for (const r of resources) {
      const skillId = skillMap[r.skillName];
      if (skillId) {
        let resource = await LearningResource.findOne({ title: r.title, skillId });
        if (!resource) {
          await LearningResource.create({
            title: r.title,
            description: r.description,
            skillId,
            url: r.url,
            difficulty: r.difficulty,
            estimatedHours: r.estimatedHours
          });
          console.log(`Created resource: ${r.title}`);
        } else {
          resource.description = r.description;
          resource.url = r.url;
          resource.difficulty = r.difficulty;
          resource.estimatedHours = r.estimatedHours;
          await resource.save();
        }
      }
    }

    console.log('Safe database seeding completed successfully! 🎉');
  } catch (error) {
    console.error('Safe seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

run();
