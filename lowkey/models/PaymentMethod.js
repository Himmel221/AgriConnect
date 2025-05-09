import mongoose from 'mongoose';

const PaymentMethodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountName: { type: String, required: true }, 
  proofImage: { type: String },
  addedAt: { type: Date, default: Date.now }
});

const PaymentMethod = mongoose.model('PaymentMethod', PaymentMethodSchema);
export default PaymentMethod;