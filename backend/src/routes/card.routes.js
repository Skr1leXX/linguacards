const express = require('express');
const router = express.Router();
const cardController = require('../controllers/card.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkOwnership = require('../middleware/checkOwnership.middleware');

// Все маршруты требуют аутентификации
router.use(authMiddleware);

// Маршруты для карточек
router.get('/deck/:deckId', checkOwnership.checkDeckOwnership, cardController.getCardsByDeck);
router.post('/deck/:deckId', checkOwnership.checkDeckOwnership, cardController.createCard);
router.get('/:id', checkOwnership.checkCardOwnership, cardController.getCardById);
router.put('/:id', checkOwnership.checkCardOwnership, cardController.updateCard);
router.delete('/:id', checkOwnership.checkCardOwnership, cardController.deleteCard);
router.post('/:id/review', checkOwnership.checkCardOwnership, cardController.reviewCard);

module.exports = router;