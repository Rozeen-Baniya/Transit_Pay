const router = require('express').Router();
const transactionsController = require('../controllers/transactions.controller');

// Create a new transaction
router.post('/', transactionsController.createTransaction);

// Get a specific transaction by ID
router.get('/:userId', transactionsController.getTransactionsByUserId);

module.exports = router;