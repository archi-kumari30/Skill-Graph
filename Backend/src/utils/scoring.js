const SKILL_TOTAL_TOPICS = {
  'HTML': 7,
  'CSS': 7,
  'JavaScript': 10,
  'React': 8,
  'Git': 4,
  'Node.js': 7,
  'Express': 6,
  'MongoDB': 6
};

const getImportanceWeight = (importance) => {
  switch (importance) {
    case 'required': return 3;
    case 'important': return 2;
    case 'nice_to_have': return 1;
    default: return 1;
  }
};

const calculateReadiness = (requirements, userSkillMap, topicCompletionMap = {}) => {
  let totalWeightedMaxScore = 0;
  let totalWeightedUserScore = 0;
  let matchedSkillsCount = 0;
  let missingSkillsCount = 0;
  let skillsToImproveCount = 0;

  const skillGaps = requirements.map(req => {
    const skill = req.skillId;
    if (!skill) return null;

    const skillIdStr = skill._id ? skill._id.toString() : skill.toString();
    const currentProficiency = userSkillMap[skillIdStr] || 0;
    
    // Topic completion multiplier
    const skillName = skill.name || '';
    const totalTopics = SKILL_TOTAL_TOPICS[skillName] || 3;
    const completedTopicsCount = topicCompletionMap[skillIdStr] || 0;
    const completionRate = totalTopics > 0 ? Math.min(1.0, completedTopicsCount / totalTopics) : 1.0;
    
    const effectiveProficiency = currentProficiency * completionRate;

    const requiredProficiency = req.requiredProficiency;
    const gap = Math.max(0, requiredProficiency - effectiveProficiency);
    const weight = getImportanceWeight(req.importance);

    // Track scores using effectiveProficiency
    totalWeightedMaxScore += weight * requiredProficiency;
    totalWeightedUserScore += weight * Math.min(effectiveProficiency, requiredProficiency);

    let status = 'missing';
    if (effectiveProficiency >= requiredProficiency) {
      status = 'mastered';
      matchedSkillsCount++;
    } else if (effectiveProficiency > 0) {
      status = 'needs_improvement';
      skillsToImproveCount++;
    } else {
      missingSkillsCount++;
    }

    return {
      skill: skill._id ? {
        id: skill._id,
        name: skill.name,
        category: skill.category
      } : { id: skill },
      currentProficiency,
      effectiveProficiency: Math.round(effectiveProficiency * 10) / 10,
      completedTopicsCount,
      totalTopics,
      requiredProficiency,
      gap: Math.round(gap * 10) / 10,
      importance: req.importance,
      status
    };
  }).filter(Boolean);

  const readinessScore = totalWeightedMaxScore > 0
    ? Math.round((totalWeightedUserScore / totalWeightedMaxScore) * 100)
    : 100;

  return {
    readinessScore,
    matchedSkills: matchedSkillsCount,
    missingSkills: missingSkillsCount,
    skillsToImprove: skillsToImproveCount,
    skills: skillGaps
  };
};

module.exports = {
  getImportanceWeight,
  calculateReadiness
};
