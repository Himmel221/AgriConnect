// verification_token.js

import mongoose from 'mongoose';

const verificationTokenSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      expires: 3060, 
      default: Date.now
    }
  }
);

verificationTokenSchema.methods.compareToken = function (token) {
  console.log('Comparing tokens:', this.token, token);
  return this.token === token;
};

const VerificationToken = mongoose.model('VerificationToken', verificationTokenSchema);
export default VerificationToken;
