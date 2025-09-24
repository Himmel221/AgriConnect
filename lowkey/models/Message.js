// Message.js

import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emoji: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'Emoji cannot be empty'
      }
    }
  }]
});

// Add pre-save middleware to validate reactions
MessageSchema.pre('save', function(next) {
  console.log('Message pre-save middleware triggered');
  console.log('Reactions before save:', this.reactions);
  
  if (this.reactions && this.reactions.length > 0) {
    for (let i = 0; i < this.reactions.length; i++) {
      const reaction = this.reactions[i];
      if (!reaction.emoji || reaction.emoji.trim() === '') {
        console.error('Invalid reaction at index', i, ':', reaction);
        return next(new Error(`Reaction at index ${i} has invalid emoji: ${reaction.emoji}`));
      }
      if (!reaction.userId) {
        console.error('Invalid reaction at index', i, ':', reaction);
        return next(new Error(`Reaction at index ${i} has invalid userId: ${reaction.userId}`));
      }
    }
  }
  
  next();
});

const Message = mongoose.model('Message', MessageSchema);
export default Message;