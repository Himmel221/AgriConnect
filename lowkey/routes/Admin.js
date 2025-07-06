// routes/Admin.js

import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/email.js';

const router = express.Router();

const isAdminMiddleware = (req, res, next) => {
  console.log('Middleware req.user:', req.user); 
  console.log('AdminRoutes userType:', req.user ? req.user.userType : 'No user found'); 
  if (!req.user || (req.user.userType !== 'admin' && req.user.userType !== 'super_admin')) {
    return res.status(403).json({ message: 'Access denied. Admins only!' });
  }
  next();
};

const isSuperAdminMiddleware = (req, res, next) => {
  console.log('SuperAdmin check - userType:', req.user ? req.user.userType : 'No user');
  if (!req.user || req.user.userType !== 'super_admin') {
    return res.status(403).json({ message: 'Access denied. Super admin privileges required!' });
  }
  next();
};

router.post('/create-admin', auth, isSuperAdminMiddleware, async (req, res) => {
  try {
    const { 
      first_name, 
      last_name, 
      email, 
      password, 
      userType = 'admin',
      birthDate 
    } = req.body;

    if (!first_name || !last_name || !email || !password || !birthDate) {
      return res.status(400).json({ 
        message: 'All fields are required: first_name, last_name, email, password, birthDate' 
      });
    }

    if (!['admin', 'super_admin'].includes(userType)) {
      return res.status(400).json({ 
        message: 'userType must be either "admin" or "super_admin"' 
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new User({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: hashedPassword,
      birthDate: new Date(birthDate),
      userType: 'admin'
    });

    await newAdmin.save();

    // Send admin account creation email
    const adminEmailTemplate = createAdminEmailTemplate(first_name, last_name, email, userType);
    const adminEmailText = createAdminEmailText(first_name, last_name, email, userType);
    
    try {
      await sendEmail(
        email,
        `Welcome to AgriConnect - ${userType === 'super_admin' ? 'Super Admin' : 'Admin'} Account Created`,
        adminEmailText,
        adminEmailTemplate
      );
      console.log(`Admin account creation email sent to: ${email}`);
    } catch (emailError) {
      console.error('Error sending admin creation email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: `${userType} created successfully`,
      user: {
        userId: newAdmin.userId,
        first_name: newAdmin.first_name,
        last_name: newAdmin.last_name,
        email: newAdmin.email,
        userType: newAdmin.userType,
        isVerified: newAdmin.isVerified
      }
    });

  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Error creating admin user', error: error.message });
  }
});

router.get('/admins', auth, isAdminMiddleware, async (req, res) => {
  try {
    const admins = await User.find({ 
      userType: { $in: ['admin', 'super_admin'] } 
    }).select('userId first_name last_name email userType isVerified createdAt');

    res.status(200).json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ message: 'Error fetching admins', error: error.message });
  }
});


router.patch('/update-user-type/:userId', auth, isSuperAdminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType } = req.body;

    if (!['user', 'seller', 'admin', 'super_admin'].includes(userType)) {
      return res.status(400).json({ 
        message: 'Invalid userType. Must be: user, seller, admin, or super_admin' 
      });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.userType === 'super_admin' && userType !== 'super_admin') {
      const superAdminCount = await User.countDocuments({ userType: 'super_admin' });
      if (superAdminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot downgrade the last super admin' 
        });
      }
    }

    user.userType = userType;

    await user.save();

    res.status(200).json({
      message: 'User type updated successfully',
      user: {
        userId: user.userId,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        userType: user.userType,
        isSeller: user.userType === 'seller'
      }
    });

  } catch (error) {
    console.error('Error updating user type:', error);
    res.status(500).json({ message: 'Error updating user type', error: error.message });
  }
});

