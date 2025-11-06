const mongoose = require("mongoose");
const CardRequest = require("../models/card.request.model");
const User = require("../models/user.model");
const Org = require("../models/org.model");
const Ward = require("../models/ward.model");
const bcrypt = require("bcryptjs");
const Card = require("../models/card.model"); // Import the new Card model

// Create a new card request
exports.createCardRequest = async (req, res) => {
  try {
    const { requesterType, username, password, fullName, dateOfBirth } =
      req.body;

    console.log(req.body);
    if (!requesterType || !username || !password) {
      return res.status(400).json({
        message: "Requester type, username, and password are required",
      });
    }

    if (!["User", "Org", "Ward"].includes(requesterType)) {
      return res.status(400).json({ message: "Invalid requester type" });
    }

    let requester;
    const firstName = fullName?.split(" ")[0];
    const lastName = fullName?.split(" ")[1] || "";

    // ✅ Lookup logic based on type
    if (requesterType === "User") {
      requester = await User.findOne({
        username,
        firstName,
        lastName,
        dateOfBirth,
      });

      const ok = await bcrypt.compare(password, requester.password);

      if (!ok) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

    } else if (requesterType === "Org") {
      requester = await Org.findOne({ username, name: fullName });

      const ok = await bcrypt.compare(password, requester.password);

      if (!ok) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } else if (requesterType === "Ward") {
      requester = await Ward.findOne({ username, name: fullName });

      const ok = await bcrypt.compare(password, requester.password);

      if (!ok) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

    }

    if (!requester) {
      return res.status(404).json({ message: `${requesterType} not found v1` });
    }

    if (!requester.isVerified) {
      return res
        .status(403)
        .json({ message: `Your KYC is still under verification.` });
    }

    const requesterId = requester._id;

    // Prevent duplicate pending requests
    const existingRequest = await CardRequest.findOne({
      requesterType,
      requesterId,
      status: "Pending",
    });
    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "A pending request already exists" });
    }

    // Save new request
    const newRequest = new CardRequest({ requesterType, requesterId });
    await newRequest.save();

    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyKYC = async (req, res) => {
  try {
    const { requesterType, username, password, fullName, dateOfBirth } =
      req.body;

    if (!requesterType || !username || !password) {
      return res.status(400).json({
        message: "Requester type, username, and password are required",
      });
    }

    if (!["User", "Org", "Ward"].includes(requesterType)) {
      return res.status(400).json({ message: "Invalid requester type" });
    }

    let requester;

    const firstName = fullName?.split(" ")[0];
    const lastName = fullName?.split(" ")[1] || "";

    // ✅ Lookup logic based on type
    if (requesterType === "User") {
      requester = await User.findOne({
        username,
        password,
        firstName,
        lastName,
        dateOfBirth,
      });
    } else if (requesterType === "Org") {
      requester = await Org.findOne({ username, password, name: fullName });
    } else if (requesterType === "Ward") {
      requester = await Ward.findOne({ username, password, name: fullName });
    }

    if (!requester) {
      return res.status(404).json({ message: `${requesterType} not found` });
    }

    requester.isVerified = true;
    await requester.save();

    // notification.push(requester.phoneNumber, "Your KYC has been verified. Login into your account and get 50% bonus on the first topup.")

    return res.status(200).json({
      message: `${requesterType} verified successfully`,
      requester,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Block a card
exports.blockCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { reason } = req.body; // Optional reason for blocking

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    if (card.status === 'Blocked') {
      return res.status(400).json({ message: 'Card is already blocked' });
    }

    card.status = 'Blocked';
    await card.save();

    // Optionally, create a CardRequest entry to log the blocking action
    await CardRequest.create({
      requesterType: 'User', // Or an Admin user type if applicable
      requesterId: req.userId, // Assuming userId is available from auth middleware
      status: 'Blocked',
      cardId: card._id,
      meta: { reason: reason || 'Blocked by user request' }
    });

    res.status(200).json({ message: 'Card blocked successfully', card });
  } catch (error) {
    console.error('Error blocking card:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Unblock a card
exports.unblockCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { reason } = req.body; // Optional reason for unblocking

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    if (card.status === 'Active') {
      return res.status(400).json({ message: 'Card is already active (unblocked)' });
    }

    card.status = 'Active'; // Or a more appropriate unblocked status
    await card.save();

    // Optionally, create a CardRequest entry to log the unblocking action
    await CardRequest.create({
      requesterType: 'User', // Or an Admin user type if applicable
      requesterId: req.userId, // Assuming userId is available from auth middleware
      status: 'Unblocked',
      cardId: card._id,
      meta: { reason: reason || 'Unblocked by user request' }
    });

    res.status(200).json({ message: 'Card unblocked successfully', card });
  } catch (error) {
    console.error('Error unblocking card:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a card by ID
exports.getCardById = async (req, res) => {
  try {
    const { cardId } = req.params;
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    res.status(200).json({ card });
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update card type (e.g., from Regular to Student)
exports.updateCardType = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { cardType } = req.body;

    if (!cardType || !['Student', 'Senior', 'Regular', 'Staff'].includes(cardType)) {
      return res.status(400).json({ message: 'Invalid card type provided' });
    }

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    card.cardType = cardType;
    await card.save();

    // Optionally, create a CardRequest entry to log the change
    await CardRequest.create({
      requesterType: 'User', // Or Admin
      requesterId: req.userId,
      status: 'Approved', // Assuming this is an approved change
      cardId: card._id,
      cardType: cardType,
      meta: { action: 'Card type updated' }
    });

    res.status(200).json({ message: 'Card type updated successfully', card });
  } catch (error) {
    console.error('Error updating card type:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new card (e.g., by an admin after a request is approved)
exports.createCard = async (req, res) => {
  try {
    const { nfcId, ownerId, ownerType, cardType, expiryDate, balance } = req.body;

    // Basic validation
    if (!nfcId || !ownerId || !ownerType || !cardType) {
      return res.status(400).json({ message: 'Missing required card details' });
    }
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: 'Invalid ownerId format' });
    }

    // Check if NFC ID already exists
    const existingCard = await Card.findOne({ nfcId });
    if (existingCard) {
      return res.status(400).json({ message: 'Card with this NFC ID already exists' });
    }

    const newCard = new Card({
      nfcId,
      ownerId,
      ownerType,
      cardType,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      balance: balance || 0,
      status: 'Active'
    });

    await newCard.save();

    res.status(201).json({ message: 'Card created successfully', card: newCard });

  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
