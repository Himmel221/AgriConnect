import express from 'express';
import auth from '../middleware/auth.js';
import upload, { 
  uploadRateLimit, 
  handleUpload, 
  uploadTimeout, 
  sanitizeUpload 
} from '../middleware/upload.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const generalUploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, 
  message: {
    error: 'Too many uploads',
    message: 'You can only upload up to 10 images per minute. Please wait and try again.',
    code: 'GENERAL_UPLOAD_RATE_LIMIT'
  },
  keyGenerator: (req) => req.user ? req.user._id : req.ip
});

const secureUpload = [
  auth,
  generalUploadRateLimit,
  uploadRateLimit,
  uploadTimeout(30000), // 30 second timeout
  handleUpload(upload.single('image')),
  sanitizeUpload
];

router.post('/images', secureUpload, (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ 
        error: 'No image file provided',
        message: 'Please select an image file to upload',
        code: 'NO_FILE'
      });
    }
    
    // Validate file properties
    if (!req.file.path || !req.file.filename) {
      return res.status(500).json({ 
        error: 'File upload failed',
        message: 'File was not properly uploaded to storage',
        code: 'UPLOAD_FAILED'
      });
    }
    
    const imageUrl = req.file.path;
    
    console.log(`[SECURE_UPLOAD] User ${req.user._id} uploaded image: ${req.file.filename}`);
    
    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('[UPLOAD_ERROR]', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Error processing image upload',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;  