const mongoose = require('mongoose');
const User = require('../src/models/User');
const Role = require('../src/models/Role');
const Skill = require('../src/models/Skill');
const RoleSkill = require('../src/models/RoleSkill');
const UserSkill = require('../src/models/UserSkill');
const graphService = require('../src/services/graphService');
const cognodbConfig = require('../src/config/cognodb');
const skillGapService = require('../src/services/skillGapService');

describe('skillGapService Timeout, Graph Resilience & MongoDB Fallback', () => {
  let user;
  let role;
  let skill;

  beforeEach(async () => {
    user = await User.create({
      name: 'Resilience Test User',
      email: `test_resilience_${Date.now()}@test.com`,
      password: 'password123',
      accountRole: 'student'
    });

    skill = await Skill.create({
      name: 'Resilience Test Skill',
      category: 'Backend'
    });

    role = await Role.create({
      name: 'Resilience Role',
      department: 'Engineering',
      level: 'mid'
    });

    await RoleSkill.create({
      roleId: role._id,
      skillId: skill._id,
      requiredProficiency: 3,
      importance: 'required'
    });

    await UserSkill.create({
      userId: user._id,
      skillId: skill._id,
      proficiency: 2
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.USE_GRAPH_DB;
  });

  it('1. MongoDB fallback: should compute gap directly via MongoDB when USE_GRAPH_DB is false', async () => {
    process.env.USE_GRAPH_DB = 'false';

    const result = await skillGapService.calculateGap(user._id, role._id);

    expect(result).toBeDefined();
    expect(result.user.id.toString()).toBe(user._id.toString());
    expect(result.role.id.toString()).toBe(role._id.toString());
    expect(result.readinessScore).toBeDefined();
    expect(result.skills).toBeDefined();
    expect(result.skills.length).toBe(1);
    expect(result.skills[0].currentProficiency).toBe(2);
    expect(result.skills[0].requiredProficiency).toBe(3);
  });

  it('2. Graph success: should return graph result when graph query succeeds within timeout', async () => {
    process.env.USE_GRAPH_DB = 'true';
    jest.spyOn(cognodbConfig, 'getDriver').mockReturnValue({ session: () => {} });

    const mockGraphResult = {
      user: { id: user._id, name: user.name, email: user.email },
      role: { id: role._id, name: role.name, department: role.department, level: 'mid' },
      readinessScore: 85,
      matchedSkills: 1,
      missingSkills: 0,
      skillsToImprove: 1,
      skills: [{ skillName: 'Resilience Test Skill', currentProficiency: 3, requiredProficiency: 3 }]
    };

    jest.spyOn(graphService, 'getSkillGaps').mockResolvedValue(mockGraphResult);

    const result = await skillGapService.calculateGap(user._id, role._id);

    expect(result).toBeDefined();
    expect(result.readinessScore).toBe(85);
    expect(result.matchedSkills).toBe(1);
  });

  it('3. Graph failure: should safely catch graph exception and fall back to MongoDB', async () => {
    process.env.USE_GRAPH_DB = 'true';
    jest.spyOn(cognodbConfig, 'getDriver').mockReturnValue({ session: () => {} });

    // Simulate graph query failure (network disconnection or Cypher syntax error)
    jest.spyOn(graphService, 'getSkillGaps').mockRejectedValue(new Error('CognoDB driver network disconnect'));

    const result = await skillGapService.calculateGap(user._id, role._id);

    // Fallback to MongoDB produces valid result
    expect(result).toBeDefined();
    expect(result.user.id.toString()).toBe(user._id.toString());
    expect(result.skills.length).toBe(1);
    expect(result.skills[0].currentProficiency).toBe(2);
  });

  it('4. Graph timeout: should trigger timeout at 2500ms and fall back to MongoDB without unhandled rejection', async () => {
    process.env.USE_GRAPH_DB = 'true';
    jest.spyOn(cognodbConfig, 'getDriver').mockReturnValue({ session: () => {} });

    // Mock graph query taking longer than the 2500ms timeout
    let backgroundQuerySettled = false;
    jest.spyOn(graphService, 'getSkillGaps').mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          backgroundQuerySettled = true;
          resolve({ mockStaleData: true });
        }, 2700);
      });
    });

    const startTime = Date.now();
    const result = await skillGapService.calculateGap(user._id, role._id);
    const duration = Date.now() - startTime;

    // Must have timed out around 2500ms and returned MongoDB fallback result
    expect(duration).toBeGreaterThanOrEqual(2400);
    expect(result).toBeDefined();
    expect(result.user.id.toString()).toBe(user._id.toString());
    expect(result.skills[0].currentProficiency).toBe(2);

    // Wait for the slow query to settle in background and verify no crashes
    await new Promise((r) => setTimeout(r, 400));
    expect(backgroundQuerySettled).toBe(true);
  }, 10000);
});
