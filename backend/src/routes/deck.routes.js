const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deck.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkOwnership = require('../middleware/checkOwnership.middleware');

// Все маршруты требуют аутентификации
router.use(authMiddleware);

// Маршруты для колод
router.get('/', deckController.getAllDecks);
router.post('/', deckController.createDeck);
router.get('/:id', checkOwnership.checkDeckOwnership, deckController.getDeckById);
router.put('/:id', checkOwnership.checkDeckOwnership, deckController.updateDeck);
router.delete('/:id', checkOwnership.checkDeckOwnership, deckController.deleteDeck);

module.exports = router;