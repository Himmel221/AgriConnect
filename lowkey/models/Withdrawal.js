/* Withdrawal.js */

import mongoose from 'mongoose';

const WithdrawalSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountName: { type: String, required: true },
  commission: { type: Number, required: true }, 
  date: { type: Date, default: Date.now },
});

const Withdrawal = mongoose.model('Withdrawal', WithdrawalSchema);
export default Withdrawal;