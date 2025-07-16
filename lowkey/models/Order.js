import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: false
  },
  
  originalListing: {
    identifier: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    category: { type: String, required: true },
    details: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    minimumOrder: { type: Number },
    listedDate: { type: Date, required: true }
  },
  
  seller: {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerName: { type: String, required: true },
  },
  
  buyer: {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyerName: { type: String, required: true },
  },
  
  orderQuantity: {
    type: Number,
    required: true
  },
  
  totalPrice: {
    type: Number,
    required: true
  },
  
  payment: {
    bank: { type: String, required: false },
    referenceNumber: { type: String, required: true },
    proofImage: { type: String, required: true },
    paymentDate: { type: Date, default: Date.now }
  },
  
  status: {
    type: String,
    enum: ['Pending', 'Ongoing', 'Success', 'Rejected'],
    default: 'Pending'
  },
  
  buyerStatus: {
    type: String,
    enum: ['NotYetReceived', 'Received', 'Cancelled'],
    default: 'NotYetReceived'
  },
  
  shipping: {
    address: { type: String },
    method: { type: String },
    trackingNumber: { type: String },
    estimatedDelivery: { type: Date }
  },
  
  orderCreatedAt: {
    type: Date,
    default: Date.now
  },
  
  orderApprovedAt: {
    type: Date
  },
  
  orderCompletedAt: {
    type: Date
  },
  
  review: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    approvalNote: { type: String, default: '' },
    rejectionReason: { type: String }
  },
  
  statusHistory: [{
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String },
    ipAddress: { type: String }
  }],
  
  metadata: {
    originalListingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
    sellerOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerOrder' }
  }
}, {
  timestamps: true
});

OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    this.orderId = `ORD-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

OrderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    });
  }
  next();
});

OrderSchema.index({ orderId: 1 });
OrderSchema.index({ 'seller.sellerId': 1 });
OrderSchema.index({ 'buyer.buyerId': 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderCreatedAt: -1 });
OrderSchema.index({ 'metadata.originalListingId': 1 });

const Order = mongoose.model('Order', OrderSchema);

export default Order; 