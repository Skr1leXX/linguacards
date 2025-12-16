const express = require('express');
const router = express.Router();
const studyController = require('../controllers/study.controller');
const authMiddleware = require('../middleware/auth.middleware');
const checkOwnership = require('../middleware/checkOwnership.middleware');

// Все маршруты требуют аутентификации
router.use(authMiddleware);

// Маршруты для изучения
router.get('/session', studyController.getSessionCards);
router.get('/stats', studyController.getStudyStats);
router.post('/import/:deckId', checkOwnership.checkDeckOwnership, studyController.importCards);
router.get('/export/:deckId', checkOwnership.checkDeckOwnership, studyController.exportCards);
router.get('/prebuilt-decks', studyController.getPrebuiltDecks);
router.get('/prebuilt-decks/:deckId/cards', studyController.getPrebuiltDeckCards);
router.post('/prebuilt-decks/:deckId/add', studyController.addPrebuiltDeck);

module.exports = router;


module.exports = router;