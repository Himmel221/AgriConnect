// authController.js

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import sendEmail from '../utils/email.js';
import ResetToken from '../models/tokens/reset_token.js';
import VerificationToken from '../models/tokens/verification_token.js';
import nodemailer from 'nodemailer';
import Token from '../models/tokens/login_state_token.js';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_])[A-Za-z\d!@#$%^&*(),.?":{}|<>_]{8,}$/;
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

const registerUser = async (req, res) => {
    console.log(req.body);
    const { first_name, middle_name, last_name, email, password, confirm_password, birthDate } = req.body;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format." });
    }

    if (password !== confirm_password) {
        return res.status(400).json({ message: "Password and confirm password do not match." });
    }

    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
        });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists." });
        }

        const newUser = new User({
            first_name,
            middle_name,
            last_name,
            email,
            password,
            plain_text_password: password,
            birthDate,
            userType: 'user',
            isAdmin: email === 'admin@rioasisland.cloud' ? true : false 
        });

        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);
        console.log('Hashed password:', newUser.password);

        const verificationCode = crypto.randomBytes(16).toString('hex');
        newUser.verificationCode = verificationCode;
        console.log(`Generated verification code for ${email}: ${verificationCode}`);

        await newUser.save();
        console.log(`Saved user: ${newUser}`);

        // Create HTML content for the confirmation email
        const htmlContent = `
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                }
                .header {
                    background-color: #2E7D32;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .content {
                    padding: 30px;
                    background-color: #f9f9f9;
                    border-radius: 0 0 8px 8px;
                }
                .welcome-text {
                    font-size: 24px;
                    color: #2E7D32;
                    margin-bottom: 20px;
                }
                .verification-code {
                    background-color: #e8f5e9;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    text-align: center;
                    font-size: 18px;
                    color: #1b5e20;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eeeeee;
                    color: #666666;
                    font-size: 12px;
                }
                .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #2E7D32;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to AgriConnect!</h1>
                </div>
                <div class="content">
                    <div class="welcome-text">Hello ${first_name} ${last_name},</div>
                    <p>Thank you for registering with AgriConnect! We're excited to have you join our community of farmers and agricultural enthusiasts.</p>
                    <p>To complete your registration, please use the following verification code:</p>
                    <div class="verification-code">
                        ${verificationCode}
                    </div>
                    <p>This code will help us verify your email address and ensure the security of your account.</p>
                    <p>If you didn't create this account, please ignore this email.</p>
                    <div class="footer">
                        <p>This is an automated message, please do not reply to this email.</p>
                        <p>&copy; ${new Date().getFullYear()} AgriConnect. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        const textContent = `
        Welcome to AgriConnect!

        Hello ${first_name} ${last_name},

        Thank you for registering with AgriConnect! We're excited to have you join our community of farmers and agricultural enthusiasts.

        To complete your registration, please use the following verification code:
        ${verificationCode}

        This code will help us verify your email address and ensure the security of your account.

        If you didn't create this account, please ignore this email.

        Â© ${new Date().getFullYear()} AgriConnect. All rights reserved.
        `;

        await sendEmail(
            email,
            'Welcome to AgriConnect - Email Verification',
            textContent,
            htmlContent
        );

        return res.status(200).json({ 
            message: 'User registered successfully. A confirmation email has been sent.',
            success: true
        });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const login = async (req, res) => {
  console.log('Logging in...');
  const { email, password } = req.body;

  console.log('Login attempt:', { email, password });

  try {
      if (!email || !password) {
          return res.status(400).json({ message: "Email and password are required." });
      }

      const user = await User.findOne({ email });

      if (!user) {
          console.log(`User not found for email: ${email}`);
          return res.status(400).json({ message: "Invalid email or password." });
      }

      console.log('Checking password...');
      /*const isPasswordMatch = await bcrypt.compare(password, user.password)*/
      const isPasswordMatch = password === user.plain_text_password;

      if (!isPasswordMatch) {
          console.log(`Invalid password for user: ${email}`);
          return res.status(400).json({ message: "Invalid email or password." });
      }

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      console.log('Login successful for user:', { email, token });

      const tokenDocument = new Token({ owner: user._id, token });
      await tokenDocument.save();

      console.log("Final user object before sending API response:", user);

      return res.status(200).json({
          message: "Login successful",
          token,
          userId: user._id,
          userType: user.userType,
          isVerified: user.isVerified,
          isAdmin: user.isAdmin
      });

  } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const cooldownStore = new Map();

const sendVerificationEmail = async (req, res) => {
  try {
    const { email, attemptCount } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const cooldownKey = `verification_${email}`;
    const cooldownData = cooldownStore.get(cooldownKey);
    
    if (cooldownData) {
      const remainingTime = Math.ceil((cooldownData.expiresAt - Date.now()) / 1000);
      if (remainingTime > 0) {
        return res.status(429).json({ 
          message: 'Please wait before requesting another verification email',
          remainingTime
        });
      }
    }

    if (attemptCount > 4) {
      return res.status(429).json({ 
        message: 'Maximum verification attempts reached. Please try again later.' 
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Set cooldown timer based on attempt count
    const cooldownDuration = attemptCount <= 3 ? 180 : 900; // 3 minutes or 15 minutes
    cooldownStore.set(cooldownKey, {
      expiresAt: Date.now() + (cooldownDuration * 1000),
      attemptCount
    });

    // Clean up expired cooldowns periodically
    setTimeout(() => {
      cooldownStore.delete(cooldownKey);
    }, cooldownDuration * 1000);

    // Create HTML content for the verification email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32; text-align: center;">Welcome to AgriConnect!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">
          Thank you for registering. To complete your registration and verify your email address, 
          please use the verification code below:
        </p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #2E7D32; margin: 0; letter-spacing: 5px;">${verificationToken.substring(0, 6)}</h1>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">
          This code will expire in 24 hours.
        </p>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">
            Â© ${new Date().getFullYear()} AgriConnect. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const textContent = `
      Welcome to AgriConnect!

      Thank you for registering. To complete your registration and verify your email address, 
      please use the verification code below:

      ${verificationToken.substring(0, 6)}

      This code will expire in 24 hours.

      Â© ${new Date().getFullYear()} AgriConnect. All rights reserved.
    `;

    await sendEmail(
      email,
      'Verify Your Email Address',
      textContent,
      htmlContent
    );

    res.json({ 
      message: 'Verification email sent successfully',
      attemptCount: attemptCount,
      cooldownDuration
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ message: 'Error sending verification email' });
  }
};

const verifyEmail = async (req, res) => {
    const { email, token: inputCode } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.log('User not found for email:', email); 
        return res.status(404).json({ message: 'User not found.' });
      }
  
      console.log('Received Code:', inputCode); 
      console.log('Stored Code:', user.verificationCode); 
  
      if (!user.verificationCode || user.verificationCode !== inputCode) {
        return res.status(400).json({ message: 'Invalid or expired verification code.' });
      }
  
      user.isVerified = true;
      user.verificationCode = undefined; 
      await user.save();
  
      res.status(200).json({ message: 'Email verified successfully.' });
    } catch (error) {
      console.error('Error in verifyEmail:', error.message); 
      res.status(500).json({ message: 'Error verifying email.', error: error.message });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
  
    try {
      if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
      }
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      await ResetToken.deleteMany({ owner: user._id });
  
      const token = crypto.randomBytes(32).toString('hex');
      const resetToken = new ResetToken({ owner: user._id, token });
      await resetToken.save();
  
      console.log(`Password Reset Request: 
      - User ID: ${user._id}
      - Reset Token: ${token}`);
  
      const resetLink = `http://localhost:3000/reset-password?token=${encodeURIComponent(token)}&id=${user._id}`;
      
      const htmlContent = `
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #dddddd;
              border-radius: 5px;
            }
            .header {
              text-align: center;
              padding-bottom: 15px;
              border-bottom: 1px solid #eeeeee;
            }
            .content {
              padding: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #4A90E2;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 15px 0;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Password Reset Request</h2>
            </div>
            <div class="content">
              <p>Hello ${user.name || 'Valued User'},</p>
              <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
              <p>To reset your password, please click the button below:</p>
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Reset My Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p>${resetLink}</p>
              <p>This link will expire in 1 hour for security reasons.</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} AgriConnect. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    
      const textContent = `
  Hello ${user.name || 'Valued User'},
  
  We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
  
  To reset your password, please use the following link:
  ${resetLink}
  
  This link will expire in 1 hour for security reasons.
  
  This is an automated message, please do not reply to this email.
  
  Â© ${new Date().getFullYear()} AgriConnect. All rights reserved.
      `;
  
      await sendEmail(
        user.email,
        'Password Reset Request - AgriConnect',
        textContent, 
        htmlContent
      );
  
      return res.status(200).json({
        message: 'The password reset link has been sent to your email. Please check your inbox.',
      });
    } catch (error) {
      console.error('Error in forgotPassword:', error.message);
      res.status(500).json({ message: 'An error occurred. Please try again later.' });
    }
  };

const resetPassword = async (req, res) => {
    const { token, userId, newPassword } = req.body;
    try {
        const resetToken = await ResetToken.findOne({ owner: userId });
        if (!resetToken) {
            return res.status(400).json({ message: "Invalid or expired password reset token" });
        }

        if (resetToken.token !== token) {
            return res.status(400).json({ message: "Invalid or expired password reset token" });
        }

        const user = await User.findById(userId);
        if (user) {
            user.password = await bcrypt.hash(newPassword, 10);
            user.plain_text_password = newPassword;
            await user.save();
            await ResetToken.deleteOne({ owner: userId });

            return res.status(200).json({ message: "Password reset successful" });
        }

        return res.status(404).json({ message: "User not found." });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const resendVerificationCode = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const verificationCode = crypto.randomBytes(16).toString('hex');
        user.verificationCode = verificationCode;
        await user.save();

        await sendEmail(user.email, 'Email Verification', `Please use the following code to verify your email: ${verificationCode}`);
        
        return res.status(200).json({ message: 'Verification code resent successfully' });
    } catch (error) {
        console.error('Error resending verification code:', error);
        res.status(500).json({ message: 'Error resending verification code' });
    }
};

const getUser = async (req, res) => {
    const userId = req.userId;

    try {
        console.log(userId);
        console.log('getting user');
        const user = await User.findById(userId);
        console.log(user);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error('Error retrieving user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getSellerStatus = async (req, res) => {
  try {
      console.log("Fetching seller status for:", req.userId);
      const user = await User.findById(req.userId).select("isSeller");

      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      console.log("Returning isSeller:", user.isSeller);
      return res.status(200).json({ isSeller: user.isSeller });
  } catch (error) {
      console.error("Error retrieving seller status:", error);
      return res.status(500).json({ message: "Server error" });
  }
};

export { 
    registerUser, 
    login, 
    sendVerificationEmail, 
    verifyEmail, 
    forgotPassword, 
    resetPassword, 
    resendVerificationCode, 
    getUser,
    getSellerStatus
};