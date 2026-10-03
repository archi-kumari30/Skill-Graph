const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor ID is required'],
      index: true
    },
    action: {
      type: String,
      required: [true, 'Action name is required'],
      trim: true
    },
    targetEntity: {
      type: String,
      required: [true, 'Target entity is required'],
      trim: true,
      index: true
    },
    targetId: {
      type: String,
      required: [true, 'Target ID is required']
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes for entity audit history and user activity lookups
auditLogSchema.index({ targetEntity: 1, targetId: 1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
