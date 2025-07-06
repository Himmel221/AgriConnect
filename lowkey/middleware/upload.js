

import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import rateLimit from 'express-rate-limit';


const MAX_FILE_SIZE = 3 * 1024 * 1024; 
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILES_PER_REQUEST = 1;
const UPLOAD_RATE_LIMIT = 10; 


const fileFilter = (req, file, cb) => {

  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type. Only ${ALLOWED_FILE_TYPES.join(', ')} are allowed.`), false);
  }
  

  if (file.size > MAX_FILE_SIZE) {
    return cb(new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`), false);
  }
  

  if (file.originalname.length > 255) {
    return cb(new Error('Filename too long.'), false);
  }
  

  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar'];
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (suspiciousExtensions.includes(fileExtension)) {
    return cb(new Error('Suspicious file type detected.'), false);
  }
  
  cb(null, true);
};


const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
    transformation: [
      { width: 1920, height: 1080, crop: 'limit' }, 
      { quality: 'auto:good' }, 
      { fetch_format: 'auto' } 
    ],
    resource_type: 'image',
    invalidate: true 
  },
});


const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_PER_REQUEST,
    fieldNameSize: 100,
    fieldSize: 1024 * 1024, 
    fields: 10,
    parts: 20,
    headerPairs: 2000
  },
  preservePath: false
});


export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: UPLOAD_RATE_LIMIT, 
  message: {
    error: 'Too many upload requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP address
    return req.user ? req.user._id : req.ip;
  }
});

export const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            return res.status(413).json({
              error: 'File too large',
              message: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
              code: 'FILE_SIZE_LIMIT'
            });
          case 'LIMIT_FILE_COUNT':
            return res.status(413).json({
              error: 'Too many files',
              message: `Maximum ${MAX_FILES_PER_REQUEST} file(s) allowed`,
              code: 'FILE_COUNT_LIMIT'
            });
          case 'LIMIT_UNEXPECTED_FILE':
            return res.status(400).json({
              error: 'Unexpected file field',
              message: 'Invalid file field name',
              code: 'INVALID_FIELD'
            });
          default:
            return res.status(400).json({
              error: 'File upload error',
              message: err.message,
              code: 'UPLOAD_ERROR'
            });
        }
      } else if (err) {
        return res.status(400).json({
          error: 'File validation error',
          message: err.message,
          code: 'VALIDATION_ERROR'
        });
      }
      
      next();
    });
  };
};

export const uploadTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request timeout',
          message: 'Upload request timed out',
          code: 'TIMEOUT'
        });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

export const sanitizeUpload = (req, res, next) => {
  if (req.file) {
    delete req.file.buffer;
    delete req.file.stream;
    
    if (req.file.originalname) {
      req.file.originalname = req.file.originalname
        .replace(/[^a-zA-Z0-9._-]/g, '')
        .substring(0, 255);
    }
  }
  
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim().substring(0, 1000);
      }
    });
  }
  
  next();
};

export default upload;