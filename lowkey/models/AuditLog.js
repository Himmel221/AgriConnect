import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, //'ban', 'unban', 'soft-delete', 'edit', 'order-status-change'
  targetType: { type: String, required: true }, //'User', 'Listing', 'PaymentMethod', 'Order'
  targetId: { type: String, required: true }, 
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performedByEmail: { type: String },
  details: { type: mongoose.Schema.Types.Mixed }, 
  timestamp: { type: Date, default: Date.now }
});

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
export default AuditLog; 