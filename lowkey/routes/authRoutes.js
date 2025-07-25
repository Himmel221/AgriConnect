// authRoutes.js

import express from 'express';
import { login, registerUser, verifyEmail, forgotPassword, resetPassword, resendVerificationCode, sendVerificationEmail, getUser } from '../controllers/authController.js';
import auth, { refreshToken } from '../middleware/auth.js';
import AdminRoutes from './Admin.js';
import User from '../models/User.js';
import { getSellerStatus } from '../controllers/authController.js';
import { registerSchema } from '../validation/schemas.js';
import { validateBody } from '../middleware/validate.js';
import { checkIPBan } from '../middleware/ipBan.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', validateBody(registerSchema), checkIPBan, registerUser);
router.post('/verify-email', verifyEmail);  
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-verification-code', resendVerificationCode);
router.post('/send-verification-email', sendVerificationEmail);
router.post('/refresh-token', refreshToken);
router.get('/user', auth, getUser);
router.get("/seller-status", auth, getSellerStatus);

router.use('/admin', AdminRoutes);

router.get("/me", auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select("-password"); 
      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

export default router;