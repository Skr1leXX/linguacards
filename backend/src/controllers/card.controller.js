const db = require('../config/database');
const spacedRepetition = require('../services/spaced-repetition.service');

const getCardsByDeck = async (req, res) => {
  try {
    const { deckId } = req.params;
    
    // Проверяем, что колода принадлежит пользователю
    const deck = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM decks WHERE id = ? AND user_id = ?',
        [deckId, req.userId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!deck) {
      return res.status(404).json({ error: 'Колода не найдена' });
    }

    const cards = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM cards 
         WHERE deck_id = ? 
         ORDER BY next_review_date ASC, created_at DESC`,
        [deckId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    // Добавляем информацию о готовности к повторению
    const cardsWithDueInfo = cards.map(card => ({
      ...card,
      is_due: spacedRepetition.isCardDue(card),
      progress: spacedRepetition.calculateProgress(card)
    }));

    res.json(cardsWithDueInfo);
  } catch (error) {
    console.error('Ошибка при получении карточек:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const getCardById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const card = await new Promise((resolve, reject) => {
      db.get(
        `SELECT c.* FROM cards c
         JOIN decks d ON c.deck_id = d.id
         WHERE c.id = ? AND d.user_id = ?`,
        [id, req.userId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!card) {
      return res.status(404).json({ error: 'Карточка не найдена' });
    }

    res.json({
      ...card,
      is_due: spacedRepetition.isCardDue(card),
      progress: spacedRepetition.calculateProgress(card)
    });
  } catch (error) {
    console.error('Ошибка при получении карточки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const createCard = async (req, res) => {
  try {
    const { deckId } = req.params;
    const { front_text, back_text, example, tags } = req.body;
    
    if (!front_text || !back_text) {
      return res.status(400).json({ error: 'Передний и обратный текст обязательны' });
    }

    // Проверяем, что колода принадлежит пользователю
    const deck = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM decks WHERE id = ? AND user_id = ?',
        [deckId, req.userId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!deck) {
      return res.status(404).json({ error: 'Колода не найдена' });
    }

    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO cards (deck_id, front_text, back_text, example, difficulty_level, next_review_date) 
         VALUES (?, ?, ?, ?, 0, datetime('now'))`,
        [deckId, front_text, back_text, example || null],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });

    const card = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM cards WHERE id = ?',
        [result.lastID],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    // Если есть теги, сохраняем их
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT OR IGNORE INTO tags (name) VALUES (?)`,
            [tag],
            function(err) {
              if (err) reject(err);
              resolve(this);
            }
          );
        });

        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO card_tags (card_id, tag_id) 
             SELECT ?, id FROM tags WHERE name = ?`,
            [card.id, tag],
            function(err) {
              if (err) reject(err);
              resolve(this);
            }
          );
        });
      }
    }

    res.status(201).json({
      message: 'Карточка успешно создана',
      card: {
        ...card,
        is_due: true,
        progress: 0
      }
    });
  } catch (error) {
    console.error('Ошибка при создании карточки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { front_text, back_text, example, tags } = req.body;
    
    // Проверяем, что карточка принадлежит пользователю
    const existingCard = await new Promise((resolve, reject) => {
      db.get(
        `SELECT c.id FROM cards c
         JOIN decks d ON c.deck_id = d.id
         WHERE c.id = ? AND d.user_id = ?`,
        [id, req.userId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!existingCard) {
      return res.status(404).json({ error: 'Карточка не найдена' });
    }

    // Обновляем только предоставленные поля
    const updates = [];
    const params = [];
    
    if (front_text !== undefined) {
      updates.push('front_text = ?');
      params.push(front_text);
    }
    
    if (back_text !== undefined) {
      updates.push('back_text = ?');
      params.push(back_text);
    }
    
    if (example !== undefined) {
      updates.push('example = ?');
      params.push(example);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }
    
    params.push(id);
    
    const query = `UPDATE cards SET ${updates.join(', ')} WHERE id = ?`;
    
    await new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        resolve(this);
      });
    });

    // Обновляем теги если они предоставлены
    if (tags !== undefined) {
      // Удаляем старые теги
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM card_tags WHERE card_id = ?', [id], function(err) {
          if (err) reject(err);
          resolve(this);
        });
      });

      // Добавляем новые теги
      if (Array.isArray(tags)) {
        for (const tag of tags) {
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT OR IGNORE INTO tags (name) VALUES (?)`,
              [tag],
              function(err) {
                if (err) reject(err);
                resolve(this);
              }
            );
          });

          await new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO card_tags (card_id, tag_id) 
               SELECT ?, id FROM tags WHERE name = ?`,
              [id, tag],
              function(err) {
                if (err) reject(err);
                resolve(this);
              }
            );
          });
        }
      }
    }

    const updatedCard = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM cards WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    res.json({
      message: 'Карточка успешно обновлена',
      card: {
        ...updatedCard,
        is_due: spacedRepetition.isCardDue(updatedCard),
        progress: spacedRepetition.calculateProgress(updatedCard)
      }
    });
  } catch (error) {
    console.error('Ошибка при обновлении карточки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM cards 
         WHERE id = ? AND deck_id IN (
           SELECT id FROM decks WHERE user_id = ?
         )`,
        [id, req.userId],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Карточка не найдена' });
    }

    res.json({ message: 'Карточка успешно удалена' });
  } catch (error) {
    console.error('Ошибка при удалении карточки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const reviewCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { result: isCorrect } = req.body; // true = правильно, false = неправильно
    
    if (isCorrect === undefined) {
      return res.status(400).json({ error: 'Результат обязателен' });
    }

    // Получаем текущую карточку
    const card = await new Promise((resolve, reject) => {
      db.get(
        `SELECT c.* FROM cards c
         JOIN decks d ON c.deck_id = d.id
         WHERE c.id = ? AND d.user_id = ?`,
        [id, req.userId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!card) {
      return res.status(404).json({ error: 'Карточка не найдена' });
    }

    // Применяем алгоритм Лейтнера
    const { newLevel, nextReviewDate } = spacedRepetition.calculateNextReview(
      card.difficulty_level,
      isCorrect
    );

    // Обновляем карточку
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE cards 
         SET difficulty_level = ?, 
             next_review_date = ?,
             last_reviewed = datetime('now'),
             review_count = review_count + 1,
             correct_count = correct_count + ?
         WHERE id = ?`,
        [newLevel, nextReviewDate, isCorrect ? 1 : 0, id],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });

    // Логируем результат изучения
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO study_logs (user_id, card_id, deck_id, result) 
         VALUES (?, ?, ?, ?)`,
        [req.userId, id, card.deck_id, isCorrect ? 1 : 0],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });

    // Получаем обновленную карточку
    const updatedCard = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM cards WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    res.json({
      message: isCorrect ? 'Правильно! Карточка перемещена на следующий уровень.' : 'Неправильно. Карточка возвращена на первый уровень.',
      card: {
        ...updatedCard,
        is_due: false, // Только что изучена
        progress: spacedRepetition.calculateProgress(updatedCard)
      }
    });
  } catch (error) {
    console.error('Ошибка при изучении карточки:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = {
  getCardsByDeck,
  getCardById,
  createCard,
  updateCard,
  deleteCard,
  reviewCard
};