const mongoose = require("mongoose");

const cardRequestSchema = new mongoose.Schema(
  {
    requesterType: {
      type: String,
      required: true,
      enum: ["User", "Org", "Ward"],
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "requesterType",
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Approved", "Rejected", "Blocked", "Unblocked"],
      default: "Pending",
    },
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' }, // Link to the actual Card if approved
    cardType: { // To specify the type of card being requested
      type: String,
      enum: ['Student', 'Senior', 'Regular', 'Staff'],
      default: 'Regular'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CardRequest", cardRequestSchema);
