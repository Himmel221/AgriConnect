

import mongoose from 'mongoose';

const SecurityLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: ['RATE_LIMIT_EXCEEDED', 'SUSPICIOUS_IP', 'BLOCKED_IP', 'FAILED_AUTH', 'UPLOAD_ABUSE', 'VERIFICATION_ABUSE', 'LOGIN_ATTEMPT', 'REGISTRATION_ATTEMPT']
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true
  },
  requestCount: {
    type: Number,
    default: 1
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userEmail: {
    type: String,
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockExpiresAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Index for efficient querying
SecurityLogSchema.index({ ipAddress: 1, createdAt: -1 });
SecurityLogSchema.index({ eventType: 1, createdAt: -1 });
SecurityLogSchema.index({ severity: 1, createdAt: -1 });

// Method to check if IP is currently blocked
SecurityLogSchema.statics.isIpBlocked = async function(ipAddress) {
  const blockedLog = await this.findOne({
    ipAddress,
    isBlocked: true,
    blockExpiresAt: { $gt: new Date() }
  });
  return !!blockedLog;
};

SecurityLogSchema.statics.blockIp = async function(ipAddress, reason, duration = 3600000) { 
  const blockExpiresAt = new Date(Date.now() + duration);
  
  await this.updateMany(
    { ipAddress, isBlocked: false },
    { 
      isBlocked: true, 
      blockExpiresAt,
      'details.blockReason': reason,
      'details.blockedAt': new Date()
    }
  );
  
  return this.create({
    eventType: 'BLOCKED_IP',
    ipAddress,
    endpoint: 'SYSTEM',
    method: 'BLOCK',
    details: {
      blockReason: reason,
      blockExpiresAt,
      duration: duration
    },
    severity: 'HIGH',
    isBlocked: true,
    blockExpiresAt
  });
};

SecurityLogSchema.statics.getSecurityStats = async function(hours = 24) {
  const since = new Date(Date.now() - (hours * 60 * 60 * 1000));
  
  const stats = await this.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        uniqueIPs: { $addToSet: '$ipAddress' },
        severityCounts: {
          $push: '$severity'
        }
      }
    },
    {
      $project: {
        eventType: '$_id',
        count: 1,
        uniqueIPCount: { $size: '$uniqueIPs' },
        severityBreakdown: {
          LOW: { $size: { $filter: { input: '$severityCounts', cond: { $eq: ['$$this', 'LOW'] } } } },
          MEDIUM: { $size: { $filter: { input: '$severityCounts', cond: { $eq: ['$$this', 'MEDIUM'] } } } },
          HIGH: { $size: { $filter: { input: '$severityCounts', cond: { $eq: ['$$this', 'HIGH'] } } } },
          CRITICAL: { $size: { $filter: { input: '$severityCounts', cond: { $eq: ['$$this', 'CRITICAL'] } } } }
        }
      }
    }
  ]);
  
  return stats;
};

const SecurityLog = mongoose.model('SecurityLog', SecurityLogSchema);
export default SecurityLog; 