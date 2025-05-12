import User from '../models/User.js';

const checkVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Account not verified',
        error: 'VERIFICATION_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Verification check error:', error);
    res.status(500).json({ message: 'Error checking verification status' });
  }
};

export { checkVerification }; 