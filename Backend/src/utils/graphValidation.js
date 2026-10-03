const SkillRelationship = require('../models/SkillRelationship');

/**
 * Checks if adding a directed prerequisite edge (sourceSkillId -> targetSkillId)
 * would create a cycle in the prerequisite Directed Acyclic Graph (DAG).
 *
 * A directed cycle is closed if targetSkillId can reach sourceSkillId via existing prerequisite edges.
 *
 * @param {string|mongoose.Types.ObjectId} sourceSkillId - Source / prerequisite skill ID
 * @param {string|mongoose.Types.ObjectId} targetSkillId - Target / dependent skill ID
 * @returns {Promise<{ hasCycle: boolean, cyclePath: string[] }>}
 */
const wouldCreateCycle = async (sourceSkillId, targetSkillId) => {
  const startId = targetSkillId ? targetSkillId.toString() : '';
  const goalId = sourceSkillId ? sourceSkillId.toString() : '';

  if (startId === goalId) {
    return { hasCycle: true, cyclePath: [startId, goalId] };
  }

  // Load all existing prerequisite edges from MongoDB
  const prerequisiteEdges = await SkillRelationship.find({
    relationshipType: 'prerequisite'
  }).select('sourceSkillId targetSkillId');

  // Build adjacency list: node -> array of dependent nodes
  const adj = new Map();
  for (const edge of prerequisiteEdges) {
    const from = edge.sourceSkillId ? edge.sourceSkillId.toString() : '';
    const to = edge.targetSkillId ? edge.targetSkillId.toString() : '';
    if (from && to) {
      if (!adj.has(from)) {
        adj.set(from, []);
      }
      adj.get(from).push(to);
    }
  }

  // DFS with visited tracking to detect reachability from startId to goalId
  const visited = new Set();
  const path = [];

  const dfs = (current) => {
    visited.add(current);
    path.push(current);

    if (current === goalId) {
      return true;
    }

    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      }
    }

    path.pop();
    return false;
  };

  const hasCycle = dfs(startId);
  return {
    hasCycle,
    cyclePath: hasCycle ? [goalId, ...path] : []
  };
};

module.exports = {
  wouldCreateCycle
};
