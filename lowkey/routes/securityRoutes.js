// securityRoutes.js 

import express from 'express';
import auth from '../middleware/auth.js';
import SecurityLog from '../models/SecurityLog.js';
import { getIpTracker, getSuspiciousIPs } from '../middleware/rateLimiter.js';

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (!req.user || (req.user.userType !== 'admin' && req.user.userType !== 'super_admin')) {
    return res.status(403).json({ 
      error: 'Access denied', 
      message: 'Admin access required' 
    });
  }
  next();
};

router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const stats = await SecurityLog.getSecurityStats(hours);
    
    const ipTracker = getIpTracker();
    const suspiciousIPs = getSuspiciousIPs();
    
    const realTimeStats = {
      activeConnections: ipTracker.size,
      suspiciousIPs: suspiciousIPs.size,
      totalRequests: Array.from(ipTracker.values()).reduce((sum, data) => sum + data.requests.length, 0)
    };
    
    res.json({
      success: true,
      data: {
        stats,
        realTime: realTimeStats,
        timeRange: `${hours} hours`
      }
    });
  } catch (error) {
    console.error('Error fetching security stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch security statistics',
      message: error.message 
    });
  }
});

router.get('/logs', auth, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const eventType = req.query.eventType;
    const severity = req.query.severity;
    const ipAddress = req.query.ipAddress;
    
    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (severity) filter.severity = severity;
    if (ipAddress) filter.ipAddress = ipAddress;
    
    const skip = (page - 1) * limit;
    
    const logs = await SecurityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'email first_name last_name');
    
    const total = await SecurityLog.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching security logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch security logs',
      message: error.message 
    });
  }
});

router.get('/blocked-ips', auth, adminOnly, async (req, res) => {
  try {
    const blockedIPs = await SecurityLog.find({
      isBlocked: true,
      blockExpiresAt: { $gt: new Date() }
    }).sort({ blockExpiresAt: 1 });
    
    res.json({
      success: true,
      data: blockedIPs
    });
  } catch (error) {
    console.error('Error fetching blocked IPs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch blocked IPs',
      message: error.message 
    });
  }
});

router.post('/unblock-ip', auth, adminOnly, async (req, res) => {
  try {
    const { ipAddress } = req.body;
    
    if (!ipAddress) {
      return res.status(400).json({
        error: 'IP address is required',
        message: 'Please provide an IP address to unblock'
      });
    }
    
    const result = await SecurityLog.updateMany(
      { ipAddress, isBlocked: true },
      { 
        isBlocked: false, 
        blockExpiresAt: null,
        'details.unblockedBy': req.user._id,
        'details.unblockedAt': new Date()
      }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({
        error: 'IP not found',
        message: 'No blocked IP found with the provided address'
      });
    }

    await SecurityLog.create({
      eventType: 'BLOCKED_IP',
      ipAddress,
      endpoint: 'ADMIN_UNBLOCK',
      method: 'POST',
      details: {
        action: 'unblocked',
        unblockedBy: req.user._id,
        unblockedAt: new Date()
      },
      severity: 'LOW',
      isBlocked: false
    });
    
    res.json({
      success: true,
      message: `IP address ${ipAddress} has been unblocked`
    });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    res.status(500).json({ 
      error: 'Failed to unblock IP',
      message: error.message 
    });
  }
});

router.get('/suspicious-activity', auth, adminOnly, async (req, res) => {
  try {
    const suspiciousIPs = getSuspiciousIPs();
    const ipTracker = getIpTracker();
    
    const suspiciousData = Array.from(suspiciousIPs.entries()).map(([ip, data]) => ({
      ip,
      score: data.score,
      lastSeen: data.lastSeen,
      patterns: data.patterns,
      requestCount: ipTracker.get(ip)?.requests.length || 0
    }));
    
    res.json({
      success: true,
      data: suspiciousData
    });
  } catch (error) {
    console.error('Error fetching suspicious activity:', error);
    res.status(500).json({ 
      error: 'Failed to fetch suspicious activity',
      message: error.message 
    });
  }
});

router.get('/dashboard-summary', auth, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    const [hourlyStats, dailyStats, blockedCount, suspiciousCount] = await Promise.all([
      SecurityLog.countDocuments({ createdAt: { $gte: oneHourAgo } }),
      SecurityLog.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      SecurityLog.countDocuments({ isBlocked: true, blockExpiresAt: { $gt: now } }),
      SecurityLog.countDocuments({ eventType: 'SUSPICIOUS_IP', createdAt: { $gte: oneHourAgo } })
    ]);

    const topEvents = await SecurityLog.aggregate([
      { $match: { createdAt: { $gte: oneDayAgo } } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const topIPs = await SecurityLog.aggregate([
      { $match: { createdAt: { $gte: oneDayAgo } } },
      { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: {
          eventsLastHour: hourlyStats,
          eventsLastDay: dailyStats,
          currentlyBlocked: blockedCount,
          suspiciousLastHour: suspiciousCount
        },
        topEvents,
        topIPs
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard summary',
      message: error.message 
    });
  }
});

export default router; 