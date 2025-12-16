const db = require('../config/database');

const checkDeckOwnership = async (req, res, next) => {
  try {
    const deckId = req.params.deckId || req.params.id;
    
    if (!deckId) {
      return next();
    }
    
    const deck = await new Promise((resolve, reject) => {
      db.get(
        'SELECT user_id FROM decks WHERE id = ?',
        [deckId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });
    
    if (!deck) {
      return res.status(404).json({ error: 'Колода не найдена' });
    }
    
    if (deck.user_id !== req.userId) {
      return res.status(403).json({ error: 'Нет доступа к этой колоде' });
    }
    
    next();
  } catch (error) {
    console.error('Ошибка при проверке прав доступа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const checkCardOwnership = async (req, res, next) => {
  try {
    const cardId = req.params.cardId || req.params.id;
    
    if (!cardId) {
      return next();
    }
    
    const card = await new Promise((resolve, reject) => {
      db.get(
        `SELECT d.user_id 
         FROM cards c
         JOIN decks d ON c.deck_id = d.id
         WHERE c.id = ?`,
        [cardId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });
    
    if (!card) {
      return res.status(404).json({ error: 'Карточка не найдена' });
    }
    
    if (card.user_id !== req.userId) {
      return res.status(403).json({ error: 'Нет доступа к этой карточке' });
    }
    
    next();
  } catch (error) {
    console.error('Ошибка при проверке прав доступа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = {
  checkDeckOwnership,
  checkCardOwnership
};