const AuditLog = require('../models/AuditLog');

const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apikey',
  'gemini_api_key',
  'cookie',
  'resetpasswordtoken'
];

/**
 * Deep-clean an object to ensure no sensitive authentication or secret keys are stored in audit logs.
 */
const sanitizeChanges = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeChanges(item));
  }
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeChanges(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Record an audit log entry for high-impact security and administrative actions.
 */
const logAction = async ({ actorId, action, targetEntity, targetId, changes = {}, req = null }) => {
  try {
    const ipAddress = req
      ? (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '')
      : '';
    const cleanChanges = sanitizeChanges(changes);

    const logEntry = await AuditLog.create({
      actorId,
      action,
      targetEntity,
      targetId: targetId ? targetId.toString() : 'unknown',
      changes: cleanChanges,
      ipAddress
    });

    return logEntry;
  } catch (err) {
    // Non-blocking fail-safe: audit log creation failure does not abort caller transaction
    console.error('Audit log write failed:', err.message);
    return null;
  }
};

/**
 * Query audit log history with actor details.
 */
const getAuditLogs = async (filters = {}) => {
  const query = {};
  if (filters.actorId) query.actorId = filters.actorId;
  if (filters.targetEntity) query.targetEntity = filters.targetEntity;
  if (filters.targetId) query.targetId = filters.targetId;

  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
  return await AuditLog.find(query)
    .populate('actorId', 'name email accountRole')
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = {
  logAction,
  getAuditLogs,
  sanitizeChanges
};
