const UserSkill = require('../models/UserSkill');
const RoleSkill = require('../models/RoleSkill');
const SkillRelationship = require('../models/SkillRelationship');
const LearningResource = require('../models/LearningResource');
const User = require('../models/User');
const Role = require('../models/Role');
const { NotFoundError } = require('../utils/customErrors');

const getRecommendations = async (userId, roleId) => {
  // Verify user and role exist
  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  const role = await Role.findById(roleId);
  if (!role) throw new NotFoundError('Role not found');

  // 1. Fetch user skills
  const userSkills = await UserSkill.find({ userId });
  const userSkillMap = {};
  userSkills.forEach(us => {
    userSkillMap[us.skillId.toString()] = us.proficiency;
  });

  // 2. Fetch role skill requirements
  const roleSkills = await RoleSkill.find({ roleId }).populate('skillId');
  if (roleSkills.length === 0) {
    return [];
  }

  // Map role skills by skillId for fast lookup
  const roleSkillMap = {};
  roleSkills.forEach(rs => {
    if (rs.skillId) {
      roleSkillMap[rs.skillId._id.toString()] = {
        requiredProficiency: rs.requiredProficiency,
        importance: rs.importance
      };
    }
  });

  // 3. Identify skills with a gap
  const gapSkills = [];
  roleSkills.forEach(rs => {
    const skill = rs.skillId;
    if (!skill) return;

    const currentProf = userSkillMap[skill._id.toString()] || 0;
    const reqProf = rs.requiredProficiency;

    if (currentProf < reqProf) {
      gapSkills.push({
        skill,
        currentProficiency: currentProf,
        requiredProficiency: reqProf,
        gap: reqProf - currentProf,
        importance: rs.importance
      });
    }
  });

  if (gapSkills.length === 0) {
    return [];
  }

  // 4. Fetch all prerequisite relationships
  // (We fetch relationships where the target is one of our gap skills)
  const gapSkillIds = gapSkills.map(gs => gs.skill._id);
  const prerequisites = await SkillRelationship.find({
    targetSkillId: { $in: gapSkillIds },
    relationshipType: 'prerequisite'
  }).populate('sourceSkillId');

  // Map targetSkillId -> list of sourceSkillIds
  const prereqMap = {};
  prerequisites.forEach(rel => {
    const targetId = rel.targetSkillId.toString();
    if (!prereqMap[targetId]) {
      prereqMap[targetId] = [];
    }
    prereqMap[targetId].push(rel.sourceSkillId);
  });

  // 5. Check which skills unlock others
  // Find relationships where the source is a gap skill and target is also a gap skill
  const outgoingPrereqs = await SkillRelationship.find({
    sourceSkillId: { $in: gapSkillIds },
    targetSkillId: { $in: gapSkillIds },
    relationshipType: 'prerequisite'
  });
  const unlocksMap = {};
  outgoingPrereqs.forEach(rel => {
    const sourceId = rel.sourceSkillId.toString();
    if (!unlocksMap[sourceId]) {
      unlocksMap[sourceId] = [];
    }
    unlocksMap[sourceId].push(rel.targetSkillId.toString());
  });

  // 6. Calculate recommendations
  const recommendations = [];

  for (const gs of gapSkills) {
    const skillIdStr = gs.skill._id.toString();
    const skillPrereqs = prereqMap[skillIdStr] || [];

    // Evaluate prerequisites
    const unsatisfiedPrereqs = [];
    for (const prereq of skillPrereqs) {
      const prereqIdStr = prereq._id.toString();
      const currentProf = userSkillMap[prereqIdStr] || 0;

      // Determine required level for prerequisite
      let requiredLevelForPrereq = 2; // default: basic level
      if (roleSkillMap[prereqIdStr]) {
        requiredLevelForPrereq = roleSkillMap[prereqIdStr].requiredProficiency;
      }

      if (currentProf < requiredLevelForPrereq) {
        unsatisfiedPrereqs.push({
          id: prereq._id,
          name: prereq.name,
          currentProficiency: currentProf,
          requiredLevel: requiredLevelForPrereq
        });
      }
    }

    const allPrereqsSatisfied = unsatisfiedPrereqs.length === 0;

    // Calculate priority score (0-100)
    let score = 0;

    // A. Importance weight (max 50)
    if (gs.importance === 'required') score += 50;
    else if (gs.importance === 'important') score += 30;
    else if (gs.importance === 'nice_to_have') score += 10;

    // B. Gap size weight (max 40)
    score += gs.gap * 8; // e.g., gap of 3 adds 24 points

    // C. Prerequisite satisfaction (modifier)
    if (allPrereqsSatisfied) {
      score += 15; // Boost if ready to learn
    } else {
      score -= 30; // Penalize if not ready yet
    }

    // D. Unlock potential (boost)
    const unlocksOthers = unlocksMap[skillIdStr] && unlocksMap[skillIdStr].length > 0;
    if (unlocksOthers) {
      score += 15; // Boost if this unlocks other gap skills
    }

    // Bind score between 0 and 100
    const priority = Math.max(0, Math.min(100, score));

    // Construct human-readable reason
    let reason = '';
    if (!allPrereqsSatisfied) {
      const names = unsatisfiedPrereqs.map(p => p.name).join(', ');
      reason = `This skill is required, but you should first learn its prerequisite skill(s): ${names}.`;
    } else {
      if (gs.importance === 'required') {
        reason = `Critical required skill for the role with a gap of ${gs.gap}. Prerequisites are fully satisfied.`;
      } else if (gs.importance === 'important') {
        reason = `Important skill for the role with a gap of ${gs.gap}. Prerequisites are satisfied.`;
      } else {
        reason = `Nice-to-have skill for the role with a gap of ${gs.gap}.`;
      }

      if (unlocksOthers) {
        reason += ' Learning this skill will also help unlock advanced required skills.';
      }
    }

    // Fetch learning resources for this skill
    const resources = await LearningResource.find({ skillId: gs.skill._id });

    recommendations.push({
      skill: {
        id: gs.skill._id,
        name: gs.skill.name,
        category: gs.skill.category
      },
      priority,
      reason,
      currentProficiency: gs.currentProficiency,
      targetProficiency: gs.requiredProficiency,
      prerequisiteSkills: skillPrereqs.map(p => ({ id: p._id, name: p.name })),
      unsatisfiedPrerequisites: unsatisfiedPrereqs.map(p => ({ id: p.id, name: p.name })),
      learningResources: resources.map(r => ({
        title: r.title,
        url: r.url,
        difficulty: r.difficulty,
        estimatedHours: r.estimatedHours
      }))
    });
  }

  // Sort by priority descending
  recommendations.sort((a, b) => b.priority - a.priority);

  return recommendations;
};

module.exports = {
  getRecommendations
};
