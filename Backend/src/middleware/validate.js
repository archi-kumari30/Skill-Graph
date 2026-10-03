const { ValidationError } = require('../utils/customErrors');

/**
 * Declarative validation middleware.
 * @param {Object} schema - Validation schema containing optional `body`, `query`, and `params` rules.
 * @returns {Function} Express middleware.
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    const validateSegment = (segmentName, rules) => {
      if (!rules) return;
      const data = req[segmentName] || {};

      for (const [field, rule] of Object.entries(rules)) {
        const val = data[field];

        // 1. Required check
        if (rule.required) {
          if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
            errors.push({ field, segment: segmentName, message: `${field} is required` });
            continue;
          }
        }

        // If field is optional and absent, skip other checks
        if (val === undefined || val === null) {
          continue;
        }

        // 2. Type check
        if (rule.type) {
          if (rule.type === 'array') {
            if (!Array.isArray(val)) {
              errors.push({ field, segment: segmentName, message: `${field} must be an array` });
              continue;
            }
          } else if (rule.type === 'number') {
            const num = Number(val);
            if (isNaN(num)) {
              errors.push({ field, segment: segmentName, message: `${field} must be a valid number` });
              continue;
            }
          } else if (typeof val !== rule.type) {
            errors.push({ field, segment: segmentName, message: `${field} must be a ${rule.type}` });
            continue;
          }
        }

        // 3. String min/max length
        if (typeof val === 'string') {
          if (rule.minLength !== undefined && val.length < rule.minLength) {
            errors.push({ field, segment: segmentName, message: `${field} must be at least ${rule.minLength} characters` });
          }
          if (rule.maxLength !== undefined && val.length > rule.maxLength) {
            errors.push({ field, segment: segmentName, message: `${field} cannot exceed ${rule.maxLength} characters` });
          }
        }

        // 4. Number min/max bounds
        if (typeof val === 'number' || (rule.type === 'number' && !isNaN(Number(val)))) {
          const num = Number(val);
          if (rule.min !== undefined && num < rule.min) {
            errors.push({ field, segment: segmentName, message: `${field} must be at least ${rule.min}` });
          }
          if (rule.max !== undefined && num > rule.max) {
            errors.push({ field, segment: segmentName, message: `${field} cannot exceed ${rule.max}` });
          }
        }

        // 5. Enum check
        if (rule.enum && Array.isArray(rule.enum)) {
          if (!rule.enum.includes(val)) {
            errors.push({ field, segment: segmentName, message: `${field} must be one of: ${rule.enum.join(', ')}` });
          }
        }

        // 6. Pattern check (e.g., regex for email, URL)
        if (rule.pattern && typeof val === 'string') {
          if (!rule.pattern.test(val)) {
            errors.push({ field, segment: segmentName, message: rule.patternMessage || `${field} format is invalid` });
          }
        }

        // 7. Custom validator
        if (typeof rule.custom === 'function') {
          const customResult = rule.custom(val, req);
          if (customResult !== true) {
            errors.push({ field, segment: segmentName, message: typeof customResult === 'string' ? customResult : `${field} failed validation` });
          }
        }
      }
    };

    validateSegment('body', schema.body);
    validateSegment('query', schema.query);
    validateSegment('params', schema.params);

    if (errors.length > 0) {
      return next(new ValidationError('Validation failed', errors));
    }

    next();
  };
};

module.exports = {
  validate
};
