const db = require('../config/database');

const getAllDecks = async (req, res) => {
  try {
    const decks = await new Promise((resolve, reject) => {
      db.all(
        `SELECT d.*, 
                COUNT(c.id) as card_count,
                SUM(CASE WHEN c.next_review_date <= datetime('now') THEN 1 ELSE 0 END) as due_count
         FROM decks d
         LEFT JOIN cards c ON d.id = c.deck_id
         WHERE d.user_id = ?
         GROUP BY d.id
         ORDER BY d.created_at DESC`,
        [req.userId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    res.json(decks);
  } catch (error) {
    console.error('Ошибка при получении колод:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const getDeckById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deck = await new Promise((resolve, reject) => {
      db.get(
        `SELECT d.*, 
                COUNT(c.id) as card_count,
                SUM(CASE WHEN c.next_review_date <= datetime('now') THEN 1 ELSE 0 END) as due_count
         FROM decks d
         LEFT JOIN cards c ON d.id = c.deck_id
         WHERE d.id = ? AND d.user_id = ?
         GROUP BY d.id`,
        [id, req.userId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!deck) {
      return res.status(404).json({ error: 'Колода не найдена' });
    }

    res.json(deck);
  } catch (error) {
    console.error('Ошибка при получении колоды:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const createDeck = async (req, res) => {
  try {
    const { name, language, description, is_public = false } = req.body;
    
    if (!name || !language) {
      return res.status(400).json({ error: 'Название и язык обязательны' });
    }

    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO decks (user_id, name, language, description, is_public) 
         VALUES (?, ?, ?, ?, ?)`,
        [req.userId, name, language, description || null, is_public ? 1 : 0],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });

    const deck = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM decks WHERE id = ?',
        [result.lastID],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    res.status(201).json({
      message: 'Колода успешно создана',
      deck
    });
  } catch (error) {
    console.error('Ошибка при создании колоды:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const updateDeck = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, language, description, is_public } = req.body;
    
    // Проверяем, существует ли колода и принадлежит ли пользователю
    const existingDeck = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM decks WHERE id = ? AND user_id = ?',
        [id, req.userId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!existingDeck) {
      return res.status(404).json({ error: 'Колода не найдена' });
    }

    // Обновляем только предоставленные поля
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    
    if (language !== undefined) {
      updates.push('language = ?');
      params.push(language);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    
    if (is_public !== undefined) {
      updates.push('is_public = ?');
      params.push(is_public ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }
    
    params.push(id, req.userId);
    
    const query = `UPDATE decks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    
    await new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        resolve(this);
      });
    });

    const updatedDeck = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM decks WHERE id = ? AND user_id = ?',
        [id, req.userId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    res.json({
      message: 'Колода успешно обновлена',
      deck: updatedDeck
    });
  } catch (error) {
    console.error('Ошибка при обновлении колоды:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const deleteDeck = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM decks WHERE id = ? AND user_id = ?',
        [id, req.userId],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Колода не найдена' });
    }

    res.json({ message: 'Колода успешно удалена' });
  } catch (error) {
    console.error('Ошибка при удалении колоды:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = {
  getAllDecks,
  getDeckById,
  createDeck,
  updateDeck,
  deleteDeck
};