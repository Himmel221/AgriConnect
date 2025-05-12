import express from 'express';
import auth from '../middleware/auth.js';
import { getConversations, getMessages, sendMessage, addReaction, removeReaction, markMessagesAsRead } from '../controllers/messageController.js';
import { searchUsers } from '../controllers/userController.js';
import upload from '../middleware/upload.js';
import { checkVerification } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(auth);
router.use(checkVerification);

router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    const imageUrl = req.file.path;
    
    return res.status(201).json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Error uploading image', error: error.message });
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