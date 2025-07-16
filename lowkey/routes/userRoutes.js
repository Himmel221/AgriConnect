//userRoutes.js

import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import adminMiddleware from '../middleware/adminMiddleware.js'; 
import { searchUsers, getUserSellerStatus } from '../controllers/userController.js';
import AuditLogger from '../utils/auditLogger.js';

const router = express.Router();

router.get('/:userId', auth, async (req, res) => {
  const { userId } = req.params;

  try {
   
    const user = await User.findOne({ userId: userId, isDeleted: false }).select(
      'first_name last_name email birthDate country province cityOrTown barangay bio createdAt userType isBanned bannedAt banReason'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user data in userroutesget:', error.message);
    res.status(500).json({ message: 'Error fetching user data', error: error.message });
  }
});

router.delete('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress || 
                     req.ip || 
                     'unknown';
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Only allow self-delete or admin
    if (user._id.toString() !== req.userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own account.' });
    }
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.userId;
    await user.save();
    
    // Log the soft delete action
    await AuditLogger.logSoftDelete('User', user._id.toString(), req.userId, 'User account soft deleted', ipAddress);
    
    res.status(200).json({ message: 'User soft-deleted successfully.' });
  } catch (error) {
    console.error('Error soft-deleting user:', error.message);
    res.status(500).json({ message: 'Error soft-deleting user.', error: error.message });
  }
});


router.get('/admin/users', auth, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select(
      'userId first_name last_name email isVerified userType country province cityOrTown barangay bio isBanned bannedAt banReason'
    );

    if (!users.length) {
      return res.status(404).json({ message: 'No users found' });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

router.patch('/approve-seller/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress || 
                     req.ip || 
                     'unknown';
    
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Cannot approve seller role: Email is not verified.' });
    }

    const oldRole = user.userType;
    user.userType = 'seller';
    await user.save();

    // Log the role change
    await AuditLogger.logUserRoleChange(user._id, oldRole, 'seller', req.userId, 'Approved as seller', ipAddress);

    res.status(200).json({ message: 'User approved as seller', user });
  } catch (error) {
    console.error('Error approving seller:', error.message);
    res.status(500).json({ message: 'Server error while approving seller', error: error.message });
  }
});

router.patch('/remove-seller/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress || 
                     req.ip || 
                     'unknown';
    
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRole = user.userType;
    user.userType = 'user';
    await user.save();

    // Log the role change
    await AuditLogger.logUserRoleChange(user._id, oldRole, 'user', req.userId, 'Removed seller role', ipAddress);

    res.status(200).json({ message: 'Seller role removed successfully', user });
  } catch (error) {
    console.error('Error removing seller role:', error.message);
    res.status(500).json({ message: 'Server error while removing seller role', error: error.message });
  }
});

router.put('/user', auth, async (req, res) => {
  const userId = req.userId;
  console.log('User ID:', userId); 
  console.log('Request Body:', req.body); 

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { country, province, cityOrTown, barangay, bio, ...rest } = req.body;

    Object.assign(user, {
      ...rest,
      country: country || user.country,
      province: province || user.province,
      cityOrTown: cityOrTown || user.cityOrTown,
      barangay: barangay || user.barangay,
      bio: bio || user.bio,
    });

    await user.save();
    console.log('Updated User:', user); 
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

router.get('/seller-status/:userId', auth, getUserSellerStatus);

router.get('/search/:query', auth, searchUsers);

// Add ban/unban endpoints (admin only)
router.patch('/ban/:userId', auth, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress || 
                     req.ip || 
                     'unknown';
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.isBanned) {
      return res.status(400).json({ message: 'User is already banned' });
    }
    user.isBanned = true;
    user.bannedAt = new Date();
    user.bannedBy = req.userId;
    user.banReason = reason || '';
    await user.save();
    
    // Log the ban action
    await AuditLogger.logUserBan(user._id, req.userId, reason || 'No reason provided', ipAddress);
    
    res.status(200).json({ message: 'User banned successfully.' });
  } catch (error) {
    console.error('Error banning user:', error.message);
    res.status(500).json({ message: 'Error banning user.', error: error.message });
  }
});

router.patch('/unban/:userId', auth, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress || 
                     req.ip || 
                     'unknown';
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.isBanned) {
      return res.status(400).json({ message: 'User is not banned' });
    }
    user.isBanned = false;
    user.bannedAt = null;
    user.bannedBy = null;
    user.banReason = '';
    await user.save();
    
    // Log the unban action
    await AuditLogger.logUserUnban(user._id, req.userId, reason || 'No reason provided', ipAddress);
    
    res.status(200).json({ message: 'User unbanned successfully.' });
  } catch (error) {
    console.error('Error unbanning user:', error.message);
    res.status(500).json({ message: 'Error unbanning user.', error: error.message });
  }
});

export default router;
