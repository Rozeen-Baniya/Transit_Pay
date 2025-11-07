const router = require("express").Router();

const cardRequestController = require("../controllers/card.request.controller");

router.post("/request", cardRequestController.createCardRequest);

// Admin/User actions for card management
router.post('/:cardId/block', cardRequestController.blockCard);
router.post('/:cardId/unblock', cardRequestController.unblockCard);

// Card type management and creation
router.get('/:cardId', cardRequestController.getCardById);
router.put('/:cardId/type', cardRequestController.updateCardType);
router.post('/create-card', cardRequestController.createCard);

module.exports = router;
