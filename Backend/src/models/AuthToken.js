const mongoose = require('mongoose');

const authTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      index: true
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required']
    },
    revoked: {
      type: Boolean,
      default: false,
      index: true
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically purge expired tokens from MongoDB
authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for active session lookups
authTokenSchema.index({ userId: 1, revoked: 1 });

const AuthToken = mongoose.model('AuthToken', authTokenSchema);

module.exports = AuthToken;
