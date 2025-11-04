const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  revoked: { type: Boolean, default: false },
  replacedByToken: { type: String },
  createdByIp: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
