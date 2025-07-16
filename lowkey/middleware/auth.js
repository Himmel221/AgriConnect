// auth.js 

import jwt from 'jsonwebtoken';
import Token from '../models/tokens/login_state_token.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  const authHeader = req.header('Authorization'); 
  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  const token = authHeader.replace('Bearer ', ''); 

  try {

    const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ 
        message: 'Token has been invalidated. Please login again.',
        code: 'TOKEN_BLACKLISTED'
      });
    }


    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);


    const storedToken = await Token.findOne({ owner: decoded.userId, token });
    if (!storedToken) {
      console.log('Token not found in database.');
      return res.status(401).json({ 
        message: 'Invalid token, please authenticate again.',
        code: 'TOKEN_NOT_FOUND'
      });
    }


    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('User not found for decoded userId:', decoded.userId);
      return res.status(404).json({ 
        message: 'User not found. Please verify your email.',
        code: 'USER_NOT_FOUND'
      });
    }


    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Account not verified. Please verify your email first.',
        code: 'ACCOUNT_NOT_VERIFIED'
      });
    }


    user.lastAccessedAt = new Date();
    await user.save();

    req.userId = decoded.userId;
    req.user = { 
      _id: user._id, 
      email: user.email, 
      isAdmin: user.isAdmin,
      userType: user.userType,
      isVerified: user.isVerified
    };
    console.log("User from DB:", user);
    console.log("Final Auth Middleware User:", req.user);
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message || error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token format.',
        code: 'INVALID_TOKEN'
      });
    }
    
    res.status(401).json({ 
      message: 'Please authenticate. Invalid or expired token.',
      code: 'AUTH_ERROR'
    });
  }
};


export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } 
  );
};


export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } 
  );
};


export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      message: 'Refresh token is required',
      code: 'REFRESH_TOKEN_MISSING'
    });
  }

  try {

    const isBlacklisted = await TokenBlacklist.isBlacklisted(refreshToken);
    if (isBlacklisted) {
      return res.status(401).json({
        message: 'Refresh token has been invalidated',
        code: 'REFRESH_TOKEN_BLACKLISTED'
      });
    }


    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        message: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }


    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }


    const newAccessToken = generateAccessToken(decoded.userId);
    

    const tokenDocument = new Token({ 
      owner: decoded.userId, 
      token: newAccessToken 
    });
    await tokenDocument.save();

    res.json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Refresh token has expired. Please login again.',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }
    
    res.status(401).json({
      message: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
};


export const logout = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const refreshToken = req.body.refreshToken;

    if (token) {

      await TokenBlacklist.blacklistToken(token, req.userId, 'LOGOUT');
      

      await Token.deleteOne({ owner: req.userId, token });
    }

    if (refreshToken) {

      await TokenBlacklist.blacklistToken(refreshToken, req.userId, 'LOGOUT');
    }

    res.json({
      message: 'Logged out successfully',
      code: 'LOGOUT_SUCCESS'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      message: 'Error during logout',
      code: 'LOGOUT_ERROR'
    });
  }
};


export const logoutAll = async (req, res) => {
  try {
    const userId = req.userId;


    const activeTokens = await Token.find({ owner: userId });
    

    for (const tokenDoc of activeTokens) {
      await TokenBlacklist.blacklistToken(tokenDoc.token, userId, 'SECURITY');
    }

    
    await Token.deleteMany({ owner: userId });

    res.json({
      message: 'All sessions logged out successfully',
      code: 'LOGOUT_ALL_SUCCESS'
    });

  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      message: 'Error during logout all',
      code: 'LOGOUT_ALL_ERROR'
    });
  }
};

export default auth;