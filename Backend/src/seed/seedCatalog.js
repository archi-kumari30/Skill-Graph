const mongoose = require('mongoose');
const config = require('../config/config');
const Skill = require('../models/Skill');
const SkillRelationship = require('../models/SkillRelationship');
const Role = require('../models/Role');
const RoleSkill = require('../models/RoleSkill');
const LearningResource = require('../models/LearningResource');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Topic = require('../models/Topic');

const runCatalogSeed = async () => {
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
    { name: 'Frontend Developer', department: 'Engineering', level: 'mid', description: 'Responsible for building client-side web applications' },
    { name: 'Backend Developer', department: 'Engineering', level: 'mid', description: 'Responsible for server logic, database management, and API design' },
    { name: 'Full Stack Developer', department: 'Engineering', level: 'senior', description: 'Handles end-to-end delivery of frontend and backend applications' },
    { name: 'DevOps Engineer', department: 'Platform', level: 'senior', description: 'Manages CI/CD infrastructure, cloud resources, and container orchestrations' },
    { name: 'Cloud Architect', department: 'Platform', level: 'senior', description: 'Architects cloud environments and microservice infrastructures' },
    { name: 'Data Scientist', department: 'Data', level: 'mid', description: 'Builds analytical data models and resolves business queries' },
    { name: 'Machine Learning Engineer', department: 'AI', level: 'senior', description: 'Trains and deploys deep neural networks in production environments' },
    { name: 'Cybersecurity Analyst', department: 'Security', level: 'mid', description: 'Protects enterprise services from intrusion targets' },
    { name: 'Mobile App Developer', department: 'Engineering', level: 'mid', description: 'Delivers native iOS/Android client apps using React Native' },
    { name: 'QA Automation Engineer', department: 'Quality Assurance', level: 'mid', description: 'Builds automated regression testing scripts for APIs and clients' }
  ];

  const roleMap = {};
  for (const r of rolesToCreate) {
    let role = await Role.findOne({ name: r.name });
    if (!role) {
      role = await Role.create(r);
      console.log(`Created role: ${r.name} (${r.level})`);
    } else {
      role.level = r.level;
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
    { role: 'Frontend Developer', skill: 'TypeScript', requiredProficiency: 2, importance: 'important' },
    { role: 'Frontend Developer', skill: 'Git', requiredProficiency: 2, importance: 'important' },
    { role: 'Frontend Developer', skill: 'REST API', requiredProficiency: 2, importance: 'important' },

    // Backend Developer
    { role: 'Backend Developer', skill: 'JavaScript', requiredProficiency: 3, importance: 'required' },
    { role: 'Backend Developer', skill: 'Node.js', requiredProficiency: 3, importance: 'required' },
    { role: 'Backend Developer', skill: 'Express.js', requiredProficiency: 3, importance: 'required' },
    { role: 'Backend Developer', skill: 'Python', requiredProficiency: 2, importance: 'important' },
    { role: 'Backend Developer', skill: 'Java', requiredProficiency: 2, importance: 'important' },
    { role: 'Backend Developer', skill: 'REST API', requiredProficiency: 3, importance: 'required' },
    { role: 'Backend Developer', skill: 'SQL', requiredProficiency: 3, importance: 'required' },
    { role: 'Backend Developer', skill: 'MongoDB', requiredProficiency: 3, importance: 'required' },
    { role: 'Backend Developer', skill: 'Git', requiredProficiency: 2, importance: 'important' },
    { role: 'Backend Developer', skill: 'Docker', requiredProficiency: 2, importance: 'important' },

    // Full Stack Developer
    { role: 'Full Stack Developer', skill: 'JavaScript', requiredProficiency: 4, importance: 'required' },
    { role: 'Full Stack Developer', skill: 'React', requiredProficiency: 4, importance: 'required' },
    { role: 'Full Stack Developer', skill: 'Node.js', requiredProficiency: 4, importance: 'required' },
    { role: 'Full Stack Developer', skill: 'MongoDB', requiredProficiency: 3, importance: 'required' },
    { role: 'Full Stack Developer', skill: 'SQL', requiredProficiency: 3, importance: 'required' },
    { role: 'Full Stack Developer', skill: 'REST API', requiredProficiency: 3, importance: 'required' },
    { role: 'Full Stack Developer', skill: 'HTML', requiredProficiency: 3, importance: 'important' },
    { role: 'Full Stack Developer', skill: 'CSS', requiredProficiency: 3, importance: 'important' },
    { role: 'Full Stack Developer', skill: 'Git', requiredProficiency: 3, importance: 'required' },

    // DevOps Engineer
    { role: 'DevOps Engineer', skill: 'Docker', requiredProficiency: 4, importance: 'required' },
    { role: 'DevOps Engineer', skill: 'Kubernetes', requiredProficiency: 3, importance: 'required' },
    { role: 'DevOps Engineer', skill: 'Git', requiredProficiency: 3, importance: 'required' },
    { role: 'DevOps Engineer', skill: 'CI/CD Pipelines', requiredProficiency: 3, importance: 'required' },
    { role: 'DevOps Engineer', skill: 'Terraform', requiredProficiency: 3, importance: 'required' },
    { role: 'DevOps Engineer', skill: 'AWS', requiredProficiency: 3, importance: 'important' },

    // Cloud Architect
    { role: 'Cloud Architect', skill: 'AWS', requiredProficiency: 4, importance: 'required' },
    { role: 'Cloud Architect', skill: 'GCP', requiredProficiency: 4, importance: 'required' },
    { role: 'Cloud Architect', skill: 'Docker', requiredProficiency: 3, importance: 'required' },
    { role: 'Cloud Architect', skill: 'Kubernetes', requiredProficiency: 3, importance: 'required' },
    { role: 'Cloud Architect', skill: 'Terraform', requiredProficiency: 3, importance: 'required' },
    { role: 'Cloud Architect', skill: 'System Design', requiredProficiency: 4, importance: 'required' },

    // Data Scientist
    { role: 'Data Scientist', skill: 'Python', requiredProficiency: 4, importance: 'required' },
    { role: 'Data Scientist', skill: 'SQL', requiredProficiency: 3, importance: 'required' },
    { role: 'Data Scientist', skill: 'DBMS', requiredProficiency: 3, importance: 'important' },
    { role: 'Data Scientist', skill: 'Machine Learning', requiredProficiency: 4, importance: 'required' },
    { role: 'Data Scientist', skill: 'Data Structures & Algorithms', requiredProficiency: 3, importance: 'important' },

    // Machine Learning Engineer
    { role: 'Machine Learning Engineer', skill: 'Python', requiredProficiency: 4, importance: 'required' },
    { role: 'Machine Learning Engineer', skill: 'Machine Learning', requiredProficiency: 4, importance: 'required' },
    { role: 'Machine Learning Engineer', skill: 'Deep Learning', requiredProficiency: 3, importance: 'required' },
    { role: 'Machine Learning Engineer', skill: 'Natural Language Processing', requiredProficiency: 3, importance: 'important' },
    { role: 'Machine Learning Engineer', skill: 'Data Structures & Algorithms', requiredProficiency: 3, importance: 'required' },
    { role: 'Machine Learning Engineer', skill: 'SQL', requiredProficiency: 3, importance: 'important' },
    { role: 'Machine Learning Engineer', skill: 'Git', requiredProficiency: 3, importance: 'important' },

    // Cybersecurity Analyst
    { role: 'Cybersecurity Analyst', skill: 'Cybersecurity', requiredProficiency: 4, importance: 'required' },
    { role: 'Cybersecurity Analyst', skill: 'System Design', requiredProficiency: 3, importance: 'important' },
    { role: 'Cybersecurity Analyst', skill: 'SQL', requiredProficiency: 2, importance: 'important' },
    { role: 'Cybersecurity Analyst', skill: 'Git', requiredProficiency: 2, importance: 'important' },

    // Mobile App Developer
    { role: 'Mobile App Developer', skill: 'Mobile Development', requiredProficiency: 4, importance: 'required' },
    { role: 'Mobile App Developer', skill: 'JavaScript', requiredProficiency: 3, importance: 'required' },
    { role: 'Mobile App Developer', skill: 'React', requiredProficiency: 3, importance: 'required' },
    { role: 'Mobile App Developer', skill: 'REST API', requiredProficiency: 3, importance: 'important' },
    { role: 'Mobile App Developer', skill: 'Git', requiredProficiency: 3, importance: 'important' },

    // QA Automation Engineer
    { role: 'QA Automation Engineer', skill: 'Testing', requiredProficiency: 4, importance: 'required' },
    { role: 'QA Automation Engineer', skill: 'JavaScript', requiredProficiency: 3, importance: 'required' },
    { role: 'QA Automation Engineer', skill: 'Python', requiredProficiency: 3, importance: 'required' },
    { role: 'QA Automation Engineer', skill: 'SQL', requiredProficiency: 3, importance: 'important' },
    { role: 'QA Automation Engineer', skill: 'REST API', requiredProficiency: 3, importance: 'required' },
    { role: 'QA Automation Engineer', skill: 'Git', requiredProficiency: 3, importance: 'important' },
    { role: 'QA Automation Engineer', skill: 'CI/CD Pipelines', requiredProficiency: 2, importance: 'important' }
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

  // 6. Seed Sub-Topics for Key Skills (Idempotent)
  const skillTopics = [
    {
      skillName: 'HTML',
      topics: [
        { title: 'HTML Document Structure & Tags', slug: 'html-basics', order: 1, summary: 'Doctype, head, body, headings, and paragraph elements' },
        { title: 'Semantic Tags & Accessibility', slug: 'semantic-html', order: 2, summary: 'Header, nav, main, section, article, footer, and ARIA labels' },
        { title: 'HTML Forms & Inputs', slug: 'forms-inputs', order: 3, summary: 'Form validation, text inputs, radio, checkboxes, select, and submit' },
        { title: 'Tables & Media Elements', slug: 'tables-media', order: 4, summary: 'Table rows, cells, headers, images, audio, and video' },
        { title: 'Canvas & SVG Graphics', slug: 'canvas-svg', order: 5, summary: '2D pixel drawing context and scalable vector graphics' },
        { title: 'Web Storage & Geolocation APIs', slug: 'html-apis', order: 6, summary: 'LocalStorage, sessionStorage, and browser APIs' },
        { title: 'Metadata & SEO Optimization', slug: 'seo-metadata', order: 7, summary: 'Meta tags, viewport, OpenGraph tags, and search indexing' }
      ]
    },
    {
      skillName: 'CSS',
      topics: [
        { title: 'CSS Selectors & Specificity', slug: 'css-selectors', order: 1, summary: 'Class, ID, attribute, pseudo-classes, and specificity cascade' },
        { title: 'Box Model & Display Properties', slug: 'box-model', order: 2, summary: 'Margin, border, padding, content, inline vs block' },
        { title: 'CSS Flexbox Layout', slug: 'flexbox', order: 3, summary: 'Flex container, flex items, justify-content, and align-items' },
        { title: 'CSS Grid Layout', slug: 'css-grid', order: 4, summary: 'Grid templates, columns, rows, areas, and gap properties' },
        { title: 'Responsive Design & Media Queries', slug: 'responsive-design', order: 5, summary: 'Breakpoints, mobile-first design, and viewport units' },
        { title: 'Transitions & Keyframe Animations', slug: 'animations', order: 6, summary: 'Transition timing, transform properties, and keyframe loops' },
        { title: 'Custom Properties & Modern CSS', slug: 'css-variables', order: 7, summary: 'CSS custom properties, themes, and calc functions' }
      ]
    },
    {
      skillName: 'JavaScript',
      topics: [
        { title: 'Variables, Data Types & Scopes', slug: 'variables-datatypes', order: 1, summary: 'Let, const, var, primitives, objects, and block scoping' },
        { title: 'Functions, Arrow Syntax & Closures', slug: 'functions-closures', order: 2, summary: 'Function expressions, lexical scoping, and closure memory' },
        { title: 'DOM Tree & Event Handling', slug: 'dom-manipulation', order: 3, summary: 'Query selectors, event listeners, bubbling, and delegation' },
        { title: 'Promises, Async/Await & Event Loop', slug: 'async-promises', order: 4, summary: 'Microtasks, macrotasks, async functions, and concurrency' },
        { title: 'ES6+ Destructuring, Modules & Classes', slug: 'es6-features', order: 5, summary: 'Spread syntax, object destructuring, imports/exports, and classes' },
        { title: 'Array Methods & Functional Programming', slug: 'array-methods', order: 6, summary: 'Map, filter, reduce, find, some, and every operations' },
        { title: 'Error Handling & Try/Catch', slug: 'error-handling', order: 7, summary: 'Custom error classes, stack traces, and finally blocks' },
        { title: 'Fetch API & AJAX Requests', slug: 'fetch-api', order: 8, summary: 'HTTP methods, headers, JSON serialization, and response parsing' },
        { title: 'Prototypes & Inheritance', slug: 'prototypes', order: 9, summary: 'Prototype chain, Object.create, and class inheritance' },
        { title: 'Web Storage & Cookie Management', slug: 'web-storage', order: 10, summary: 'Client-side state storage, session lifecycles, and security' }
      ]
    },
    {
      skillName: 'React',
      topics: [
        { title: 'JSX Syntax & Element Rendering', slug: 'jsx-elements', order: 1, summary: 'JSX compilation, expression embedding, and virtual DOM' },
        { title: 'Components & Props Flow', slug: 'components-props', order: 2, summary: 'Functional components, prop passing, and unidirectional data flow' },
        { title: 'Component State with useState', slug: 'state-usestate', order: 3, summary: 'State management, updater functions, and re-rendering' },
        { title: 'Side Effects with useEffect', slug: 'side-effects-useeffect', order: 4, summary: 'Lifecycle timing, dependency arrays, and cleanup functions' },
        { title: 'Global State with Context API', slug: 'context-api', order: 5, summary: 'CreateContext, Provider pattern, and useContext hook' },
        { title: 'Custom React Hooks', slug: 'custom-hooks', order: 6, summary: 'Extracting reusable component state and lifecycle logic' },
        { title: 'Client-Side Routing', slug: 'react-router', order: 7, summary: 'React Router DOM, route guards, dynamic params, and navigation' },
        { title: 'Performance Optimization & Memoization', slug: 'performance-memo', order: 8, summary: 'React.memo, useMemo, and useCallback optimization' }
      ]
    },
    {
      skillName: 'Node.js',
      topics: [
        { title: 'V8 Engine & Event-Driven Architecture', slug: 'node-architecture', order: 1, summary: 'Single-threaded event loop, libuv, and non-blocking I/O' },
        { title: 'CommonJS & ES Modules', slug: 'modules-system', order: 2, summary: 'Require vs import, module caching, and package manifests' },
        { title: 'File System & Stream Processing', slug: 'fs-streams', order: 3, summary: 'Readable/writable streams, piping, and buffer manipulation' },
        { title: 'Event Emitters & Event Loop', slug: 'event-emitter', order: 4, summary: 'Custom event listeners, emitting events, and memory leaks' },
        { title: 'Native HTTP & Server Basics', slug: 'http-module', order: 5, summary: 'Creating raw HTTP servers, request/response headers' },
        { title: 'NPM & Package Management', slug: 'npm-scripts', order: 6, summary: 'Semantic versioning, dependencies, and lockfile resolution' },
        { title: 'Process Monitoring & Debugging', slug: 'debugging-profiling', order: 7, summary: 'Process signals, memory profiling, and inspection tools' }
      ]
    },
    {
      skillName: 'Express.js',
      topics: [
        { title: 'Express App & Routing Setup', slug: 'express-setup', order: 1, summary: 'Express application instance, router mounting, and paths' },
        { title: 'Middleware Pipeline & Execution', slug: 'middleware-pipeline', order: 2, summary: 'Next function, request mutation, and middleware chains' },
        { title: 'RESTful Controllers & Response Formatting', slug: 'rest-endpoints', order: 3, summary: 'Status codes, JSON envelopes, and controller delegation' },
        { title: 'Request Validation & Sanitization', slug: 'request-validation', order: 4, summary: 'Query, param, and body validation guards' },
        { title: 'Centralized Error Handling', slug: 'error-handling', order: 5, summary: 'Error middleware, operational errors, and HTTP status mapping' },
        { title: 'Security Headers & CORS Policies', slug: 'security-cors-helmet', order: 6, summary: 'Helmet security headers, CORS origins, and rate limiting' }
      ]
    },
    {
      skillName: 'MongoDB',
      topics: [
        { title: 'Document Model & NoSQL Concepts', slug: 'nosql-concepts', order: 1, summary: 'BSON format, document flexibility, and horizontal scaling' },
        { title: 'CRUD Operations & Query Operators', slug: 'crud-operations', order: 2, summary: 'Find, insert, update, delete, and comparison operators' },
        { title: 'Mongoose Schemas & Model Lifecycle', slug: 'mongoose-schemas', order: 3, summary: 'Schema definitions, validations, pre/post hooks, and virtuals' },
        { title: 'Indexing & Performance Optimization', slug: 'indexing-performance', order: 4, summary: 'Compound indexes, unique indexes, TTL, and explain plans' },
        { title: 'Aggregation Pipelines', slug: 'aggregation-pipeline', order: 5, summary: 'Match, group, project, unwind, and multi-stage joins' },
        { title: 'Data Modeling & Relationships', slug: 'data-modeling', order: 6, summary: 'Referencing vs embedding, normalized vs denormalized schemas' }
      ]
    },
    {
      skillName: 'Git',
      topics: [
        { title: 'Git Initialization & Commits', slug: 'git-init-commits', order: 1, summary: 'Staging area, git status, diff, and atomic commits' },
        { title: 'Branch Management & Merging', slug: 'branching-merging', order: 2, summary: 'Branch creation, checkout, fast-forward and 3-way merges' },
        { title: 'Remote Repositories & Collaboration', slug: 'remote-github', order: 3, summary: 'Remote tracking branches, git fetch, pull, and push' },
        { title: 'Rebasing & Conflict Resolution', slug: 'rebase-conflict-resolution', order: 4, summary: 'Interactive rebase, squash commits, and merge conflicts' }
      ]
    }
  ];

  for (const st of skillTopics) {
    const skillId = skillMap[st.skillName];
    if (skillId) {
      for (const t of st.topics) {
        let topic = await Topic.findOne({ skillId, slug: t.slug });
        if (!topic) {
          await Topic.create({
            skillId,
            title: t.title,
            slug: t.slug,
            order: t.order,
            summary: t.summary
          });
        } else {
          topic.title = t.title;
          topic.order = t.order;
          topic.summary = t.summary;
          await topic.save();
        }
      }
    }
  }

  console.log('Safe database seeding completed successfully! 🎉');
};

if (require.main === module) {
  const run = async () => {
    try {
      console.log('Connecting to database...');
      await mongoose.connect(config.mongodbUri);
      console.log('Database connected.');
      await runCatalogSeed();
    } catch (error) {
      console.error('Seeding failed:', error);
    } finally {
      await mongoose.connection.close();
      console.log('Database connection closed.');
    }
  };
  run();
}

module.exports = {
  runCatalogSeed
};
