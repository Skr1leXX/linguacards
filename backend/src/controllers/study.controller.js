const db = require('../config/database');
const spacedRepetition = require('../services/spaced-repetition.service');

const getSessionCards = async (req, res) => {
  try {
    const { deckId, limit = 20 } = req.query;
    
    let query = '';
    let params = [req.userId];
    
    if (deckId) {
      // Карточки для конкретной колоды
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
      // Все карточки пользователя, готовые к повторению
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

    // Добавляем информацию о прогрессе
    const cardsWithProgress = cards.map(card => ({
      ...card,
      progress: spacedRepetition.calculateProgress(card)
    }));

    res.json({
      total_cards: cardsWithProgress.length,
      cards: cardsWithProgress
    });
  } catch (error) {
    console.error('Ошибка при получении карточек для сессии:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const getStudyStats = async (req, res) => {
  try {
    const { period = 'week' } = req.query; // day, week, month, year
    
    let dateFilter = '';
    switch (period) {
      case 'day':
        dateFilter = "AND date(review_date) = date('now')";
        break;
      case 'week':
        dateFilter = "AND review_date >= datetime('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "AND review_date >= datetime('now', '-30 days')";
        break;
      case 'year':
        dateFilter = "AND review_date >= datetime('now', '-365 days')";
        break;
      default:
        dateFilter = "AND review_date >= datetime('now', '-7 days')";
    }
    
    // Общая статистика
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
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });
    
    // Статистика по дням (для графика)
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
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
    
    // Количество карточек к повторению
    const dueCards = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count
         FROM cards c
         JOIN decks d ON c.deck_id = d.id
         WHERE d.user_id = ? 
           AND c.next_review_date <= datetime('now')`,
        [req.userId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });
    
    // Серия дней подряд
    const streak = await new Promise((resolve, reject) => {
      db.get(
        `WITH RECURSIVE dates(date) AS (
          SELECT date('now')
          UNION ALL
          SELECT date(date, '-1 day')
          FROM dates
          WHERE date > date('now', '-100 days')
        ),
        study_days AS (
          SELECT DISTINCT date(review_date) as studied_date
          FROM study_logs 
          WHERE user_id = ?
        ),
        streak_calc AS (
          SELECT d.date,
                 CASE WHEN sd.studied_date IS NOT NULL THEN 1 ELSE 0 END as studied,
                 ROW_NUMBER() OVER (ORDER BY d.date DESC) as rn
          FROM dates d
          LEFT JOIN study_days sd ON d.date = sd.studied_date
          ORDER BY d.date DESC
        )
        SELECT COUNT(*) as streak_days
        FROM streak_calc
        WHERE studied = 1
          AND rn = 1 OR (SELECT studied FROM streak_calc s2 WHERE s2.rn = streak_calc.rn + 1) = 1`,
        [req.userId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    // Статистика по языкам
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
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    const accuracy = stats.total_reviews > 0 
      ? Math.round((stats.correct_reviews / stats.total_reviews) * 100) 
      : 0;

    res.json({
      overview: {
        total_reviews: stats.total_reviews || 0,
        correct_reviews: stats.correct_reviews || 0,
        accuracy: accuracy,
        unique_cards: stats.unique_cards || 0,
        unique_decks: stats.unique_decks || 0,
        due_cards: dueCards.count || 0,
        streak_days: streak.streak_days || 0
      },
      daily_stats: dailyStats,
      language_stats: languageStats
    });
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const importCards = async (req, res) => {
  try {
    const { deckId } = req.params;
    const { cards, format = 'json' } = req.body;
    
    if (!Array.isArray(cards)) {
      return res.status(400).json({ error: 'Карточки должны быть массивом' });
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

    const importedCards = [];
    const errors = [];

    for (let i = 0; i < cards.length; i++) {
      try {
        const card = cards[i];
        
        if (!card.front_text || !card.back_text) {
          errors.push({
            index: i,
            error: 'Передний и обратный текст обязательны',
            data: card
          });
          continue;
        }

        const result = await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO cards (deck_id, front_text, back_text, example, difficulty_level, next_review_date) 
             VALUES (?, ?, ?, ?, 0, datetime('now'))`,
            [deckId, card.front_text, card.back_text, card.example || null],
            function(err) {
              if (err) reject(err);
              resolve(this);
            }
          );
        });

        const newCard = await new Promise((resolve, reject) => {
          db.get(
            'SELECT * FROM cards WHERE id = ?',
            [result.lastID],
            (err, row) => {
              if (err) reject(err);
              resolve(row);
            }
          );
        });

        importedCards.push(newCard);
      } catch (cardError) {
        errors.push({
          index: i,
          error: cardError.message,
          data: cards[i]
        });
      }
    }

    res.json({
      message: `Импортировано ${importedCards.length} из ${cards.length} карточек`,
      imported_count: importedCards.length,
      error_count: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Ошибка при импорте карточек:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const exportCards = async (req, res) => {
  try {
    const { deckId } = req.params;
    const { format = 'json' } = req.query;
    
    // Проверяем, что колода принадлежит пользователю
    const deck = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, language FROM decks WHERE id = ? AND user_id = ?',
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
        'SELECT front_text, back_text, example FROM cards WHERE deck_id = ?',
        [deckId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    const exportData = {
      deck: {
        name: deck.name,
        language: deck.language,
        export_date: new Date().toISOString()
      },
      cards: cards
    };

    if (format === 'csv') {
      // Генерация CSV
      let csv = 'front,back,example\n';
      cards.forEach(card => {
        csv += `"${(card.front_text || '').replace(/"/g, '""')}","${(card.back_text || '').replace(/"/g, '""')}","${(card.example || '').replace(/"/g, '""')}"\n`;
      });
      
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', `attachment; filename="${deck.name}_export.csv"`);
      res.send(csv);
    } else {
      // JSON по умолчанию
      res.json(exportData);
    }
  } catch (error) {
    console.error('Ошибка при экспорте карточек:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ДОБАВЬТЕ ЭТОТ КОД В КОНЕЦ ФАЙЛА study.controller.js

const getPrebuiltDecks = async (req, res) => {
  try {
    const { category, language, difficulty, search } = req.query;
    
    // Базовые готовые колоды (в реальном приложении были бы в базе данных)
    const prebuiltDecks = [
      {
        id: 1,
        name: '100 основных английских слов',
        language: 'en',
        description: 'Самые часто используемые английские слова для начинающих',
        category: 'basic',
        difficulty: 'beginner',
        card_count: 100,
        tags: ['базовый', 'начальный', 'частотный'],
        is_free: true,
        author: 'Spaced Repetition Team',
        created_at: '2024-01-01T00:00:00.000Z',
        popularity: 95
      },
      {
        id: 2,
        name: 'Испанские глаголы для путешествий',
        language: 'es',
        description: 'Необходимые глаголы для общения в испаноязычных странах',
        category: 'travel',
        difficulty: 'beginner',
        card_count: 50,
        tags: ['путешествия', 'глаголы', 'практический'],
        is_free: true,
        author: 'Spaced Repetition Team',
        created_at: '2024-01-02T00:00:00.000Z',
        popularity: 85
      },
      {
        id: 3,
        name: 'Немецкие существительные с артиклями',
        language: 'de',
        description: 'Основные немецкие существительные с правильными артиклями',
        category: 'grammar',
        difficulty: 'intermediate',
        card_count: 75,
        tags: ['грамматика', 'существительные', 'артикли'],
        is_free: true,
        author: 'Spaced Repetition Team',
        created_at: '2024-01-03T00:00:00.000Z',
        popularity: 78
      },
      {
        id: 4,
        name: 'Французские фразы для ресторана',
        language: 'fr',
        description: 'Полезные фразы для заказа еды в ресторанах Франции',
        category: 'food',
        difficulty: 'beginner',
        card_count: 30,
        tags: ['ресторан', 'еда', 'диалоги'],
        is_free: false,
        author: 'Spaced Repetition Team',
        created_at: '2024-01-04T00:00:00.000Z',
        popularity: 92
      },
      {
        id: 5,
        name: 'Деловой английский',
        language: 'en',
        description: 'Ключевые слова и фразы для делового общения',
        category: 'business',
        difficulty: 'advanced',
        card_count: 120,
        tags: ['бизнес', 'профессиональный', 'переговоры'],
        is_free: false,
        author: 'Spaced Repetition Team',
        created_at: '2024-01-05T00:00:00.000Z',
        popularity: 88
      },
      {
        id: 6,
        name: 'Итальянские прилагательные',
        language: 'it',
        description: 'Описательные прилагательные для повседневного общения',
        category: 'vocabulary',
        difficulty: 'intermediate',
        card_count: 60,
        tags: ['прилагательные', 'описания', 'разговорный'],
        is_free: true,
        author: 'Spaced Repetition Team',
        created_at: '2024-01-06T00:00:00.000Z',
        popularity: 70
      }
    ];

    // Фильтрация по параметрам
    let filteredDecks = [...prebuiltDecks];

    if (category) {
      filteredDecks = filteredDecks.filter(deck => deck.category === category);
    }

    if (language) {
      filteredDecks = filteredDecks.filter(deck => deck.language === language);
    }

    if (difficulty) {
      filteredDecks = filteredDecks.filter(deck => deck.difficulty === difficulty);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredDecks = filteredDecks.filter(deck => 
        deck.name.toLowerCase().includes(searchLower) ||
        deck.description.toLowerCase().includes(searchLower) ||
        deck.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Фильтр только бесплатных для демо (в реальном приложении была бы подписка)
    filteredDecks = filteredDecks.filter(deck => deck.is_free);

    res.json({
      decks: filteredDecks,
      total: filteredDecks.length,
      categories: [
        { id: 'basic', name: 'Основы', count: 2 },
        { id: 'travel', name: 'Путешествия', count: 1 },
        { id: 'grammar', name: 'Грамматика', count: 1 },
        { id: 'food', name: 'Еда и рестораны', count: 1 },
        { id: 'business', name: 'Бизнес', count: 1 },
        { id: 'vocabulary', name: 'Словарный запас', count: 1 }
      ],
      languages: [
        { code: 'en', name: 'Английский', count: 2 },
        { code: 'es', name: 'Испанский', count: 1 },
        { code: 'de', name: 'Немецкий', count: 1 },
        { code: 'fr', name: 'Французский', count: 1 },
        { code: 'it', name: 'Итальянский', count: 1 }
      ],
      difficulties: [
        { id: 'beginner', name: 'Начинающий', count: 3 },
        { id: 'intermediate', name: 'Средний', count: 2 },
        { id: 'advanced', name: 'Продвинутый', count: 1 }
      ]
    });
  } catch (error) {
    console.error('Ошибка при получении готовых колод:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const getPrebuiltDeckCards = async (req, res) => {
  try {
    const { deckId } = req.params;
    
    // Примеры карточек для разных колод
    const deckCards = {
      1: [ // Английские основы
        { front_text: "Hello", back_text: "Привет", example: "Hello, how are you?" },
        { front_text: "Goodbye", back_text: "До свидания", example: "Goodbye, see you tomorrow!" },
        { front_text: "Thank you", back_text: "Спасибо", example: "Thank you for your help." },
        { front_text: "Please", back_text: "Пожалуйста", example: "Can I have some water, please?" },
        { front_text: "Yes", back_text: "Да", example: "Yes, I understand." },
        { front_text: "No", back_text: "Нет", example: "No, thank you." },
        { front_text: "Sorry", back_text: "Извините", example: "Sorry, I'm late." },
        { front_text: "Help", back_text: "Помощь", example: "I need help." },
        { front_text: "Water", back_text: "Вода", example: "Can I have some water?" },
        { front_text: "Food", back_text: "Еда", example: "I'm hungry, I need food." }
      ],
      2: [ // Испанские глаголы
        { front_text: "hablar", back_text: "говорить", example: "Yo hablo español." },
        { front_text: "comer", back_text: "есть", example: "Vamos a comer ahora." },
        { front_text: "beber", back_text: "пить", example: "Quiero beber agua." },
        { front_text: "dormir", back_text: "спать", example: "Necesito dormir." },
        { front_text: "viajar", back_text: "путешествовать", example: "Me gusta viajar." }
      ],
      3: [ // Немецкие существительные
        { front_text: "der Tisch", back_text: "стол", example: "Der Tisch ist groß." },
        { front_text: "die Tür", back_text: "дверь", example: "Die Tür ist geschlossen." },
        { front_text: "das Buch", back_text: "книга", example: "Das Buch ist interessant." },
        { front_text: "der Stuhl", back_text: "стул", example: "Der Stuhl ist bequem." },
        { front_text: "das Fenster", back_text: "окно", example: "Das Fenster ist offen." }
      ],
      6: [ // Итальянские прилагательные
        { front_text: "bello", back_text: "красивый", example: "Un bello panorama." },
        { front_text: "buono", back_text: "хороший", example: "Buono il cibo." },
        { front_text: "grande", back_text: "большой", example: "Una grande città." },
        { front_text: "piccolo", back_text: "маленький", example: "Un piccolo negozio." },
        { front_text: "nuovo", back_text: "новый", example: "Una nuova macchina." }
      ]
    };

    const cards = deckCards[deckId] || [];
    
    res.json({
      deck_id: parseInt(deckId),
      cards: cards,
      total: cards.length
    });
  } catch (error) {
    console.error('Ошибка при получении карточек готовой колоды:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const addPrebuiltDeck = async (req, res) => {
  try {
    const { deckId } = req.params;
    const { custom_name, language_preference } = req.body;
    const userId = req.userId;

    // Получаем информацию о готовой колоде
    const prebuiltDecks = [
      { id: 1, name: '100 основных английских слов', language: 'en' },
      { id: 2, name: 'Испанские глаголы для путешествий', language: 'es' },
      { id: 3, name: 'Немецкие существительные с артиклями', language: 'de' },
      { id: 6, name: 'Итальянские прилагательные', language: 'it' }
    ];

    const prebuiltDeck = prebuiltDecks.find(d => d.id === parseInt(deckId));
    
    if (!prebuiltDeck) {
      return res.status(404).json({ error: 'Готовый курс не найден' });
    }

    // Создаем новую колоду для пользователя
    const deckName = custom_name || prebuiltDeck.name;
    
    const deckResult = await new Promise((resolve, reject) => {
      db.run(
  'INSERT INTO decks (user_id, name, language, description) VALUES (?, ?, ?, ?)',
  [userId, deckName, prebuiltDeck.language, `Импортировано из готовой коллекции: ${prebuiltDeck.name}`],
  function(err) {
    if (err) reject(err);
    resolve(this);
  }
);
    });

    // Получаем карточки готовой колоды и добавляем их
    const deckCards = {
      1: [ // Английские основы - первые 20 карточек
        { front_text: "Hello", back_text: "Привет", example: "Hello, how are you?" },
        { front_text: "Goodbye", back_text: "До свидания", example: "Goodbye, see you tomorrow!" },
        { front_text: "Thank you", back_text: "Спасибо", example: "Thank you for your help." },
        { front_text: "Please", back_text: "Пожалуйста", example: "Can I have some water, please?" },
        { front_text: "Yes", back_text: "Да", example: "Yes, I understand." },
        { front_text: "No", back_text: "Нет", example: "No, thank you." },
        { front_text: "Sorry", back_text: "Извините", example: "Sorry, I'm late." },
        { front_text: "Help", back_text: "Помощь", example: "I need help." },
        { front_text: "Water", back_text: "Вода", example: "Can I have some water?" },
        { front_text: "Food", back_text: "Еда", example: "I'm hungry, I need food." },
        { front_text: "Time", back_text: "Время", example: "What time is it?" },
        { front_text: "Day", back_text: "День", example: "Have a nice day!" },
        { front_text: "Night", back_text: "Ночь", example: "Good night!" },
        { front_text: "Morning", back_text: "Утро", example: "Good morning!" },
        { front_text: "Evening", back_text: "Вечер", example: "Good evening!" },
        { front_text: "Week", back_text: "Неделя", example: "See you next week!" },
        { front_text: "Month", back_text: "Месяц", example: "I will be back next month." },
        { front_text: "Year", back_text: "Год", example: "Happy New Year!" },
        { front_text: "Today", back_text: "Сегодня", example: "What are you doing today?" },
        { front_text: "Tomorrow", back_text: "Завтра", example: "See you tomorrow!" }
      ],
      2: [ // Испанские глаголы
        { front_text: "hablar", back_text: "говорить", example: "Yo hablo español." },
        { front_text: "comer", back_text: "есть", example: "Vamos a comer ahora." },
        { front_text: "beber", back_text: "пить", example: "Quiero beber agua." },
        { front_text: "dormir", back_text: "спать", example: "Necesito dormir." },
        { front_text: "viajar", back_text: "путешествовать", example: "Me gusta viajar." },
        { front_text: "trabajar", back_text: "работать", example: "Él trabaja en una oficina." },
        { front_text: "estudiar", back_text: "учиться", example: "Ella estudia medicina." },
        { front_text: "leer", back_text: "читать", example: "Me gusta leer libros." },
        { front_text: "escribir", back_text: "писать", example: "Tengo que escribir una carta." },
        { front_text: "aprender", back_text: "учить", example: "Quiero aprender español." }
      ],
      3: [ // Немецкие существительные
        { front_text: "der Tisch", back_text: "стол", example: "Der Tisch ist groß." },
        { front_text: "die Tür", back_text: "дверь", example: "Die Tür ist geschlossen." },
        { front_text: "das Buch", back_text: "книга", example: "Das Buch ist interessant." },
        { front_text: "der Stuhl", back_text: "стул", example: "Der Stuhl ist bequem." },
        { front_text: "das Fenster", back_text: "окно", example: "Das Fenster ist offen." },
        { front_text: "das Haus", back_text: "дом", example: "Das Haus ist alt." },
        { front_text: "die Straße", back_text: "улица", example: "Die Straße ist lang." },
        { front_text: "der Garten", back_text: "сад", example: "Der Garten ist schön." },
        { front_text: "die Küche", back_text: "кухня", example: "Die Küche ist modern." },
        { front_text: "das Zimmer", back_text: "комната", example: "Das Zimmer ist sauber." }
      ],
      6: [ // Итальянские прилагательные
        { front_text: "bello", back_text: "красивый", example: "Un bello panorama." },
        { front_text: "buono", back_text: "хороший", example: "Buono il cibo." },
        { front_text: "grande", back_text: "большой", example: "Una grande città." },
        { front_text: "piccolo", back_text: "маленький", example: "Un piccolo negozio." },
        { front_text: "nuovo", back_text: "новый", example: "Una nuova macchina." },
        { front_text: "vecchio", back_text: "старый", example: "Un vecchio amico." },
        { front_text: "alto", back_text: "высокий", example: "Un alto edificio." },
        { front_text: "basso", back_text: "низкий", example: "Un basso prezzo." },
        { front_text: "lungo", back_text: "длинный", example: "Una lunga strada." },
        { front_text: "corto", back_text: "короткий", example: "Un corto periodo." }
      ]
    };

    const cards = deckCards[deckId] || [];
    
    // Добавляем карточки в новую колоду
    for (const card of cards) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO cards (deck_id, front_text, back_text, example, difficulty_level, next_review_date) 
           VALUES (?, ?, ?, ?, 0, datetime('now'))`,
          [deckResult.lastID, card.front_text, card.back_text, card.example || null],
          function(err) {
            if (err) reject(err);
            resolve(this);
          }
        );
      });
    }

    // Получаем созданную колоду
    const newDeck = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM decks WHERE id = ?',
        [deckResult.lastID],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    res.status(201).json({
      message: 'Колода успешно добавлена в вашу коллекцию',
      deck: newDeck,
      added_cards: cards.length
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
  addPrebuiltDeck          
};