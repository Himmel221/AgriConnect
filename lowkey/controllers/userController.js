/* userController.js */

import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/email.js';
import crypto from 'crypto';

export async function loginUser(req, res) {
  const { email, password } = req.body;

  console.log(email, password);
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    await new Token({ owner: user._id, token }).save();

    return res.status(200).json({
      message: 'Login successful',
      token,
      userType: user.userType,

    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function createUser(req, res) {
  const { first_name, middle_name, last_name, email, password, birthDate, country = 'Philippines', province, cityOrTown, barangay, bio } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'This email is already registered.' });
  }

  try {
    const newUser = new User({
      first_name,
      middle_name,
      last_name,
      email,
      password,
      plain_text_password: password,
      birthDate,
      country,
      province,
      cityOrTown,
      barangay,
      bio
    });

    const otp = [...Array(4)].map(() => Math.floor(Math.random() * 10)).join('');
    newUser.otp = otp;
    newUser.otpExpires = Date.now() + 3600000;

    await newUser.save();
    await sendEmail(email, 'AgriConnect OTP', `Your OTP code is ${otp}. Expires in 1 hour.`);

    res.status(200).json({ message: 'Check your email for OTP verification!' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error. Could not create user.' });
  }
}

export async function verifyOTP(req, res) {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
  if (user.otpExpires < Date.now()) return res.status(400).json({ message: 'OTP has expired' });

  user.isActive = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.json({ message: 'User verified successfully!' });
}

export async function signin(req, res) {
  const { email, password } = req.body;
  if (!email.trim() || !password.trim()) return res.status(400).json({ message: 'Email/password missing' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.isActive) return res.status(400).json({ message: 'User account is not active' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

  const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });

  res.json({ token });
}

export async function updateSellerStatus(req, res) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isSeller = req.body.isSeller;
    await user.save();

    res.status(200).json({ message: 'Seller status updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating seller status', error: error.message });
  }
}

export async function updateUser(req, res) {
  const { country, province, cityOrTown, barangay, bio, ...rest } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    Object.assign(user, {
      ...rest,
      country: country || user.country,
      province: province || user.province,
      cityOrTown: cityOrTown || user.cityOrTown,
      barangay: barangay || user.barangay,
      bio: bio || user.bio
    });

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error. Could not update user.' });
  }
}

export async function searchUsers(req, res) {
  const { query } = req.params;

  try {
    const users = await User.find({
      $or: [
        { first_name: { $regex: query, $options: 'i' } },
        { last_name: { $regex: query, $options: 'i' } },
      ],
    }).select('_id first_name last_name email userId');

    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error.message);
    res.status(500).json({ error: "Failed to search users" });
  }
}

export async function getUserSellerStatus(req, res) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('isSeller');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ isSeller: user.isSeller });
  } catch (error) {
    console.error('Error fetching user seller status:', error.message);
    res.status(500).json({ message: 'Error fetching seller status', error: error.message });
  }
}