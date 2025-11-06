const router = require("express").Router();

const { createCardRequest } = require("../controllers/card.request.controller");

router.post("/request", auth, cardRequestController.createCardRequest);

// Admin/User actions for card management
router.post('/:cardId/block', auth, cardRequestController.blockCard);
router.post('/:cardId/unblock', auth, cardRequestController.unblockCard);

// Card type management and creation
router.get('/:cardId', auth, cardRequestController.getCardById);
router.put('/:cardId/type', auth, cardRequestController.updateCardType);
router.post('/create-card', auth, cardRequestController.createCard);

module.exports = router;
