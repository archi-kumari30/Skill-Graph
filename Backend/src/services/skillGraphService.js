const Skill = require('../models/Skill');
const SkillRelationship = require('../models/SkillRelationship');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/customErrors');

const createRelationship = async (data) => {
  const { sourceSkillId, targetSkillId, relationshipType, strength } = data;

  if (!sourceSkillId || !targetSkillId || !relationshipType) {
    throw new BadRequestError('Source, target, and relationship type are required');
  }

  if (sourceSkillId.toString() === targetSkillId.toString()) {
    throw new BadRequestError('A skill cannot have a relationship with itself');
  }

  // Verify skills exist
  const source = await Skill.findById(sourceSkillId);
  if (!source) throw new NotFoundError('Source skill not found');

  const target = await Skill.findById(targetSkillId);
  if (!target) throw new NotFoundError('Target skill not found');

  // Check if relationship already exists
  const existing = await SkillRelationship.findOne({ sourceSkillId, targetSkillId });
  if (existing) {
    throw new ConflictError('Relationship already exists between these skills. Update it or delete it first.');
  }

  return await SkillRelationship.create({
    sourceSkillId,
    targetSkillId,
    relationshipType,
    strength: strength !== undefined ? strength : 1.0
  });
};

const getAllRelationships = async () => {
  return await SkillRelationship.find()
    .populate('sourceSkillId', 'name category')
    .populate('targetSkillId', 'name category');
};

const getRelatedSkills = async (skillId) => {
  const skill = await Skill.findById(skillId);
  if (!skill) {
    throw new NotFoundError('Skill not found');
  }

  // Find relationships where this skill is source or target
  const relations = await SkillRelationship.find({
    $or: [{ sourceSkillId: skillId }, { targetSkillId: skillId }]
  })
    .populate('sourceSkillId', 'name category')
    .populate('targetSkillId', 'name category');

  return relations.map(rel => {
    const isSource = rel.sourceSkillId._id.toString() === skillId.toString();
    const relatedSkill = isSource ? rel.targetSkillId : rel.sourceSkillId;
    return {
      relationshipId: rel._id,
      skill: relatedSkill,
      direction: isSource ? 'outgoing' : 'incoming',
      relationshipType: rel.relationshipType,
      strength: rel.strength
    };
  });
};

const deleteRelationship = async (id) => {
  const rel = await SkillRelationship.findByIdAndDelete(id);
  if (!rel) {
    throw new NotFoundError('Skill relationship not found');
  }
  return rel;
};

const getGraph = async () => {
  const skills = await Skill.find();
  const relationships = await SkillRelationship.find();

  const nodes = skills.map(skill => ({
    id: skill._id,
    name: skill.name,
    category: skill.category,
    description: skill.description
  }));

  const edges = relationships.map(rel => ({
    id: rel._id,
    source: rel.sourceSkillId,
    target: rel.targetSkillId,
    relationshipType: rel.relationshipType,
    strength: rel.strength
  }));

  return { nodes, edges };
};

module.exports = {
  createRelationship,
  getAllRelationships,
  getRelatedSkills,
  deleteRelationship,
  getGraph
};
