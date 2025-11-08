const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');
const Wallet = require('../models/wallet.model');

// ✅ Create Transaction
exports.createTransaction = async (req, res) => {
  try {
    const { type, amount, walletId, remarks } = req.body;

    if (!type || !amount || !walletId || !remarks) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    if (!['Topup', 'Bus Fare'].includes(type)) {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }

    const transaction = new Transaction({
      type,
      amount,
      walletId,
      remarks,
    });

    await transaction.save();

    res.status(201).json({ message: 'Transaction created successfully', transaction });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createTransaction2 = async (type, amount, walletId, remarks) =>{
    try {
        const transaction = new Transaction({
            type,
            amount,
            walletId,
            remarks,
        });
  
        await transaction.save();
  
        return { success: true, transaction };
      } catch (error) {
        console.error('Error creating transaction:', error);
        return { success: false, message: 'Internal server error' };
      }
}


exports.getTransactionsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: 'Missing userId parameter' });
        }

        const wallets = await Wallet.find({ userId });
        const walletIds = wallets.map(wallet => wallet._id);
        const transactions = await Transaction.find({ walletId: { $in: walletIds } }).sort({ createdAt: -1 });

        res.status(200).json({ transactions });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

