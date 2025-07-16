import mongoose from 'mongoose';
import User from './User.js';

const InventorySchema = new mongoose.Schema({
  productName: { type: String, required: true },
  category: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  price: { type: Number },
  unit: { type: String },

  quantity: { type: Number },
  expirationDate: { type: Date },
  plantingDate: { type: Date },
  harvestingDate: { type: Date },
  supplySchedule: { type: String, enum: ['daily', 'weekly'] },
  stockThreshold: { type: Number, default: 10 },
  supplyCapacityDaily: { type: Number },
  supplyCapacityWeekly: { type: Number },
  stockAvailability: { type: String },

  storageTemp: { type: String },
  humidity: { type: String },
  packagingType: { type: String },
  certificationType: { type: String },
  processingMethod: { type: String },
  packagingSize: { type: String },
  preferredSoil: { type: String },
  bestClimate: { type: String },
  batchNumber: { type: String },
  qrCodeUrl: { type: String },
  supplierInfo: { type: String },
  deliveryOptions: { type: String },

  priceSchedule: [{ price: Number, startDate: Date, endDate: Date }],
  priceHistory: [{ date: Date, price: Number }],
}, { timestamps: true });

const Inventory = mongoose.model('Inventory', InventorySchema);
export default Inventory;