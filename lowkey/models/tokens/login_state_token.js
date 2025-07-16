// models/tokens/login_state_token.js

import mongoose from 'mongoose';

const TokenSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 }, 
});

const Token = mongoose.model('Token', TokenSchema);
export default Token;
