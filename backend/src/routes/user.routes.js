const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Получение профиля (защищенный маршрут)
router.get('/me', authMiddleware, userController.getProfile);

// Обновление профиля
router.put('/profile', authMiddleware, userController.updateProfile);

// Смена пароля
router.put('/change-password', authMiddleware, userController.changePassword);

module.exports = router;