const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");
const currencyService = require("../services/currency.service");
const emailService = require('../services/email.service');
const crypto = require('crypto');
// mongoose already required above
const User = require('../models/user.model');
const { emitToUser, emitToWallet } = require('../services/socket.service');

// Create a new wallet
exports.createWallet = async (req, res) => {
  try {
    // Check if user already has a wallet
    const existingWallet = await Wallet.findOne({ 
      userId: req.userId,
      userType: "User"
    });

    if (existingWallet) {
      return res.status(400).json({ 
        message: "User already has a wallet",
        wallet: existingWallet
      });
    }

    // Create new wallet
    const wallet = new Wallet({
      userId: req.userId,
      userType: "User",
      balance: 0,
      history: []
    });

    await wallet.save();

    res.status(201).json({
      message: "Wallet created successfully",
      wallet: {
        id: wallet._id,
        balance: wallet.balance,
        userId: wallet.userId
      }
    });

  } catch (error) {
    console.error("Create wallet error:", error);
    res.status(500).json({ message: "Error creating wallet" });
  }
};

// Currency conversion middleware
exports.withCurrencyConversion = async (req, res, next) => {
    const { displayCurrency } = req.query;
    if (displayCurrency && !currencyService.isSupportedCurrency(displayCurrency)) {
        return res.status(400).json({ 
            message: `Unsupported currency. Supported currencies: ${currencyService.SUPPORTED_CURRENCIES.join(', ')}` 
        });
    }
    req.displayCurrency = displayCurrency;
    next();
};

