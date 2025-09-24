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
import { generateAccessToken, generateRefreshToken } from '../middleware/auth.js';
import { checkEmail } from '../utils/emailValidation.js';
import axios from 'axios';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_])[A-Za-z\d!@#$%^&*(),.?":{}|<>_]{8,}$/;
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;


const cooldownStore = new Map();
const MAX_RESEND_ATTEMPTS = 5;
const RESEND_COOLDOWN_MINUTES = 15;
const VERIFICATION_EXPIRY_MINUTES = 15;


setInterval(() => {
  const now = Date.now();
  for (const [key, data] of cooldownStore.entries()) {
    if (data.expiresAt < now) {
      cooldownStore.delete(key);
    }
  }
}, 5 * 60 * 1000);


const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


const createVerificationEmailTemplate = (firstName, lastName, verificationCode) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email Verification - AgriConnect</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4D7C2E; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .verification-code { background: #fff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 24px; font-weight: bold; color: #4D7C2E; border: 2px dashed #4D7C2E; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: white;">AgriConnect</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Email Verification</p>
        </div>
        <div class="content">
          <h2>Hello ${firstName} ${lastName},</h2>
          <p>Please verify your email address using the verification code below:</p>
          
          <div class="verification-code">
            ${verificationCode}
          </div>
          
          <div class="warning">
            <strong>Important:</strong> This verification code will expire in 15 minutes. If you didn't request this code, please ignore this email.
          </div>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>The AgriConnect Team</p>
        </div>
        <div class="footer">
          <p>This email was sent to verify your AgriConnect account.</p>
          <p>&copy; 2024 AgriConnect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const createVerificationTextTemplate = (firstName, lastName, verificationCode) => {
  return `
Welcome to AgriConnect!

Hello ${firstName} ${lastName},

Thank you for registering with AgriConnect! We're excited to have you join our community of farmers and agricultural enthusiasts.

To complete your registration, please use the following verification code:
${verificationCode}

⚠️ Important: This verification code will expire in ${VERIFICATION_EXPIRY_MINUTES} minutes for security reasons.

This code will help us verify your email address and ensure the security of your account.

If you didn't create this account, please ignore this email.

© ${new Date().getFullYear()} AgriConnect. All rights reserved.
  `;
};

const createRegistrationConfirmationTemplate = (firstName, lastName, email) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Account Created Successfully - AgriConnect</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4D7C2E; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4D7C2E; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: white;">AgriConnect</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Account Created Successfully</p>
        </div>
        <div class="content">
          <h2>Hello ${firstName} ${lastName},</h2>
          <p>Your AgriConnect account has been created successfully.</p>
          
          <div class="highlight">
            <h3>Account Details:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Status:</strong> Account Created</p>
            <p><strong>Next Step:</strong> Email Verification Required</p>
          </div>
          
          <p>To complete your registration, please verify your email address in your account settings.</p>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>The AgriConnect Team</p>
        </div>
        <div class="footer">
          <p>This email confirms your successful account creation on AgriConnect.</p>
          <p>&copy; 2024 AgriConnect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const createRegistrationConfirmationText = (firstName, lastName, email) => {
  return `
Welcome to AgriConnect!

Hello ${firstName} ${lastName},

Congratulations! You have successfully created an account on AgriConnect.

📧 Account Details:
- Email: ${email}
- Status: Account Created
- Next Step: Email Verification Required

Welcome to our trusted agricultural marketplace! We're excited to have you join our community of farmers, buyers, and agricultural enthusiasts.

🚀 What You Can Do Next:
1. Verify your email address in your account settings
2. Complete your profile with additional information
3. Browse agricultural products and listings
4. Connect with other farmers and buyers
5. Start buying and selling agricultural products

🔐 Security Tips:
- Use a strong, unique password
- Verify your email address for account security
- Keep your account information up to date
- Report any suspicious activity immediately

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The AgriConnect Team

© ${new Date().getFullYear()} AgriConnect. All rights reserved.
  `;
};

const registerUser = async (req, res) => {
    //console.log(req.body);
    const { first_name, middle_name, last_name, email, password, confirm_password, birthDate } = req.body;


    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';

    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format." });
    }


    const emailValidation = await checkEmail(email, clientIP);
    if (!emailValidation.isValid) {
        return res.status(400).json({ 
            message: emailValidation.error,
            banInfo: emailValidation.banInfo || null
        });
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

        let birthDateObj;
        if (typeof birthDate === 'string') {

          const dateStr = birthDate.trim();
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {

            birthDateObj = new Date(dateStr + 'T00:00:00.000Z');
          } else {
            birthDateObj = new Date(dateStr);
          }
        } else {
          birthDateObj = birthDate;
        }
        
        
        if (isNaN(birthDateObj.getTime())) {
            return res.status(400).json({ message: "Invalid birth date format. Please use YYYY-MM-DD format." });
        }
        
        
        const now = new Date();
        const minDate = new Date(1900, 0, 1);
        const maxDate = new Date();
        
        if (birthDateObj > maxDate) {
            return res.status(400).json({ message: "Birth date cannot be in the future." });
        }
        
        if (birthDateObj < minDate) {
            return res.status(400).json({ message: "Birth date seems too far in the past." });
        }

        const newUser = new User({
            first_name,
            middle_name,
            last_name,
            email,
            password,
            birthDate: birthDateObj,
            userType: 'user'
        });

        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);
        //console.log('Hashed password:', newUser.password);

        await newUser.save();
        //console.log(`Saved user: ${newUser}`);

        
        try {
            const confirmationHtml = createRegistrationConfirmationTemplate(first_name, last_name, email);
            const confirmationText = createRegistrationConfirmationText(first_name, last_name, email);

            await sendEmail(
                email,
                'Welcome to AgriConnect - Account Created Successfully!',
                confirmationText,
                confirmationHtml
            );
            //console.log('Confirmation email sent to:', email);

            return res.status(200).json({ 
                message: 'User registered successfully. A confirmation email has been sent.',
                success: true
            });
        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
                
            return res.status(200).json({ 
                message: 'User registered successfully. Email confirmation may be delayed.',
                success: true
            });
        }

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const login = async (req, res) => {
  console.log('Attempting to login,.');
  const { email, password } = req.body;

  //console.log('Login attempt email:', email);
  //console.log('Provided password:', password ? 'YES' : 'NO');

  try {
      if (!email || !password) {
          //console.log('Missing email or password');
          return res.status(400).json({ message: "Email and password are required." });
      }

      const user = await User.findOne({ email });

      if (!user) {
          //console.log(`User not found for email: ${email}`);
          return res.status(400).json({ message: "Invalid email or password." });
      }

      //console.log('User found:', { 
      //    id: user._id, 
      //    email: user.email, 
      //    isVerified: user.isVerified,
      //    userType: user.userType,
      //    hashedPassword: user.password ? 'YES' : 'NO'
      //});

      if (user.accountLocked) {
          if (user.lockExpiresAt && user.lockExpiresAt > new Date()) {
              //console.log('Account is locked');
              return res.status(423).json({ 
                  message: `Account is locked: ${user.lockReason}`,
                  lockExpiresAt: user.lockExpiresAt
              });
          } else {
              //console.log('Unlocking expired account lock');
              user.accountLocked = false;
              user.lockReason = undefined;
              user.lockExpiresAt = undefined;
              user.failedLoginAttempts = 0;
          }
      }

      /***console.log('Comparing password...');
      console.log('Password length:', password.length);
      console.log('Stored hashed password length:', user.password.length);*/
      
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      //console.log('Password comparison result:', isPasswordMatch);

      if (!isPasswordMatch) {
          console.log(`Invalid password attempt for: ${email}`);
          
          user.failedLoginAttempts += 1;
          user.lastFailedLoginAt = new Date();
          
          user.loginHistory.push({
              loginAt: new Date(),
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.headers['user-agent'] || 'Unknown',
              success: false,
              failureReason: 'Invalid password'
          });
          
          if (user.failedLoginAttempts >= 5) {
              user.accountLocked = true;
              user.lockReason = 'Too many failed login attempts';
              user.lockExpiresAt = new Date(Date.now() + 30 * 60 * 1000); 
          }
          
          await user.save();
          
          return res.status(400).json({ message: "Invalid email or password." });
      }


      
      user.failedLoginAttempts = 0;
      user.lastLoginAt = new Date();
      user.lastAccessedAt = new Date();
      user.accountLocked = false;
      user.lockReason = undefined;
      user.lockExpiresAt = undefined;
      
      user.loginHistory.push({
          loginAt: new Date(),
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'] || 'Unknown',
          success: true
      });
      
      if (user.loginHistory.length > 10) {
          user.loginHistory = user.loginHistory.slice(-10);
      }

      await user.save();
      //console.log('User data saved successfully');

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      //console.log('Tokens generated:', { 
      //    accessTokenLength: accessToken.length,
      //    refreshTokenLength: refreshToken.length
      //});

      const tokenDocument = new Token({ owner: user._id, token: accessToken });
      await tokenDocument.save();
      //console.log('Token saved to database');

      const responseData = {
          message: "Login successful",
          accessToken,
          refreshToken,
          userId: user._id,
          userType: user.userType,
          isVerified: user.isVerified,
          isAdmin: user.isAdmin,
          expiresIn: 15 * 60,
          user: {
              _id: user._id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              isVerified: user.isVerified,
              userType: user.userType,
              isAdmin: user.isAdmin
          }
      };

      console.log('Sending response:', {
          status: 200,
          message: responseData.message,
          userId: responseData.userId,
          userType: responseData.userType,
          isVerified: responseData.isVerified,
          isAdmin: responseData.isAdmin,
          hasAccessToken: !!responseData.accessToken,
          hasRefreshToken: !!responseData.refreshToken
      });

      console.log('Succesful login attempt');
      return res.status(200).json(responseData);

  } catch (error) {
      console.error('Error login attempt');
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const sendVerificationEmail = async (req, res) => {
  try {
    const { email, attemptCount = 1 } = req.body;
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
          remainingTime,
          errorType: 'COOLDOWN_ACTIVE'
        });
      }
    }

    
    const now = Date.now();
    const fifteenMinutesAgo = now - (RESEND_COOLDOWN_MINUTES * 60 * 1000);
    
    if (user.lastResendTime && user.lastResendTime > new Date(fifteenMinutesAgo)) {
      const timeSinceLastResend = Math.ceil((now - user.lastResendTime.getTime()) / 1000);
      const remainingCooldown = (RESEND_COOLDOWN_MINUTES * 60) - timeSinceLastResend;
      
      if (remainingCooldown > 0) {
        return res.status(429).json({ 
          message: 'Too many resend attempts. Please try again.',
          remainingTime: remainingCooldown,
          errorType: 'RESEND_LIMIT_EXCEEDED'
        });
      }
    }

    
    if (user.lastResendTime && user.lastResendTime <= new Date(fifteenMinutesAgo)) {
      user.resendAttempts = 0;
    }

    
    if (user.resendAttempts >= MAX_RESEND_ATTEMPTS) {
      return res.status(429).json({ 
        message: 'Maximum verification attempts reached. Please try again later.',
        errorType: 'MAX_ATTEMPTS_REACHED'
      });
    }


    const verificationCode = generateVerificationCode();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(now + VERIFICATION_EXPIRY_MINUTES * 60 * 1000);
    user.resendAttempts += 1;
    user.lastResendTime = new Date();
    
    await user.save();

    const cooldownDuration = Math.min(attemptCount * 60, 300); 
    cooldownStore.set(cooldownKey, {
      expiresAt: now + (cooldownDuration * 1000),
      attemptCount: attemptCount
    });

    const htmlContent = createVerificationEmailTemplate(user.first_name, user.last_name, verificationCode);
    const textContent = createVerificationTextTemplate(user.first_name, user.last_name, verificationCode);

    await sendEmail(
      email,
      'Verify Your Email Address - AgriConnect',
      textContent,
      htmlContent
    );

    res.json({ 
      message: 'Verification email sent successfully',
      attemptCount: user.resendAttempts,
      cooldownDuration,
      expiresIn: VERIFICATION_EXPIRY_MINUTES
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
      //console.log('User not found for email:', email); 
      return res.status(404).json({ 
        message: 'User not found.',
        errorType: 'USER_NOT_FOUND'
      });
    }

    //console.log('Received Code:', inputCode); 
    //console.log('Stored Code:', user.verificationCode);
    //console.log('Code Expires:', user.verificationCodeExpires);

    if (!user.verificationCode) {
      return res.status(400).json({ 
        message: 'No verification code found. Please request a new one.',
        errorType: 'NO_CODE_FOUND'
      });
    }

    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;
      await user.save();
      
      return res.status(400).json({ 
        message: 'Verification code has expired. Please request a new one.',
        errorType: 'CODE_EXPIRED'
      });
    }

    if (user.verificationCode !== inputCode) {
      return res.status(400).json({ 
        message: 'Invalid verification code. Please check and try again.',
        errorType: 'INVALID_CODE'
      });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.resendAttempts = 0;
    user.lastResendTime = undefined;
    await user.save();

    const cooldownKey = `verification_${email}`;
    cooldownStore.delete(cooldownKey);

    res.status(200).json({ 
      message: 'Email verified successfully.',
      success: true
    });
  } catch (error) {
    console.error('Error in verifyEmail:', error.message); 
    res.status(500).json({ 
      message: 'Error verifying email.',
      error: error.message 
    });
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
  
      //console.log(`Password Reset Request: 
      //- User ID: ${user._id}
      //- Reset Token: ${token}`);
  
      const resetLink = `http://localhost:3000/reset-password?token=${encodeURIComponent(token)}&id=${user._id}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset Request - AgriConnect</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4D7C2E; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #4D7C2E; color: white; text-decoration: none; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: white;">AgriConnect</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
            </div>
            <div class="content">
              <h2>Hello ${user.first_name || 'Valued User'},</h2>
              <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
              <p>To reset your password, please click the button below:</p>
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Reset My Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">${resetLink}</p>
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

const trackPasswordChange = async (userId, newPassword, changedBy, req) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.passwordChangeHistory.push({
      changedAt: new Date(),
      changedBy: changedBy, // 'user' or 'admin'
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    if (user.passwordChangeHistory.length > 5) {
      user.passwordChangeHistory = user.passwordChangeHistory.slice(-5);
    }

    user.lastPasswordChangeAt = new Date();
    await user.save();
  } catch (error) {
    console.error('Error tracking password change:', error);
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
            
            await trackPasswordChange(userId, newPassword, 'user', req);
            
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
            return res.status(404).json({ 
                message: 'User not found',
                errorType: 'USER_NOT_FOUND'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({ 
                message: 'Email is already verified',
                errorType: 'ALREADY_VERIFIED'
            });
        }

        const attemptCount = (user.resendAttempts || 0) + 1;
        
        const cooldownKey = `verification_${email}`;
        const cooldownData = cooldownStore.get(cooldownKey);
        
        if (cooldownData) {
            const remainingTime = Math.ceil((cooldownData.expiresAt - Date.now()) / 1000);
            if (remainingTime > 0) {
                return res.status(429).json({ 
                    message: 'Please wait before requesting another verification email',
                    remainingTime,
                    errorType: 'COOLDOWN_ACTIVE'
                });
            }
        }

        const now = Date.now();
        const fifteenMinutesAgo = now - (RESEND_COOLDOWN_MINUTES * 60 * 1000);
        
        if (user.lastResendTime && user.lastResendTime > new Date(fifteenMinutesAgo)) {
            const timeSinceLastResend = Math.ceil((now - user.lastResendTime.getTime()) / 1000);
            const remainingCooldown = (RESEND_COOLDOWN_MINUTES * 60) - timeSinceLastResend;
            
            if (remainingCooldown > 0) {
                return res.status(429).json({ 
                    message: 'Too many resend attempts. Please try again.',
                    remainingTime: remainingCooldown,
                    errorType: 'RESEND_LIMIT_EXCEEDED'
                });
            }
        }

        if (user.lastResendTime && user.lastResendTime <= new Date(fifteenMinutesAgo)) {
            user.resendAttempts = 0;
        }

        if (user.resendAttempts >= MAX_RESEND_ATTEMPTS) {
            return res.status(429).json({ 
                message: 'Maximum verification attempts reached. Please try again later.',
                errorType: 'MAX_ATTEMPTS_REACHED'
            });
        }

        const verificationCode = generateVerificationCode();
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = new Date(now + VERIFICATION_EXPIRY_MINUTES * 60 * 1000);
        user.resendAttempts += 1;
        user.lastResendTime = new Date();
        
        await user.save();

        const cooldownDuration = Math.min(attemptCount * 60, 300);
        cooldownStore.set(cooldownKey, {
            expiresAt: now + (cooldownDuration * 1000),
            attemptCount: attemptCount
        });

        const htmlContent = createVerificationEmailTemplate(user.first_name, user.last_name, verificationCode);
        const textContent = createVerificationTextTemplate(user.first_name, user.last_name, verificationCode);

        await sendEmail(
            user.email, 
            'Verify Your Email Address - AgriConnect', 
            textContent, 
            htmlContent
        );
        
        return res.status(200).json({ 
            message: 'Verification code resent successfully',
            attemptCount: user.resendAttempts,
            cooldownDuration,
            expiresIn: VERIFICATION_EXPIRY_MINUTES
        });
    } catch (error) {
        console.error('Error resending verification code:', error);
        res.status(500).json({ 
            message: 'Error resending verification code',
            errorType: 'SERVER_ERROR'
        });
    }
};

const getUser = async (req, res) => {
    const userId = req.userId;

    try {
        //console.log('Getting user data for:', userId);
        const user = await User.findById(userId).select(
            'userId first_name middle_name last_name email birthDate country province cityOrTown barangay bio isVerified userType isSeller isAdmin createdAt updatedAt'
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        //console.log('Returning safe user data');
        return res.status(200).json(user);
    } catch (error) {
        console.error('Error retrieving user:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getSellerStatus = async (req, res) => {
  try {
      //console.log("Fetching seller status for:", req.userId);
      const user = await User.findById(req.userId).select("userType");

      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      //console.log("Returning isSeller:", user.userType === 'seller');
      return res.status(200).json({ isSeller: user.userType === 'seller' });
  } catch (error) {
      console.error("Error retrieving seller status:", error);
      return res.status(500).json({ message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId; 

  try {
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required.' 
      });
    }

    
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character, and be at least 8 characters long.'
      });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: 'New password must be different from your current password.' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    user.password = hashedNewPassword;
    await user.save();

    // Track password change
    await trackPasswordChange(userId, newPassword, 'user', req);

    console.log(`Password changed successfully for user: ${userId}`);
    
    return res.status(200).json({ 
      message: 'Password changed successfully.' 
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ 
      message: 'An error occurred while changing your password. Please try again.' 
    });
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
    getSellerStatus,
    changePassword
};