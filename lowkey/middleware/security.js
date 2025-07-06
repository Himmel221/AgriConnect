// security.js - Comprehensive security middleware

import helmet from 'helmet';
import csrf from 'csurf';
import DOMPurify from 'isomorphic-dompurify';

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for React
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow external resources
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
});

// CSRF protection middleware
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'], // Don't require CSRF for these methods
  ignorePaths: ['/api/auth/login', '/api/auth/register'] // Don't require CSRF for auth endpoints
});

// CSRF error handler
export const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
      code: 'CSRF_ERROR'
    });
  }
  next(err);
};

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove HTML tags and dangerous characters
        req.body[key] = DOMPurify.sanitize(req.body[key], {
          ALLOWED_TAGS: [], // No HTML tags allowed
          ALLOWED_ATTR: []  // No attributes allowed
        }).trim();
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = DOMPurify.sanitize(req.query[key], {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: []
        }).trim();
      }
    });
  }

  next();
};

// Rate limiting for CSRF token requests
export const csrfTokenRateLimit = (req, res, next) => {
  // Simple rate limiting for CSRF token requests
  const clientIP = req.ip;
  const now = Date.now();
  
  if (!req.app.locals.csrfTokenRequests) {
    req.app.locals.csrfTokenRequests = new Map();
  }
  
  const requests = req.app.locals.csrfTokenRequests;
  const clientRequests = requests.get(clientIP) || [];
  
  // Remove requests older than 1 minute
  const recentRequests = clientRequests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= 10) {
    return res.status(429).json({
      error: 'Too many CSRF token requests',
      message: 'Please wait before requesting another CSRF token.',
      code: 'CSRF_RATE_LIMIT'
    });
  }
  
  recentRequests.push(now);
  requests.set(clientIP, recentRequests);
  
  next();
};

// CSRF token endpoint
export const getCsrfToken = (req, res) => {
  res.json({
    csrfToken: req.csrfToken(),
    message: 'CSRF token generated successfully'
  });
};

// Validate CSRF token middleware
export const validateCsrfToken = (req, res, next) => {
  // Skip CSRF validation for certain endpoints
  const skipPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email'
  ];
  
  if (skipPaths.includes(req.path)) {
    return next();
  }
  
  // For other endpoints, validate CSRF token
  if (!req.headers['x-csrf-token']) {
    return res.status(403).json({
      error: 'CSRF token missing',
      message: 'CSRF token is required for this request.',
      code: 'CSRF_MISSING'
    });
  }
  
  // The csrf middleware will handle the actual validation
  next();
};

// Content type validation
export const validateContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Invalid content type',
        message: 'Content-Type must be application/json',
        code: 'INVALID_CONTENT_TYPE'
      });
    }
  }
  next();
};

// Request size validation
export const validateRequestSize = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 1024 * 1024; // 1MB
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Request too large',
      message: 'Request body exceeds maximum size of 1MB',
      code: 'REQUEST_TOO_LARGE'
    });
  }
  next();
};

// Security logging middleware
export const securityLogging = (req, res, next) => {
  const securityInfo = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    referer: req.headers['referer'],
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length']
  };
  
  // Log suspicious requests
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i
  ];
  
  const requestBody = JSON.stringify(req.body);
  const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
    pattern.test(requestBody) || pattern.test(req.path)
  );
  
  if (hasSuspiciousContent) {
    console.warn('Suspicious request detected:', securityInfo);
  }
  
  next();
};

// Export all security middleware
export const securityMiddleware = [
  securityHeaders,
  validateContentType,
  validateRequestSize,
  sanitizeInput,
  securityLogging
]; 