router.get('/dashboard', auth, isAdminMiddleware, async (req, res) => {
  try {
    console.log('AdminRoutes Dashboard Accessed by:', req.user); 
    const usersCount = await User.countDocuments();
    res.status(200).json({
      message: 'Welcome to the admin dashboard!',
      usersCount,
    });
  } catch (error) {
    console.error('Error fetching admin data:', error.message); 
    res.status(500).json({ message: 'Error fetching admin data', error: error.message });
  }
});

router.get('/users', auth, isAdminMiddleware, async (req, res) => {
  try {
    const { email } = req.query; 

    let users;
    if (email) {
      users = await User.find({ email: email.toLowerCase() });
    } else {
      users = await User.find().select(
        'userId first_name last_name email isVerified userType country province cityOrTown barangay bio'
      );
    }

    if (!users.length) {
      return res.status(404).json({ message: 'No users found' });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

router.get('/verify', auth, isAdminMiddleware, (req, res) => {
  res.status(200).json({
    message: 'Admin verified',
    isAdmin: true, 
  });
});

const createAdminEmailTemplate = (firstName, lastName, email, userType) => {
  const roleTitle = userType === 'super_admin' ? 'Super Administrator' : 'Administrator';
  const roleDescription = userType === 'super_admin' 
    ? 'You have been granted Super Administrator privileges with full system access.'
    : 'You have been granted Administrator privileges to manage the platform.';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Admin Account Created - AgriConnect</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4D7C2E 0%, #2E5C1A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4D7C2E; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #4D7C2E; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: white;">🎉 Welcome to AgriConnect!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your ${roleTitle} account has been created</p>
        </div>
        <div class="content">
          <h2>Hello ${firstName} ${lastName},</h2>
          <p>Congratulations! Your ${roleTitle} account has been successfully created on AgriConnect.</p>
          
          <div class="highlight">
            <h3>📧 Account Details:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Role:</strong> ${roleTitle}</p>
            <p><strong>Status:</strong> Account Active</p>
          </div>
          
          <p>${roleDescription}</p>
          
          <h3>🔐 Next Steps:</h3>
          <ul>
            <li>Log in to your account using your email and password</li>
            <li>Change your password immediately for security</li>
            <li>Review and configure your admin settings</li>
            <li>Familiarize yourself with the admin dashboard</li>
          </ul>
          
          <h3>🛡️ Security Reminders:</h3>
          <ul>
            <li>Use a strong, unique password</li>
            <li>Enable two-factor authentication if available</li>
            <li>Never share your admin credentials</li>
            <li>Log out when accessing from shared devices</li>
          </ul>
          
          <p>If you have any questions or need assistance, please contact the system administrator.</p>
          
          <p>Best regards,<br>The AgriConnect Team</p>
        </div>
        <div class="footer">
          <p>This email confirms your ${roleTitle} account creation on AgriConnect.</p>
          <p>&copy; 2024 AgriConnect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const createAdminEmailText = (firstName, lastName, email, userType) => {
  const roleTitle = userType === 'super_admin' ? 'Super Administrator' : 'Administrator';
  const roleDescription = userType === 'super_admin' 
    ? 'You have been granted Super Administrator privileges with full system access.'
    : 'You have been granted Administrator privileges to manage the platform.';
  
  return `
Welcome to AgriConnect!

Hello ${firstName} ${lastName},

Congratulations! Your ${roleTitle} account has been successfully created on AgriConnect.

📧 Account Details:
- Email: ${email}
- Role: ${roleTitle}
- Status: Account Active

${roleDescription}

🔐 Next Steps:
1. Log in to your account using your email and password
2. Change your password immediately for security
3. Review and configure your admin settings
4. Familiarize yourself with the admin dashboard

🛡️ Security Reminders:
- Use a strong, unique password
- Enable two-factor authentication if available
- Never share your admin credentials
- Log out when accessing from shared devices

If you have any questions or need assistance, please contact the system administrator.

Best regards,
The AgriConnect Team

© ${new Date().getFullYear()} AgriConnect. All rights reserved.
  `;
};

export default router;
