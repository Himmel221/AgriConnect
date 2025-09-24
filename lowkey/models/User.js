// User.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

function generateUserId() {
  const digits = '0123456789';
  let userId = '';
  for (let i = 0; i < 20; i++) {
    userId += digits[Math.floor(Math.random() * digits.length)];
  }
  return userId;
}

const UserSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  first_name: { type: String, required: true },
  middle_name: { type: String },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  birthDate: { type: Date, required: true },
  country: { type: String, default: 'Philippines' },
  province: { type: String },
  cityOrTown: { type: String },
  barangay: { type: String },
  bio: { type: String },
  otp: { type: String },
  otpExpires: { type: Date },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
  resendAttempts: { type: Number, default: 0 },
  lastResendTime: { type: Date },
  isVerified: { type: Boolean, default: false },
  userType: { 
    type: String, 
    enum: ['user', 'seller', 'admin', 'super_admin'], 
    default: 'user' 
  },
  isSeller: { type: Boolean, default: false },
  isAdmin: { 
    type: Boolean, 
    default: false,
    get: function() {
      return this.userType === 'admin' || this.userType === 'super_admin';
    }
  },

  // Successful transaction tracking for sellers
  successfulTransactions: { 
    type: Number, 
    default: 0,
    min: 0,
    validate: {
      validator: function(value) {
        // Only allow incrementing, never decrementing
        return value >= 0;
      },
      message: 'Successful transactions cannot be negative'
    }
  },
  lastSuccessfulTransaction: { type: Date },
  transactionHistory: [{
    orderId: { type: String, required: true },
    orderDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    buyerName: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true }
  }],

  lastAccessedAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date },
  lastPasswordChangeAt: { type: Date, default: Date.now },
  passwordChangeHistory: [{
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String }
  }],
  loginHistory: [{
    loginAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String },
    success: { type: Boolean, default: true },
    failureReason: { type: String }
  }],
 
  passwordExpiresAt: { type: Date }, 
  accountLocked: { type: Boolean, default: false },
  lockReason: { type: String },
  lockExpiresAt: { type: Date },
  failedLoginAttempts: { type: Number, default: 0 },
  lastFailedLoginAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isBanned: { type: Boolean, default: false },
  bannedAt: { type: Date },
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  banReason: { type: String }
}, { 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

UserSchema.pre('validate', async function (next) {
  if (this.isNew) {
    let uniqueId = generateUserId();
    let existingUser = await this.constructor.findOne({ userId: uniqueId });

    while (existingUser) {
      uniqueId = generateUserId();
      existingUser = await this.constructor.findOne({ userId: uniqueId });
    }
    this.userId = uniqueId;
  }

  if (this.userType === 'seller') {
    this.isSeller = true;
  }

  next();
}); 

// Method to increment successful transactions (only for sellers)
UserSchema.methods.incrementSuccessfulTransaction = async function(orderData) {
  if (this.userType !== 'seller') {
    throw new Error('Only sellers can have successful transactions');
  }
  
  this.successfulTransactions += 1;
  this.lastSuccessfulTransaction = new Date();
  
  // Add to transaction history (keep last 50 transactions)
  this.transactionHistory.unshift({
    orderId: orderData.orderId,
    orderDate: orderData.orderDate,
    totalAmount: orderData.totalAmount,
    buyerName: orderData.buyerName,
    productName: orderData.productName,
    quantity: orderData.quantity,
    unit: orderData.unit
  });
  
  // Keep only last 50 transactions
  if (this.transactionHistory.length > 50) {
    this.transactionHistory = this.transactionHistory.slice(0, 50);
  }
  
  return this.save();
};

const User = mongoose.model('User', UserSchema);
export default User;