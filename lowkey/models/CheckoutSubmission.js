/* CheckoutSubmission */

import mongoose from "mongoose";

const CheckoutSubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  bank: {
    type: String,
    required: false,
  },
  referenceNumber: {
    type: String,
    required: true,
  },
  proofImage: {
    type: String,
    required: true,
  },
  status: { 
    type: String,
    enum: ['Pending', 'Ongoing', 'Success', 'Rejected'],
    default: 'Pending',
    required: true,
  },
  BuyerStatus: { 
    type: String,
    enum: ['NotYetReceived', 'Received', 'Cancelled'],
    default: 'NotYetReceived',
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: {
    type: Date,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvalNote: {
    type: String,
    default: '',
  },
});

export default mongoose.model('CheckoutSubmission', CheckoutSubmissionSchema);