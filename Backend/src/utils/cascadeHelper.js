const SkillRelationship = require('../models/SkillRelationship');
const RoleSkill = require('../models/RoleSkill');
const UserSkill = require('../models/UserSkill');
const User = require('../models/User');
const Job = require('../models/Job');
const LearningResource = require('../models/LearningResource');
const LearningProgress = require('../models/LearningProgress');
const UserTopicProgress = require('../models/UserTopicProgress');
const Topic = require('../models/Topic');
const AuthToken = require('../models/AuthToken');
const JobApplication = require('../models/JobApplication');
const ChatMessage = require('../models/ChatMessage');
const { removeSkillNode } = require('../services/graphService');

/**
 * Safely cascades the deletion of a Skill across all dependent MongoDB collections
 * and cleans up the node in the CognoDB / Neo4j graph database.
 * @param {string|mongoose.Types.ObjectId} skillId
 */
const cascadeSkillDelete = async (skillId) => {
  if (!skillId) return;

  // 1. Remove graph relationships and dependent mappings
  await SkillRelationship.deleteMany({
    $or: [{ sourceSkillId: skillId }, { targetSkillId: skillId }]
  });

  await RoleSkill.deleteMany({ skillId });
  await UserSkill.deleteMany({ skillId });
  await Topic.deleteMany({ skillId });
  await UserTopicProgress.deleteMany({ skillId });

  // 2. Remove from job requirements
  await Job.updateMany(
    { 'requirements.skillId': skillId },
    { $pull: { requirements: { skillId } } }
  );

  // 3. Remove learning resources for this skill and their user progress records
  const resources = await LearningResource.find({ skillId }).select('_id');
  if (resources.length > 0) {
    const resourceIds = resources.map(r => r._id);
    await LearningProgress.deleteMany({ resourceId: { $in: resourceIds } });
    await LearningResource.deleteMany({ _id: { $in: resourceIds } });
  }

  // 4. Synchronize with CognoDB / Neo4j (non-blocking)
  await removeSkillNode(skillId);
};

/**
 * Safely cascades the deletion of a Role across dependent collections.
 * @param {string|mongoose.Types.ObjectId} roleId
 */
const cascadeRoleDelete = async (roleId) => {
  if (!roleId) return;

  await RoleSkill.deleteMany({ roleId });
  await User.updateMany({ targetRoleId: roleId }, { $set: { targetRoleId: null } });
  await User.updateMany({ savedRoleIds: roleId }, { $pull: { savedRoleIds: roleId } });
};

/**
 * Safely cascades the deletion of a User across user-owned collections.
 * @param {string|mongoose.Types.ObjectId} userId
 */
const cascadeUserDelete = async (userId) => {
  if (!userId) return;

  await UserSkill.deleteMany({ userId });
  await LearningProgress.deleteMany({ userId });
  await UserTopicProgress.deleteMany({ userId });
  await AuthToken.deleteMany({ userId });
  await JobApplication.deleteMany({ userId });
  await ChatMessage.deleteMany({ userId });
};

module.exports = {
  cascadeSkillDelete,
  cascadeRoleDelete,
  cascadeUserDelete
};
