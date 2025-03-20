const jwt = require('jsonwebtoken');
const Token = require('../models/tokens/login_state_token');
const User = require('../models/User');

const auth = async (req, res, next) => {
  const authHeader = req.header('Authorization'); 
  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  const token = authHeader.replace('Bearer ', ''); 

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);

    const storedToken = await Token.findOne({ owner: decoded.userId, token });
    if (!storedToken) {
      console.log('Token not found in database.');
      return res.status(401).json({ message: 'Invalid token, please authenticate again.' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('User not found for decoded userId:', decoded.userId);
      return res.status(404).json({ message: 'User not found. Please verify your email.' });
    }

    req.userId = decoded.userId;
    req.user = { _id: user._id, email: user.email };
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message || error);
    res.status(401).json({ message: 'Please authenticate. Invalid or expired token.' });
  }
};

module.exports = auth;
