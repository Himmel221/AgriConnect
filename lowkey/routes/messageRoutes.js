import express from 'express';
import auth from '../middleware/auth.js';
import { getConversations, getMessages, sendMessage, addReaction, removeReaction, markMessagesAsRead } from '../controllers/messageController.js';
import { searchUsers } from '../controllers/userController.js';
import upload, { 
  uploadRateLimit, 
  handleUpload, 
  uploadTimeout, 
  sanitizeUpload 
} from '../middleware/upload.js';
import { checkVerification } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

router.use(auth);
router.use(checkVerification);

const messageUploadRateLimit = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  message: {
    error: 'Too many uploads',
    message: 'You can only upload up to 10 images per minute in chat. Please wait and try again.',
    code: 'MESSAGE_UPLOAD_RATE_LIMIT'
  },
  keyGenerator: (req) => req.user ? req.user._id : req.ip
});

const secureMessageUpload = [
  auth,
  messageUploadRateLimit,
  uploadRateLimit,
  uploadTimeout(30000), 
  handleUpload(upload.single('image')),
  sanitizeUpload
];

router.post('/upload', secureMessageUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No image file provided',
        message: 'Please select an image file to upload',
        code: 'NO_FILE'
      });
    }

    if (!req.file.path || !req.file.filename) {
      return res.status(500).json({ 
        error: 'File upload failed',
        message: 'File was not properly uploaded to storage',
        code: 'UPLOAD_FAILED'
      });
    }
    
    const imageUrl = req.file.path;

    console.log(`[SECURE_MESSAGE_UPLOAD] User ${req.user._id} uploaded message image: ${req.file.filename}`);
    
    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('[MESSAGE_UPLOAD_ERROR]', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Error processing image upload',
      code: 'INTERNAL_ERROR'
    });
  }
});

router.get('/users/search/:query', auth, searchUsers);

router.get('/:senderId/conversations', auth, getConversations);
router.get('/:senderId/:recipientId', auth, getMessages);
router.post('/', auth, sendMessage);

router.put('/:senderId/:recipientId/read', auth, markMessagesAsRead);

router.post('/:messageId/reactions', auth, addReaction);
router.delete('/:messageId/reactions', auth, removeReaction);

export default router;