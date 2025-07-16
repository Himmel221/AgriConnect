// ddosProtection.js 

import rateLimit from 'express-rate-limit';
import SecurityLog from '../models/SecurityLog.js';

const ipTracker = new Map();
const suspiciousIPs = new Map();


setInterval(() => {
  const now = Date.now();
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  
  for (const [ip, data] of ipTracker.entries()) {
    if (data.lastSeen < fiveMinutesAgo) {
      ipTracker.delete(ip);
    }
  }
  
  for (const [ip, data] of suspiciousIPs.entries()) {
    if (data.lastSeen < fiveMinutesAgo) {
      suspiciousIPs.delete(ip);
    }
  }
}, 5 * 60 * 1000);

const getRealIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.ip || 
         'unknown';
};

const detectSuspiciousActivity = (ip, endpoint, method) => {
  const now = Date.now();
  const oneMinuteAgo = now - (60 * 1000);
  
  if (!ipTracker.has(ip)) {
    ipTracker.set(ip, {
      requests: [],
      lastSeen: now,
      failedAuths: 0,
      suspiciousPatterns: 0
    });
  }
  
  const tracker = ipTracker.get(ip);
  tracker.lastSeen = now;
  
  tracker.requests.push({
    timestamp: now,
    endpoint,
    method
  });
  
  tracker.requests = tracker.requests.filter(req => req.timestamp > oneMinuteAgo);
  

  let suspiciousScore = 0;
  

  if (tracker.requests.length > 50) {
    suspiciousScore += 3;
  } else if (tracker.requests.length > 30) {
    suspiciousScore += 2;
  } else if (tracker.requests.length > 20) {
    suspiciousScore += 1;
  }
  

  const authEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password'];
  const recentAuthRequests = tracker.requests.filter(req => 
    authEndpoints.includes(req.endpoint) && req.timestamp > oneMinuteAgo
  );
  
  if (recentAuthRequests.length > 10) {
    suspiciousScore += 3;
  } else if (recentAuthRequests.length > 5) {
    suspiciousScore += 2;
  }
  

  if (tracker.failedAuths > 5) {
    suspiciousScore += 2;
  }
  

  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.length < 10) {
    suspiciousScore += 1;
  }
  

  const validEndpoints = [
    '/api/auth/login', '/api/auth/register', '/api/auth/verify-email',
    '/api/auth/forgot-password', '/api/auth/reset-password',
    '/api/listings', '/api/cart', '/api/users', '/api/messages'
  ];
  
  if (!validEndpoints.includes(endpoint) && !endpoint.startsWith('/api/')) {
    suspiciousScore += 1;
  }
  

  tracker.suspiciousPatterns = Math.max(tracker.suspiciousPatterns, suspiciousScore);
  

  if (suspiciousScore >= 3) {
    suspiciousIPs.set(ip, {
      score: suspiciousScore,
      lastSeen: now,
      patterns: tracker.requests.slice(-10) 
    });
    
    return {
      isSuspicious: true,
      score: suspiciousScore,
      reason: `Suspicious activity detected: ${suspiciousScore} suspicious patterns`
    };
  }
  
  return { isSuspicious: false, score: suspiciousScore };
};


export const ddosProtection = async (req, res, next) => {
  const ip = getRealIP(req);
  const endpoint = req.path;
  const method = req.method;
  
  try {

    const isBlocked = await SecurityLog.isIpBlocked(ip);
    if (isBlocked) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address has been temporarily blocked due to suspicious activity.',
        code: 'IP_BLOCKED'
      });
    }
    

    const suspiciousCheck = detectSuspiciousActivity(ip, endpoint, method);
    
    if (suspiciousCheck.isSuspicious) {

      await SecurityLog.create({
        eventType: 'SUSPICIOUS_IP',
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || 'Unknown',
        endpoint,
        method,
        details: {
          suspiciousScore: suspiciousCheck.score,
          reason: suspiciousCheck.reason,
          requestCount: ipTracker.get(ip)?.requests.length || 0
        },
        severity: suspiciousCheck.score >= 5 ? 'CRITICAL' : 'HIGH'
      });
      

      if (suspiciousCheck.score >= 5) {
        await SecurityLog.blockIp(ip, `Critical suspicious activity: ${suspiciousCheck.score} suspicious patterns`);
        
        return res.status(403).json({
          error: 'Access denied',
          message: 'Your IP address has been blocked due to critical suspicious activity.',
          code: 'IP_BLOCKED_CRITICAL'
        });
      }
    }
    

    await SecurityLog.create({
      eventType: endpoint.includes('login') ? 'LOGIN_ATTEMPT' : 
                 endpoint.includes('register') ? 'REGISTRATION_ATTEMPT' : 'RATE_LIMIT_EXCEEDED',
      ipAddress: ip,
      userAgent: req.headers['user-agent'] || 'Unknown',
      endpoint,
      method,
      details: {
        suspiciousScore: suspiciousCheck.score,
        requestCount: ipTracker.get(ip)?.requests.length || 0
      },
      severity: suspiciousCheck.score > 0 ? 'MEDIUM' : 'LOW'
    });
    
    next();
  } catch (error) {
    console.error('DDoS protection error:', error);

    next();
  }
};


export const createRateLimit = (windowMs, max, endpoint) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Rate limit exceeded',
      message: `Too many requests to ${endpoint}. Please try again later.`,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const ip = getRealIP(req);
      const user = req.user?._id;
      return user ? `${user}-${endpoint}` : `${ip}-${endpoint}`;
    },
    handler: async (req, res) => {
      const ip = getRealIP(req);
      

      await SecurityLog.create({
        eventType: 'RATE_LIMIT_EXCEEDED',
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || 'Unknown',
        endpoint,
        method: req.method,
        details: {
          limit: max,
          windowMs,
          user: req.user?._id || null
        },
        severity: 'MEDIUM'
      });
      

      if (ipTracker.has(ip)) {
        ipTracker.get(ip).suspiciousPatterns += 1;
      }
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests to ${endpoint}. Please try again later.`,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  });
};


export const authRateLimit = createRateLimit(60 * 1000, 20, 'auth'); 
export const apiRateLimit = createRateLimit(60 * 1000, 100, 'api'); 
export const uploadRateLimit = createRateLimit(60 * 1000, 10, 'upload'); 


export const trackFailedAuth = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    const ip = getRealIP(req);
    

    if (res.statusCode === 400 || res.statusCode === 401) {
      if (req.path.includes('/login') || req.path.includes('/register')) {
        if (ipTracker.has(ip)) {
          ipTracker.get(ip).failedAuths += 1;
        }
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Export helper functions for testing
export const getIpTracker = () => ipTracker;
export const getSuspiciousIPs = () => suspiciousIPs; 