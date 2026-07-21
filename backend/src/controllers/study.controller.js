const db = require('../config/database');
const spacedRepetition = require('../services/spaced-repetition.service');
const { PREBUILT_DECKS, PREBUILT_CARDS } = require('./prebuilt-decks.data');

// ─── Карточки для текущей сессии ──────────────────────────────────────────────
const getSessionCards = async (req, res) => {
  try {
    const { deckId, limit = 20 } = req.query;

    let query = '';
    let params = [req.userId];

    if (deckId) {
      query = `
        SELECT c.*
        FROM cards c
        JOIN decks d ON c.deck_id = d.id
        WHERE d.user_id = ?
          AND d.id = ?
          AND c.next_review_date <= datetime('now')
        ORDER BY c.next_review_date ASC
        LIMIT ?
      `;
      params = [req.userId, deckId, parseInt(limit)];
    } else {
      query = `
        SELECT c.*
        FROM cards c
        JOIN decks d ON c.deck_id = d.id
        WHERE d.user_id = ?
          AND c.next_review_date <= datetime('now')
        ORDER BY c.next_review_date ASC
        LIMIT ?
      `;
      params = [req.userId, parseInt(limit)];
    }

    const cards = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    const cardsWithProgress = cards.map(card => ({
      ...card,
      progress: spacedRepetition.calculateProgress(card),
    }));

    res.json({ total_cards: cardsWithProgress.length, cards: cardsWithProgress });
  } catch (error) {
    console.error('Ошибка при получении карточек для сессии:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ─── Статистика изучения ──────────────────────────────────────────────────────
const getStudyStats = async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'day':   dateFilter = "AND date(review_date) = date('now')"; break;
      case 'week':  dateFilter = "AND review_date >= datetime('now', '-7 days')"; break;
      case 'month': dateFilter = "AND review_date >= datetime('now', '-30 days')"; break;
      case 'year':  dateFilter = "AND review_date >= datetime('now', '-365 days')"; break;
      default:      dateFilter = "AND review_date >= datetime('now', '-7 days')";
    }

    const stats = await new Promise((resolve, reject) => {
      db.get(
        `SELECT
          COUNT(*) as total_reviews,
          SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) as correct_reviews,
          COUNT(DISTINCT card_id) as unique_cards,
          COUNT(DISTINCT deck_id) as unique_decks
         FROM study_logs
         WHERE user_id = ? ${dateFilter}`,
        [req.userId],
        (err, row) => { if (err) reject(err); resolve(row); }
      );
    });

    const dailyStats = await new Promise((resolve, reject) => {
      db.all(
        `SELECT
          date(review_date) as date,
          COUNT(*) as total,
          SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) as correct
         FROM study_logs
         WHERE user_id = ?
           AND review_date >= datetime('now', '-30 days')
         GROUP BY date(review_date)
         ORDER BY date DESC
         LIMIT 30`,
        [req.userId],
        (err, rows) => { if (err) reject(err); resolve(rows); }
      );
    });

    const dueCards = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count
         FROM cards c
         JOIN decks d ON c.deck_id = d.id
         WHERE d.user_id = ?
           AND c.next_review_date <= datetime('now')`,
        [req.userId],
        (err, row) => { if (err) reject(err); resolve(row); }
      );
    });

    const languageStats = await new Promise((resolve, reject) => {
      db.all(
        `SELECT
          d.language,
          COUNT(DISTINCT c.id) as total_cards,
          SUM(CASE WHEN c.next_review_date <= datetime('now') THEN 1 ELSE 0 END) as due_cards,
          COUNT(sl.id) as total_reviews,
          SUM(CASE WHEN sl.result = 1 THEN 1 ELSE 0 END) as correct_reviews
         FROM decks d
         LEFT JOIN cards c ON d.id = c.deck_id
         LEFT JOIN study_logs sl ON c.id = sl.card_id AND sl.user_id = ?
         WHERE d.user_id = ?
         GROUP BY d.language`,
        [req.userId, req.userId],
        (err, rows) => { if (err) reject(err); resolve(rows); }
      );
    });

    const accuracy = stats.total_reviews > 0
      ? Math.round((stats.correct_reviews / stats.total_reviews) * 100)
      : 0;

    res.json({
      overview: {
        total_reviews: stats.total_reviews || 0,
        correct_reviews: stats.correct_reviews || 0,
        accuracy,
        unique_cards: stats.unique_cards || 0,
        unique_decks: stats.unique_decks || 0,
        due_cards: dueCards.count || 0,
        streak_days: 0,
      },
      daily_stats: dailyStats,
      language_stats: languageStats,
    });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ─── Импорт карточек ──────────────────────────────────────────────────────────
const importCards = async (req, res) => {
  try {
    const { deckId } = req.params;
    const { cards } = req.body;

    if (!Array.isArray(cards)) {
      return res.status(400).json({ error: 'Карточки должны быть массивом' });
    }

    const deck = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM decks WHERE id = ? AND user_id = ?', [deckId, req.userId],
        (err, row) => { if (err) reject(err); resolve(row); });
    });

    if (!deck) return res.status(404).json({ error: 'Колода не найдена' });

    const importedCards = [];
    const errors = [];

    for (let i = 0; i < cards.length; i++) {
      try {
        const card = cards[i];
        if (!card.front_text || !card.back_text) {
          errors.push({ index: i, error: 'Передний и обратный текст обязательны', data: card });
          continue;
        }
        const result = await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO cards (deck_id, front_text, back_text, example, difficulty_level, next_review_date)
             VALUES (?, ?, ?, ?, 0, datetime('now'))`,
            [deckId, card.front_text, card.back_text, card.example || null],
            function(err) { if (err) reject(err); resolve(this); }
          );
        });
        const newCard = await new Promise((resolve, reject) => {
          db.get('SELECT * FROM cards WHERE id = ?', [result.lastID],
            (err, row) => { if (err) reject(err); resolve(row); });
        });
        importedCards.push(newCard);
      } catch (e) {
        errors.push({ index: i, error: e.message, data: cards[i] });
      }
    }

    res.json({
      message: `Импортировано ${importedCards.length} из ${cards.length} карточек`,
      imported_count: importedCards.length,
      error_count: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Ошибка при импорте карточек:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ─── Экспорт карточек ─────────────────────────────────────────────────────────
const exportCards = async (req, res) => {
  try {
    const { deckId } = req.params;
    const { format = 'json' } = req.query;

    const deck = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, language FROM decks WHERE id = ? AND user_id = ?', [deckId, req.userId],
        (err, row) => { if (err) reject(err); resolve(row); });
    });

    if (!deck) return res.status(404).json({ error: 'Колода не найдена' });

    const cards = await new Promise((resolve, reject) => {
      db.all('SELECT front_text, back_text, example FROM cards WHERE deck_id = ?', [deckId],
        (err, rows) => { if (err) reject(err); resolve(rows); });
    });

    if (format === 'csv') {
      let csv = 'front,back,example\n';
      cards.forEach(card => {
        csv += `"${(card.front_text || '').replace(/"/g, '""')}","${(card.back_text || '').replace(/"/g, '""')}","${(card.example || '').replace(/"/g, '""')}"\n`;
      });
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', `attachment; filename="${deck.name}_export.csv"`);
      res.send(csv);
    } else {
      res.json({ deck: { name: deck.name, language: deck.language, export_date: new Date().toISOString() }, cards });
    }
  } catch (error) {
    console.error('Ошибка при экспорте карточек:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ─── Готовые колоды — список ──────────────────────────────────────────────────
const getPrebuiltDecks = async (req, res) => {
  try {
    const { category, language, difficulty, search } = req.query;

    let filtered = [...PREBUILT_DECKS];

    if (category)   filtered = filtered.filter(d => d.category === category);
    if (language)   filtered = filtered.filter(d => d.language === language);
    if (difficulty) filtered = filtered.filter(d => d.difficulty === difficulty);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Подсчёт для фильтров
    const countBy = (key) => {
      const map = {};
      PREBUILT_DECKS.forEach(d => { map[d[key]] = (map[d[key]] || 0) + 1; });
      return map;
    };

    const catCount = countBy('category');
    const langCount = countBy('language');
    const diffCount = countBy('difficulty');

    res.json({
      decks: filtered,
      total: filtered.length,
      categories: [
        { id: 'basic',      name: 'Основы',           count: catCount.basic || 0 },
        { id: 'grammar',    name: 'Грамматика',        count: catCount.grammar || 0 },
        { id: 'travel',     name: 'Путешествия',       count: catCount.travel || 0 },
        { id: 'business',   name: 'Бизнес',            count: catCount.business || 0 },
        { id: 'food',       name: 'Еда и рестораны',   count: catCount.food || 0 },
        { id: 'vocabulary', name: 'Словарный запас',   count: catCount.vocabulary || 0 },
      ],
      languages: [
        { code: 'en', name: 'Английский 🇬🇧',   count: langCount.en || 0 },
        { code: 'es', name: 'Испанский 🇪🇸',    count: langCount.es || 0 },
        { code: 'de', name: 'Немецкий 🇩🇪',     count: langCount.de || 0 },
        { code: 'fr', name: 'Французский 🇫🇷',  count: langCount.fr || 0 },
        { code: 'it', name: 'Итальянский 🇮🇹',  count: langCount.it || 0 },
        { code: 'ja', name: 'Японский 🇯🇵',     count: langCount.ja || 0 },
        { code: 'zh', name: 'Китайский 🇨🇳',    count: langCount.zh || 0 },
      ],
      difficulties: [
        { id: 'beginner',     name: 'Начинающий',  count: diffCount.beginner || 0 },
        { id: 'intermediate', name: 'Средний',     count: diffCount.intermediate || 0 },
        { id: 'advanced',     name: 'Продвинутый', count: diffCount.advanced || 0 },
      ],
    });
  } catch (error) {
    console.error('Ошибка при получении готовых колод:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ─── Готовые колоды — карточки ────────────────────────────────────────────────
const getPrebuiltDeckCards = async (req, res) => {
  try {
    const { deckId } = req.params;
    const id = parseInt(deckId);

    const deck = PREBUILT_DECKS.find(d => d.id === id);
    if (!deck) return res.status(404).json({ error: 'Колода не найдена' });

    const cards = PREBUILT_CARDS[id] || [];

    res.json({ deck_id: id, cards, total: cards.length });
  } catch (error) {
    console.error('Ошибка при получении карточек готовой колоды:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ─── Добавить готовую колоду пользователю ─────────────────────────────────────
const addPrebuiltDeck = async (req, res) => {
  try {
    const { deckId } = req.params;
    const { custom_name } = req.body;
    const userId = req.userId;
    const id = parseInt(deckId);

    const prebuiltDeck = PREBUILT_DECKS.find(d => d.id === id);
    if (!prebuiltDeck) return res.status(404).json({ error: 'Готовый курс не найден' });

    const cards = PREBUILT_CARDS[id] || [];
    if (cards.length === 0) return res.status(404).json({ error: 'Карточки для этой колоды не найдены' });

    const deckName = custom_name || prebuiltDeck.name;

    const deckResult = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO decks (user_id, name, language, description) VALUES (?, ?, ?, ?)',
        [userId, deckName, prebuiltDeck.language, prebuiltDeck.description],
        function(err) { if (err) reject(err); resolve(this); }
      );
    });

    for (const card of cards) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO cards (deck_id, front_text, back_text, example, difficulty_level, next_review_date)
           VALUES (?, ?, ?, ?, 0, datetime('now'))`,
          [deckResult.lastID, card.front_text, card.back_text, card.example || null],
          function(err) { if (err) reject(err); resolve(this); }
        );
      });
    }

    const newDeck = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM decks WHERE id = ?', [deckResult.lastID],
        (err, row) => { if (err) reject(err); resolve(row); });
    });

    res.status(201).json({
      message: `Колода "${deckName}" добавлена с ${cards.length} карточками`,
      deck: newDeck,
      added_cards: cards.length,
    });
  } catch (error) {
    console.error('Ошибка при добавлении готовой колоды:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = {
  getSessionCards,
  getStudyStats,
  importCards,
  exportCards,
  getPrebuiltDecks,
  getPrebuiltDeckCards,
  addPrebuiltDeck,
};