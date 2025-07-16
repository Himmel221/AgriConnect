// reset_token.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const resetTokenSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: {
      type: String,
      required: true
    },
    hashedToken: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600 // 1 hour
    }
  },
  { timestamps: true }
);

resetTokenSchema.pre('save', async function (next) {
  if (this.isModified('token')) {
    const hash = await bcrypt.hash(this.token, 8);
    this.hashedToken = hash;
  }
  next();
});

const ResetToken = mongoose.model('ResetToken', resetTokenSchema);
export default ResetToken;
