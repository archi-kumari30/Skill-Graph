const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    role: {
      type: String,
      required: [true, 'Message role is required'],
      enum: {
        values: ['user', 'assistant'],
        message: 'Role must be user or assistant'
      }
    },
    content: {
      type: String,
      required: [true, 'Message content is required']
    },
    isFallback: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound index for chronological message retrieval per user
chatMessageSchema.index({ userId: 1, createdAt: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
