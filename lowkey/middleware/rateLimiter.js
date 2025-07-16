

import rateLimit from 'express-rate-limit';
import SecurityLog from '../models/SecurityLog.js';


const ipTracker = new Map();
const suspiciousIPs = new Map();
const attackPatterns = new Map();


const ATTACK_PATTERNS = {

  SYN_FLOOD: {
    threshold: 100, 
    window: 1000,  
    score: 5
  },
  

  SLOWLORIS: {
    threshold: 50,  
    window: 60000,  
  },
  

  HTTP_FLOOD: {
    threshold: 200, 
    window: 60000, 
    score: 3
  },
  

  AUTH_BRUTE_FORCE: {
    threshold: 10,  
    window: 60000,  
    score: 4
  },
  

  APP_LAYER: {
    threshold: 50,  
    window: 60000,  
    score: 3
  }
};


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
  
  for (const [ip, data] of attackPatterns.entries()) {
    if (data.lastSeen < fiveMinutesAgo) {
      attackPatterns.delete(ip);
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


const detectSuspiciousActivity = (ip, endpoint, method, req) => {
  const now = Date.now();
  const oneMinuteAgo = now - (60 * 1000);
  
  if (!ipTracker.has(ip)) {
    ipTracker.set(ip, {
      requests: [],
      lastSeen: now,
      failedAuths: 0,
      suspiciousPatterns: 0,
      slowRequests: 0,
      attackScores: new Map()
    });
  }
  
  const tracker = ipTracker.get(ip);
  tracker.lastSeen = now;
  

  tracker.requests.push({
    timestamp: now,
    endpoint,
    method,
    userAgent: req.headers['user-agent'] || '',
    contentLength: req.headers['content-length'] || 0
  });
  

  tracker.requests = tracker.requests.filter(req => req.timestamp > oneMinuteAgo);
  

  let totalAttackScore = 0;
  

  const recentRequests = tracker.requests.filter(req => req.timestamp > now - ATTACK_PATTERNS.SYN_FLOOD.window);
  if (recentRequests.length > ATTACK_PATTERNS.SYN_FLOOD.threshold) {
    tracker.attackScores.set('SYN_FLOOD', ATTACK_PATTERNS.SYN_FLOOD.score);
    totalAttackScore += ATTACK_PATTERNS.SYN_FLOOD.score;
  }
  

  const httpRequests = tracker.requests.filter(req => req.timestamp > now - ATTACK_PATTERNS.HTTP_FLOOD.window);
  if (httpRequests.length > ATTACK_PATTERNS.HTTP_FLOOD.threshold) {
    tracker.attackScores.set('HTTP_FLOOD', ATTACK_PATTERNS.HTTP_FLOOD.score);
    totalAttackScore += ATTACK_PATTERNS.HTTP_FLOOD.score;
  }
  

  if (tracker.failedAuths > ATTACK_PATTERNS.AUTH_BRUTE_FORCE.threshold) {
    tracker.attackScores.set('AUTH_BRUTE_FORCE', ATTACK_PATTERNS.AUTH_BRUTE_FORCE.score);
    totalAttackScore += ATTACK_PATTERNS.AUTH_BRUTE_FORCE.score;
  }
  

  const slowRequests = tracker.requests.filter(req => 
    req.timestamp > now - ATTACK_PATTERNS.SLOWLORIS.window && 
    req.contentLength > 0 && 
    req.contentLength < 100 
  );
  if (slowRequests.length > ATTACK_PATTERNS.SLOWLORIS.threshold) {
    tracker.attackScores.set('SLOWLORIS', ATTACK_PATTERNS.SLOWLORIS.score);
    totalAttackScore += ATTACK_PATTERNS.SLOWLORIS.score;
  }
  

  const suspiciousRequests = tracker.requests.filter(req => {
    const userAgent = req.userAgent.toLowerCase();
    const isSuspicious = 
      userAgent.includes('bot') || 
      userAgent.includes('crawler') || 
      userAgent.includes('scraper') ||
      userAgent.length < 10 ||
      req.endpoint.includes('admin') ||
      req.endpoint.includes('config') ||
      req.endpoint.includes('wp-') ||
      req.endpoint.includes('phpmyadmin');
    
    return isSuspicious;
  });
  
  if (suspiciousRequests.length > ATTACK_PATTERNS.APP_LAYER.threshold) {
    tracker.attackScores.set('APP_LAYER', ATTACK_PATTERNS.APP_LAYER.score);
    totalAttackScore += ATTACK_PATTERNS.APP_LAYER.score;
  }
  

  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.length < 10) {
    totalAttackScore += 1;
  }
  

  const validEndpoints = [
    '/api/auth/login', '/api/auth/register', '/api/auth/verify-email',
    '/api/auth/forgot-password', '/api/auth/reset-password',
    '/api/listings', '/api/cart', '/api/users', '/api/messages',
    '/api/checkout', '/api/orders', '/api/inventory'
  ];
  
  if (!validEndpoints.includes(endpoint) && !endpoint.startsWith('/api/')) {
    totalAttackScore += 1;
  }
  

  tracker.suspiciousPatterns = Math.max(tracker.suspiciousPatterns, totalAttackScore);
  

  if (totalAttackScore >= 3) {
    suspiciousIPs.set(ip, {
      score: totalAttackScore,
      lastSeen: now,
      patterns: tracker.requests.slice(-10), 
      attackTypes: Array.from(tracker.attackScores.keys())
    });
    
    return {
      isSuspicious: true,
      score: totalAttackScore,
      reason: `Suspicious activity detected: ${totalAttackScore} attack patterns`,
      attackTypes: Array.from(tracker.attackScores.keys())
    };
  }
  
  return { isSuspicious: false, score: totalAttackScore };
};


export const enhancedDdosProtection = async (req, res, next) => {
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
    
    
    const suspiciousCheck = detectSuspiciousActivity(ip, endpoint, method, req);
    
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
          attackTypes: suspiciousCheck.attackTypes,
          requestCount: ipTracker.get(ip)?.requests.length || 0,
          userAgent: req.headers['user-agent'] || 'Unknown',
          referer: req.headers['referer'] || 'Unknown'
        },
        severity: suspiciousCheck.score >= 5 ? 'CRITICAL' : 'HIGH'
      });
      
      
      if (suspiciousCheck.score >= 5) {
        await SecurityLog.blockIp(ip, `Critical attack detected: ${suspiciousCheck.attackTypes.join(', ')}`);
        
        return res.status(403).json({
          error: 'Access denied',
          message: 'Your IP address has been blocked due to critical attack patterns.',
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
    console.error('Enhanced DDoS protection error:', error);
    
    next();
  }
};


export const createEnhancedRateLimit = (windowMs, max, endpoint) => {
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


export const enhancedAuthRateLimit = createEnhancedRateLimit(60 * 1000, 20, 'auth');
export const enhancedApiRateLimit = createEnhancedRateLimit(60 * 1000, 100, 'api');
export const enhancedUploadRateLimit = createEnhancedRateLimit(60 * 1000, 10, 'upload');
export const relaxedGetRateLimit = createEnhancedRateLimit(15 * 60 * 1000, 500, 'relaxed-get');


export const trackEnhancedFailedAuth = (req, res, next) => {
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


export const getIpTracker = () => ipTracker;
export const getSuspiciousIPs = () => suspiciousIPs;
export const getAttackPatterns = () => attackPatterns; 