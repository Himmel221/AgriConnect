/* UserBalance.js */

import mongoose from 'mongoose';

const UserBalanceSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true }, 
  sellerBalance: { type: Number, default: 0 }, 
  transactions: [
    {
      amount: Number,
      type: { type: String, enum: ['credit', 'debit'] }, 
      timestamp: { type: Date, default: Date.now }, 
      referenceId: String, 
    },
  ],
});

const UserBalance = mongoose.model('UserBalance', UserBalanceSchema);
export default UserBalance;