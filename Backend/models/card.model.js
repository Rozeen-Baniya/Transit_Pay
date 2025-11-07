const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    nfcId: { type: String, unique: true, trim: true },
    ownerType: { type: String, required: true, enum: ['User', 'Org', 'Ward'] },
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'ownerType' },
    cardType: {
      type: String,
      enum: ['Student', 'Senior', 'Regular', 'Staff'],
      default: 'Regular'
    },
    status: {
      type: String,
      enum: ['Active', 'Blocked', 'Lost', 'Expired'],
      default: 'Active'
    },
    issueDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    meta: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

cardSchema.index({ nfcId: 1, ownerId: 1 });

module.exports = mongoose.model('Card', cardSchema);
