const mongoose = require("mongoose");
const CardRequest = require("../models/card.request.model");
const User = require("../models/user.model");
const Org = require("../models/org.model");
const Ward = require("../models/ward.model");
const bcrypt = require("bcryptjs");
const Card = require("../models/card.model");

const requesterModels = {
  User,
  Org,
  Ward,
};

async function findRequester(type, username, fullName, dateOfBirth) {
  const Model = requesterModels[type];
  if (!Model) return null;

  const firstName = fullName?.split(" ")[0];
  const lastName = fullName?.split(" ")[1] || "";

  const query = { username };

  if (type === "User") {
    query.firstName = firstName;
    query.lastName = lastName;
    query.dateOfBirth = dateOfBirth;
  } else {
    query.name = fullName;
  }

  return await Model.findOne(query);
}

// ✅ Create Card Request
exports.createCardRequest = async (req, res) => {
  try {
    const { requesterType, username, password, fullName, dateOfBirth } = req.body;

    if (!requesterType || !username || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!["User", "Org", "Ward"].includes(requesterType)) {
      return res.status(400).json({ message: "Invalid requester type" });
    }

    const requester = await findRequester(requesterType, username, fullName, dateOfBirth);

    if (!requester) {
      return res.status(404).json({ message: `${requesterType} not found` });
    }

    const ok = await bcrypt.compare(password, requester.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (!requester.isVerified) {
      return res.status(403).json({ message: "Your KYC is still under verification." });
    }

    const existingRequest = await CardRequest.findOne({
      requesterType,
      requesterId: requester._id,
      status: "Pending"
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Pending request already exists" });
    }

    const newRequest = await CardRequest.create({
      requesterType,
      requesterId: requester._id,
      status: "Pending"
    });

    return res.status(201).json(newRequest);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


const createCard1 = async ({nfcId, ownerId, ownerType, cardType, expiryDate}) => {
  return await Card.create({
    nfcId,
    ownerType,
    ownerId,
    cardType,
    status: "Active",
    expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    balance: 0
  });
}


// ✅ Verify KYC
exports.verifyKYC = async (req, res) => {
  try {
    const { requesterType, username, password, fullName, dateOfBirth } = req.body;

    if (!["User", "Org", "Ward"].includes(requesterType)) {
      return res.status(400).json({ message: "Invalid requester type" });
    }

    const requester = await findRequester(requesterType, username, fullName, dateOfBirth);
    if (!requester) {
      return res.status(404).json({ message: `${requesterType} not found` });
    }

    const ok = await bcrypt.compare(password, requester.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

        createCard1({
      nfcId: `NFC${Date.now()}`,
      ownerId: requester._id,
      ownerType: requesterType,
      cardType: "Regular",
      expiryDate: null
    })

    requester.isVerified = true;
    await requester.save();


    return res.status(200).json({
      message: `${requesterType} verified successfully`,
      requester
    });

    
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ Block Card
exports.blockCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: "Card not found" });

    if (card.status === "Blocked")
      return res.status(400).json({ message: "Card already blocked" });

    card.status = "Blocked";
    await card.save();

    await CardRequest.create({
      requesterType: "User",
      requesterId: req.userId,
      cardId: card._id,
      status: "Completed",
      meta: { action: "Blocked" }
    });

    return res.status(200).json({ message: "Card blocked successfully", card });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ Unblock Card
exports.unblockCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: "Card not found" });

    if (card.status === "Active")
      return res.status(400).json({ message: "Card already active" });

    card.status = "Active";
    await card.save();

    await CardRequest.create({
      requesterType: "User",
      requesterId: req.userId,
      cardId: card._id,
      status: "Completed",
      meta: { action: "Unblocked" }
    });

    return res.status(200).json({ message: "Card unblocked successfully", card });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ Get Card by ID
exports.getCardById = async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: "Card not found" });

    return res.status(200).json({ card });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ Update Card Type
exports.updateCardType = async (req, res) => {
  try {
    const { cardType } = req.body;
    if (!["Student", "Senior", "Regular", "Staff"].includes(cardType)) {
      return res.status(400).json({ message: "Invalid card type" });
    }

    const card = await Card.findById(req.params.cardId);
    if (!card) return res.status(404).json({ message: "Card not found" });

    card.cardType = cardType;
    await card.save();

    await CardRequest.create({
      requesterType: "User",
      requesterId: req.userId,
      cardId: card._id,
      status: "Completed",
      meta: { action: "Card type change" }
    });

    return res.status(200).json({ message: "Card type updated", card });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ✅ Create Card
exports.createCard = async (req, res) => {
  try {
    const { nfcId, ownerId, ownerType, cardType } = req.body;

    const existingRequest = await CardRequest.findOne({
      requesterType: ownerType,
      requesterId: ownerId,
    });

    if (!existingRequest ) {
      return res.status(400).json({ message: "No completed card request found for this owner" });
    }

    
    if (!["User", "Org", "Ward"].includes(ownerType)) {
      return res.status(400).json({ message: "Invalid owner type" });
    }

    if (!["Student", "Senior", "Regular", "Staff"].includes(cardType)) {
      return res.status(400).json({ message: "Invalid card type" });
    }

    const exists = await Card.findOne({ ownerId });
    if (exists) return res.status(400).json({ message: "NFC already exists" });

    const card = await Card.create({
      nfcId,
      ownerType,
      ownerId,
      cardType,
      status: "Active",
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
      balance: 0
    });

    await CardRequest.findByIdAndDelete(existingRequest._id);

    return res.status(201).json({ message: "Card created successfully", card });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

