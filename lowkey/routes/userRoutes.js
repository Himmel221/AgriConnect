import express from 'express';
import auth from '../middleware/auth.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/:userId', auth, async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select(
      'first_name last_name email birthDate country province cityOrTown barangay bio createdAt'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user data:', error.message);
    res.status(500).json({ message: 'Error fetching user data', error: error.message });
  }
});

router.get('/users', auth, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select(
      'userId first_name last_name email isVerified isSeller country province cityOrTown barangay bio'
    );

    if (!users.length) {
      return res.status(404).json({ message: 'No users found' });
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

router.patch('/approve-seller/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Cannot approve seller role: Email is not verified.' });
    }

    user.isSeller = true;
    await user.save();

    res.status(200).json({ message: 'User approved as seller', user });
  } catch (error) {
    console.error('Error approving seller:', error.message);
    res.status(500).json({ message: 'Server error while approving seller', error: error.message });
  }
});

router.patch('/remove-seller/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isSeller = false;
    await user.save();

    res.status(200).json({ message: 'Seller role removed successfully', user });
  } catch (error) {
    console.error('Error removing seller role:', error.message);
    res.status(500).json({ message: 'Server error while removing seller role', error: error.message });
  }
});

router.put('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

export default router;