// Get wallet balance and details
exports.getWalletBalance = async (req, res) => {
  try {
    const { walletId } = req.params;
    const userId = req.userId; // From auth middleware
    
    console.log('Get wallet balance request:', {
      walletId,
      userId,
      headers: req.headers
    });

    const wallet = await Wallet.findOne({ _id: walletId }).exec();
    console.log('Found wallet:', wallet);

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Security check - ensure user can only access their own wallet
    if (wallet.userId.toString() !== userId.toString()) {
      console.log('Access denied. Wallet userId:', wallet.userId, 'Request userId:', userId);
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json({ wallet });

  } catch (error) {
    console.error("Get wallet error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get transaction history with pagination and currency conversion
exports.getTransactions = async (req, res) => {
  try {
    const { walletId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type,
      displayCurrency,
      startDate,
      endDate,
      minAmount,
      maxAmount
    } = req.query;

    // Build query
    const query = { walletId };
    if (status) query.status = status;
    if (type) query.type = type;
    
    // Add date range if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Add amount range if provided (in wallet's currency)
    if (minAmount || maxAmount) {
      query.convertedAmount = {};
      if (minAmount) query.convertedAmount.$gte = parseFloat(minAmount);
      if (maxAmount) query.convertedAmount.$lte = parseFloat(maxAmount);
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .exec();

    const total = await Transaction.countDocuments(query);

    // Convert amounts if display currency is different
    let processedTransactions = transactions;
    if (displayCurrency) {
      processedTransactions = await Promise.all(transactions.map(async tx => {
        let displayAmount = tx.amount;
        let rate = 1;

        if (displayCurrency !== tx.sourceCurrency) {
          try {
            displayAmount = await currencyService.convertCurrency(
              tx.amount,
              tx.sourceCurrency,
              displayCurrency
            );
            rate = await currencyService.getExchangeRate(
              tx.sourceCurrency,
              displayCurrency
            );
          } catch (error) {
            console.error(`Currency conversion error for transaction ${tx._id}:`, error);
            // Keep original amount if conversion fails
          }
        }

        return {
          ...tx.toObject(),
          displayAmount: {
            amount: displayAmount,
            currency: displayCurrency,
            exchangeRate: rate,
            formatted: currencyService.formatCurrency(displayAmount, displayCurrency)
          }
        };
      }));
    }

    return res.json({
      transactions: processedTransactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      filters: {
        displayCurrency,
        status,
        type,
        dateRange: startDate || endDate ? { startDate, endDate } : null,
        amountRange: minAmount || maxAmount ? { minAmount, maxAmount } : null
      }
    });

  } catch (error) {
    console.error("Get transactions error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Deduct fare with idempotency check and proper transaction handling
exports.deductFare = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { walletId } = req.params;
    const { amount, currency, idempotencyKey, fareDetails, location } = req.body;
    const userId = req.userId; // From auth middleware

    if (!idempotencyKey) {
      return res.status(400).json({ message: "Idempotency key required" });
    }

    // Check for existing transaction with same idempotency key
    const existingTx = await Transaction.findOne({ idempotencyKey }).session(session);
    if (existingTx) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({ 
        transaction: existingTx,
        message: "Transaction already processed"
      });
    }

    // Get wallet with lock for update
    const wallet = await Wallet.findOne({ _id: walletId }).session(session);
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Security check
    if (wallet.userId.toString() !== userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "Access denied" });
    }

    // Check sufficient funds
    if (wallet.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(402).json({ message: "Insufficient funds" });
    }

    // Create transaction record
    const transaction = new Transaction({
      walletId,
      userId: wallet.userId,
      userType: wallet.userType,
      type: 'fare',
      status: 'pending',
      amount,
      sourceCurrency: currency,
      targetCurrency: currency, // Same currency for now
      idempotencyKey,
      sourceLocation: location,
      fareDetails
    });

    // Deduct amount and save all changes atomically
    wallet.balance -= amount;
    wallet.history.push({
      title: 'Fare deduction',
      amount: -amount,
      uuid: idempotencyKey,
      date: new Date(),
      remarks: fareDetails?.description || 'Transit fare'
    });

    // Save both wallet and transaction
    await wallet.save({ session });
    transaction.status = 'completed';
    await transaction.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Emit real-time updates: balance and transaction
    try {
      emitToUser(wallet.userId.toString(), 'wallet:balance', { walletId: wallet._id, balance: wallet.balance, held: wallet.held });
      emitToUser(wallet.userId.toString(), 'transaction:new', { transaction, wallet: { id: wallet._id, balance: wallet.balance } });
      emitToWallet(wallet._id.toString(), 'transaction:new', { transaction });
    } catch (e) {
      console.warn('Socket emit warning (deductFare):', e.message);
    }

    return res.json({ 
      transaction,
      wallet: {
        id: wallet._id,
        balance: wallet.balance,
        currency
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Deduct fare error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Initiate a top-up: creates a pending topup transaction and returns a mock payment payload
exports.initiateTopUp = async (req, res) => {
  try {
    const { walletId } = req.params;
    const { amount, currency, idempotencyKey } = req.body;
    const userId = req.userId;

    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    // Create pending topup transaction
    const tx = await Transaction.create({
      walletId,
      userId,
      type: 'topup',
      status: 'pending',
      amount,
      sourceCurrency: currency || 'NPR',
      targetCurrency: currency || 'NPR',
      idempotencyKey: idempotencyKey || crypto.randomBytes(12).toString('hex')
    });

    // Mock payment provider response (client would use this to complete payment)
    const paymentPayload = {
      provider: process.env.PAYMENT_PROVIDER || 'mock',
      clientSecret: crypto.randomBytes(24).toString('hex'),
      transactionId: tx._id
    };

    return res.status(201).json({ transaction: tx, paymentPayload });
  } catch (error) {
    console.error('Initiate topup error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Confirm top-up (simulate webhook or client callback) — completes pending topup and credits wallet
exports.confirmTopUp = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { walletId } = req.params;
    const { transactionId, providerReference } = req.body;

    const tx = await Transaction.findById(transactionId).session(session);
    if (!tx) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Transaction not found' });
    }
    if (tx.status !== 'pending' || tx.type !== 'topup') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Transaction not eligible for confirmation' });
    }

    const wallet = await Wallet.findById(walletId).session(session);
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Wallet not found' });
    }

    // Credit wallet
    wallet.balance += tx.amount;
    wallet.history.push({ title: 'Top-up', amount: tx.amount, uuid: tx._id, date: new Date(), remarks: 'Wallet top-up' });
    await wallet.save({ session });

    tx.status = 'completed';
    tx.reference = providerReference;
    await tx.save({ session });

    await session.commitTransaction();
    session.endSession();
    // Send receipt
    const receipt = {
      id: tx._id,
      type: tx.type,
      amount: tx.amount,
      currency: tx.sourceCurrency,
      status: tx.status,
      date: tx.updatedAt || tx.createdAt
    };
    try {
      const user = await User.findById(wallet.userId);
      if (user && user.email) emailService.sendTransactionReceipt(user.email, receipt);
    } catch (e) {
      console.warn('Could not send receipt email:', e.message);
    }

    // Emit real-time update for top-up
    try {
      emitToUser(wallet.userId.toString(), 'wallet:balance', { walletId: wallet._id, balance: wallet.balance, held: wallet.held });
      emitToUser(wallet.userId.toString(), 'wallet:topup', { transaction: tx, wallet: { id: wallet._id, balance: wallet.balance } });
      emitToWallet(wallet._id.toString(), 'wallet:topup', { transaction: tx });
    } catch (e) {
      console.warn('Socket emit warning (confirmTopUp):', e.message);
    }

    return res.json({ transaction: tx, wallet });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Confirm topup error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Pre-authorize (place a hold)
exports.preauthorize = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { walletId } = req.params;
    const { amount, currency, idempotencyKey } = req.body;
    const userId = req.userId;

    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    const wallet = await Wallet.findById(walletId).session(session);
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Wallet not found' });
    }

    // Security check
    if (wallet.userId.toString() !== userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Access denied' });
    }

    if (wallet.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(402).json({ message: 'Insufficient funds' });
    }

    // Deduct from available balance and increase held
    wallet.balance -= amount;
    wallet.held = (wallet.held || 0) + amount;
    wallet.history.push({ title: 'Pre-authorization hold', amount: -amount, uuid: idempotencyKey || crypto.randomBytes(8).toString('hex'), date: new Date(), remarks: 'Hold for preauth' });
    await wallet.save({ session });

    const tx = new Transaction({ walletId, userId, type: 'preauth', status: 'authorized', amount, sourceCurrency: currency || 'NPR', targetCurrency: currency || 'NPR', idempotencyKey });
    await tx.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Emit preauth created and balance/held update
    try {
      emitToUser(wallet.userId.toString(), 'wallet:balance', { walletId: wallet._id, balance: wallet.balance, held: wallet.held });
      emitToUser(wallet.userId.toString(), 'preauth:created', { transaction: tx, wallet: { id: wallet._id, balance: wallet.balance, held: wallet.held } });
      emitToWallet(wallet._id.toString(), 'preauth:created', { transaction: tx });
    } catch (e) {
      console.warn('Socket emit warning (preauthorize):', e.message);
    }

    return res.status(201).json({ transaction: tx, wallet });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Preauthorize error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Capture a preauth (finalize the hold into a completed fare/transaction)
exports.capturePreauth = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { walletId, txId } = req.params;
    const wallet = await Wallet.findById(walletId).session(session);
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Wallet not found' });
    }

    const tx = await Transaction.findById(txId).session(session);
    if (!tx || tx.type !== 'preauth' || tx.status !== 'authorized') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Transaction not capturable' });
    }

    // Move held to completed (held already removed from balance when preauth created)
    wallet.held = (wallet.held || 0) - tx.amount;
    wallet.history.push({ title: 'Capture preauth', amount: -tx.amount, uuid: tx._id, date: new Date(), remarks: 'Captured preauth' });
    await wallet.save({ session });

    tx.status = 'completed';
    await tx.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send receipt
    const receipt = { id: tx._id, type: tx.type, amount: tx.amount, currency: tx.sourceCurrency, status: tx.status, date: tx.updatedAt || tx.createdAt };
    try {
      const user = await User.findById(wallet.userId);
      if (user && user.email) emailService.sendTransactionReceipt(user.email, receipt);
    } catch (e) {
      console.warn('Could not send receipt email:', e.message);
    }

    // Emit capture completed and balance update
    try {
      emitToUser(wallet.userId.toString(), 'wallet:balance', { walletId: wallet._id, balance: wallet.balance, held: wallet.held });
      emitToUser(wallet.userId.toString(), 'preauth:captured', { transaction: tx, wallet: { id: wallet._id, balance: wallet.balance } });
      emitToWallet(wallet._id.toString(), 'preauth:captured', { transaction: tx });
    } catch (e) {
      console.warn('Socket emit warning (capturePreauth):', e.message);
    }

    return res.json({ transaction: tx, wallet });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Capture preauth error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Release a preauth (void the hold and return funds to wallet)
exports.releasePreauth = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { walletId, txId } = req.params;
    const wallet = await Wallet.findById(walletId).session(session);
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Wallet not found' });
    }

    const tx = await Transaction.findById(txId).session(session);
    if (!tx || tx.type !== 'preauth' || tx.status !== 'authorized') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Transaction not releasable' });
    }

    // Release held funds back to balance
    wallet.held = (wallet.held || 0) - tx.amount;
    wallet.balance += tx.amount;
    wallet.history.push({ title: 'Release preauth', amount: tx.amount, uuid: tx._id, date: new Date(), remarks: 'Released preauth' });
    await wallet.save({ session });

    tx.status = 'released';
    await tx.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Emit release event and balance update
    try {
      emitToUser(wallet.userId.toString(), 'wallet:balance', { walletId: wallet._id, balance: wallet.balance, held: wallet.held });
      emitToUser(wallet.userId.toString(), 'preauth:released', { transaction: tx, wallet: { id: wallet._id, balance: wallet.balance } });
      emitToWallet(wallet._id.toString(), 'preauth:released', { transaction: tx });
    } catch (e) {
      console.warn('Socket emit warning (releasePreauth):', e.message);
    }

    return res.json({ transaction: tx, wallet });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Release preauth error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get receipt (JSON) for a transaction
exports.getReceipt = async (req, res) => {
  try {
    const { walletId, txId } = req.params;
    const tx = await Transaction.findById(txId);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    const receipt = {
      id: tx._id,
      type: tx.type,
      status: tx.status,
      amount: tx.amount,
      currency: tx.sourceCurrency,
      date: tx.updatedAt || tx.createdAt,
      walletId: tx.walletId,
      reference: tx.reference || null,
      meta: tx.meta || null
    };

    return res.json({ receipt });
  } catch (error) {
    console.error('Get receipt error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};