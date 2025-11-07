const router = require("express").Router();
const walletController = require("../controllers/wallet.controller");
const { auth } = require("../middlewares/auth.middleware");

// Create wallet (will be called after user creation)
router.post("/create", walletController.createWallet);

// Apply currency conversion middleware to all routes
router.use(walletController.withCurrencyConversion);

// Get wallet balance and details
router.get("/:userId", walletController.getWalletBalance);

// Get transaction history
router.get("/:walletId/transactions", auth, walletController.getTransactions);

// Deduct fare (with idempotency)
router.post("/:walletId/deduct", auth, walletController.deductFare);

// Top-up (initiate and confirm)
router.post('/:walletId/topup', auth, walletController.initiateTopUp);
router.post('/:walletId/topup/confirm', auth, walletController.confirmTopUp);

// Pre-authorization flows
router.post('/:walletId/preauth', auth, walletController.preauthorize);
router.post('/:walletId/preauth/:txId/capture', auth, walletController.capturePreauth);
router.post('/:walletId/preauth/:txId/release', auth, walletController.releasePreauth);

// Receipt
router.get('/:walletId/receipt/:txId', auth, walletController.getReceipt);

module.exports = router;
