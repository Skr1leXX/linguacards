const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const db = require('../config/database');

router.use(authMiddleware);

// ─── Общая статистика ─────────────────────────────────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    const userId = req.userId;

    // Считаем каждую метрику отдельно чтобы избежать ошибок SQLite
    const total_cards = await new Promise((resolve) => {
      db.get('SELECT COUNT(*) as n FROM cards c JOIN decks d ON c.deck_id = d.id WHERE d.user_id = ?',
        [userId], (err, row) => resolve(err ? 0 : (row?.n || 0)));
    });
    const cards_today = await new Promise((resolve) => {
      db.get("SELECT COUNT(DISTINCT card_id) as n FROM study_logs WHERE user_id = ? AND date(review_date) = date('now')",
        [userId], (err, row) => resolve(err ? 0 : (row?.n || 0)));
    });
    const correct_answers = await new Promise((resolve) => {
      db.get('SELECT COUNT(*) as n FROM study_logs WHERE user_id = ? AND result = 1',
        [userId], (err, row) => resolve(err ? 0 : (row?.n || 0)));
    });
    const total_answers = await new Promise((resolve) => {
      db.get('SELECT COUNT(*) as n FROM study_logs WHERE user_id = ?',
        [userId], (err, row) => resolve(err ? 0 : (row?.n || 0)));
    });
    const active_days = await new Promise((resolve) => {
      db.get("SELECT COUNT(DISTINCT date(review_date)) as n FROM study_logs WHERE user_id = ? AND date(review_date) >= date('now', '-30 days')",
        [userId], (err, row) => resolve(err ? 0 : (row?.n || 0)));
    });
    const unique_decks = await new Promise((resolve) => {
      db.get('SELECT COUNT(*) as n FROM decks WHERE user_id = ?',
        [userId], (err, row) => resolve(err ? 0 : (row?.n || 0)));
    });
    const due_cards = await new Promise((resolve) => {
      db.get("SELECT COUNT(*) as n FROM cards c JOIN decks d ON c.deck_id = d.id WHERE d.user_id = ? AND (c.next_review_date <= datetime('now') OR c.next_review_date IS NULL)",
        [userId], (err, row) => resolve(err ? 0 : (row?.n || 0)));
    });

    const stats = { total_cards, cards_today, correct_answers: correct_answers, total_answers, active_days, unique_decks, unique_cards: total_cards, due_cards };

    const accuracy = total_answers > 0
      ? Math.round((correct_answers / total_answers) * 100)
      : 0;

    res.json({
      total_cards: total_cards || 0,
      cards_today: cards_today || 0,
      accuracy,
      streak_days: active_days || 0,
      correct_reviews: correct_answers || 0,
      total_reviews: total_answers || 0,
      unique_decks: unique_decks || 0,
      unique_cards: total_cards || 0,
      due_cards: due_cards || 0,
    });
  } catch (error) {
    console.error('Error getting overview stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Статистика по дням ───────────────────────────────────────────────────────
router.get('/daily', async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 7 } = req.query;

    db.all(`
      SELECT
        date(review_date) as date,
        COUNT(*) as total,
        SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) as correct
      FROM study_logs
      WHERE user_id = ?
      AND date(review_date) >= date('now', ? || ' days')
      GROUP BY date(review_date)
      ORDER BY date(review_date) DESC
      LIMIT 30
    `, [userId, `-${days}`], (err, rows) => {
      if (err) {
        console.error('Error getting daily stats:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Error getting daily stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Статистика по языкам ─────────────────────────────────────────────────────
router.get('/languages', async (req, res) => {
  try {
    const userId = req.userId;

    db.all(`
      SELECT
        d.language,
        COUNT(DISTINCT c.id) as total_cards,
        COUNT(DISTINCT CASE WHEN (c.next_review_date <= datetime('now') OR c.next_review_date IS NULL) THEN c.id END) as due_cards,
        COUNT(sl.id) as total_reviews,
        SUM(CASE WHEN sl.result = 1 THEN 1 ELSE 0 END) as correct_reviews
      FROM decks d
      LEFT JOIN cards c ON d.id = c.deck_id
      LEFT JOIN study_logs sl ON c.id = sl.card_id AND sl.user_id = ?
      WHERE d.user_id = ?
      GROUP BY d.language
      ORDER BY total_cards DESC
    `, [userId, userId], (err, rows) => {
      if (err) {
        console.error('Error getting language stats:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Error getting language stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Heatmap — активность за 365 дней ────────────────────────────────────────
router.get('/heatmap', async (req, res) => {
  try {
    const userId = req.userId;

    db.all(`
      SELECT
        date(review_date) as date,
        COUNT(*) as total
      FROM study_logs
      WHERE user_id = ?
        AND date(review_date) >= date('now', '-365 days')
      GROUP BY date(review_date)
      ORDER BY date(review_date) ASC
    `, [userId], (err, rows) => {
      if (err) {
        console.error('Error getting heatmap stats:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Error getting heatmap stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Статистика по колоде ─────────────────────────────────────────────────────
router.get('/deck/:deckId', async (req, res) => {
  try {
    const userId = req.userId;
    const { deckId } = req.params;

    db.get(`SELECT id FROM decks WHERE id = ? AND user_id = ?`, [deckId, userId], (err, deck) => {
      if (err || !deck) {
        return res.status(404).json({ error: 'Колода не найдена' });
      }

      db.get(`
        SELECT
          (SELECT COUNT(*) FROM cards WHERE deck_id = ?) as total_cards,
          (SELECT COUNT(*) FROM study_logs WHERE deck_id = ? AND result = 1) as correct_answers,
          (SELECT COUNT(*) FROM study_logs WHERE deck_id = ?) as total_reviews,
          (SELECT COUNT(DISTINCT card_id) FROM study_logs WHERE deck_id = ?) as studied_cards,
          (SELECT COUNT(*) FROM cards
           WHERE deck_id = ?
           AND (next_review_date <= datetime('now') OR next_review_date IS NULL)) as due_cards
      `, [deckId, deckId, deckId, deckId, deckId], (err, stats) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        const accuracy = stats.total_reviews > 0
          ? Math.round((stats.correct_answers / stats.total_reviews) * 100)
          : 0;

        const completionRate = stats.total_cards > 0
          ? Math.round((stats.studied_cards / stats.total_cards) * 100)
          : 0;

        res.json({
          deckId,
          total_cards: stats.total_cards || 0,
          studied_cards: stats.studied_cards || 0,
          accuracy,
          correct_answers: stats.correct_answers || 0,
          total_reviews: stats.total_reviews || 0,
          due_cards: stats.due_cards || 0,
          completion_rate: completionRate,
        });
      });
    });
  } catch (error) {
    console.error('Error getting deck stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;