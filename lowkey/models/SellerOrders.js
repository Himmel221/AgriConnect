//SellerOrders.js

import mongoose from 'mongoose';

const sellerOrderSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, 
  },
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
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Success'], 
    default: 'Pending',
  },
  transportation: {
    type: String, 
  },
  shippingAddress: {
    type: String, 
  },
  createdAt: {
    type: Date,
    default: Date.now, 
  },
});

const SellerOrder = mongoose.model('SellerOrder', sellerOrderSchema);
export default SellerOrder;