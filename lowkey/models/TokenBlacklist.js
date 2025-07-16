// TokenBlacklist.js - For storing blacklisted JWT tokens

import mongoose from 'mongoose';

const TokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blacklistedAt: {
    type: Date,
    default: Date.now,
    expires: 86400 
  },
  reason: {
    type: String,
    enum: ['LOGOUT', 'SECURITY', 'EXPIRED'],
    default: 'LOGOUT'
  }
}, { timestamps: true });

TokenBlacklistSchema.index({ token: 1 });
TokenBlacklistSchema.index({ userId: 1 });
TokenBlacklistSchema.index({ blacklistedAt: 1 });

TokenBlacklistSchema.statics.isBlacklisted = async function(token) {
  const blacklistedToken = await this.findOne({ token });
  return !!blacklistedToken;
};

TokenBlacklistSchema.statics.blacklistToken = async function(token, userId, reason = 'LOGOUT') {
  try {
    await this.create({
      token,
      userId,
      reason
    });
    return true;
  } catch (error) {

    return false;
  }
};


TokenBlacklistSchema.statics.cleanup = async function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await this.deleteMany({ blacklistedAt: { $lt: oneDayAgo } });
};

const TokenBlacklist = mongoose.model('TokenBlacklist', TokenBlacklistSchema);
export default TokenBlacklist; 