const express = require('express');
const router = express.Router();
const deckController = require('../controllers/deck.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, deckController.getAllDecks);
router.post('/', authMiddleware, deckController.createDeck);
router.get('/:id', authMiddleware, deckController.getDeckById);
router.put('/:id', authMiddleware, deckController.updateDeck);
router.delete('/:id', authMiddleware, deckController.deleteDeck);

module.exports = router;