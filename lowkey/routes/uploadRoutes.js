import express from 'express';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Route to handle image uploads to Cloudinary
router.post('/images', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    // The Cloudinary URL is available in req.file.path with multer-storage-cloudinary
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

export default router;  