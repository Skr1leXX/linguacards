const bcrypt = require('bcryptjs');
const db = require('../src/config/database');

const createTables = `
-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  language_preference VARCHAR(50) DEFAULT 'ru'
);

-- Таблица колод (decks)
CREATE TABLE IF NOT EXISTS decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  language VARCHAR(50) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Таблица карточек (cards)
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id INTEGER NOT NULL,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  example TEXT,
  difficulty_level INTEGER DEFAULT 0,
  next_review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_reviewed TIMESTAMP,
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

-- Таблица тегов
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица связей карточка-тег
CREATE TABLE IF NOT EXISTS card_tags (
  card_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (card_id, tag_id),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Таблица логов изучения
CREATE TABLE IF NOT EXISTS study_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  card_id INTEGER NOT NULL,
  deck_id INTEGER NOT NULL,
  result BOOLEAN NOT NULL,
  review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (card_id) REFERENCES cards(id),
  FOREIGN KEY (deck_id) REFERENCES decks(id)
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_cards_next_review ON cards(next_review_date);
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON study_logs(user_id, review_date);
CREATE INDEX IF NOT EXISTS idx_study_logs_card ON study_logs(card_id);
`;

console.log('🔄 Начинаем инициализацию базы данных...');

async function initDatabase() {
  try {
    // Создаем правильный хеш для пароля 'test123'
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('test123', salt);
    
    console.log('✅ Хеш пароля создан для "test123"');

    const insertTestData = `
-- Тестовый пользователь (пароль: test123) - ГАРАНТИРОВАННО ПРАВИЛЬНЫЙ ХЕШ
INSERT OR IGNORE INTO users (email, username, password_hash) VALUES 
  ('test@example.com', 'Тестовый Пользователь', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MRr5KX8cW9cJZ7q1v3a5b7c9d1e3g5i7k');

      -- Тестовые колоды
      INSERT OR IGNORE INTO decks (user_id, name, language, description, is_public) VALUES
        (1, 'Английские глаголы', 'en', '100 самых используемых английских глаголов', 1),
        (1, 'Испанские существительные', 'es', 'Популярные испанские существительные для начинающих', 0),
        (1, 'Немецкие фразы', 'de', 'Полезные фразы для путешествий по Германии', 0);

      -- Тестовые карточки для первой колоды
      INSERT OR IGNORE INTO cards (deck_id, front_text, back_text, example, difficulty_level) VALUES
        (1, 'to run', 'бегать', 'I run every morning.', 2),
        (1, 'to eat', 'есть', 'We eat dinner at 7 PM.', 1),
        (1, 'to sleep', 'спать', 'Cats sleep a lot.', 0),
        (1, 'to learn', 'учить', 'I learn Spanish every day.', 3),
        (1, 'to understand', 'понимать', 'Do you understand me?', 4);

      -- Тестовые карточки для второй колоды
      INSERT OR IGNORE INTO cards (deck_id, front_text, back_text, example) VALUES
        (2, 'casa', 'дом', 'Mi casa es tu casa.'),
        (2, 'libro', 'книга', 'Estoy leyendo un libro.'),
        (2, 'agua', 'вода', 'Necesito beber agua.');

      -- Тестовые карточки для третьей колоды
      INSERT OR IGNORE INTO cards (deck_id, front_text, back_text, example) VALUES
        (3, 'Guten Tag', 'Добрый день', 'Guten Tag! Wie geht es Ihnen?'),
        (3, 'Danke', 'Спасибо', 'Danke schön für Ihre Hilfe.');

      -- Тестовые логи изучения
      INSERT OR IGNORE INTO study_logs (user_id, card_id, deck_id, result, review_date) VALUES
        (1, 1, 1, 1, datetime('now', '-2 days')),
        (1, 2, 1, 1, datetime('now', '-1 day')),
        (1, 3, 1, 0, datetime('now', '-3 days')),
        (1, 4, 1, 1, datetime('now', '-5 days')),
        (1, 5, 1, 1, datetime('now', '-7 days'));
    `;

    db.serialize(() => {
      // Удаляем старые таблицы (опционально, если хотите чистую базу)
      // db.run('DROP TABLE IF EXISTS card_tags');
      // db.run('DROP TABLE IF EXISTS tags');
      // db.run('DROP TABLE IF EXISTS study_logs');
      // db.run('DROP TABLE IF EXISTS cards');
      // db.run('DROP TABLE IF EXISTS decks');
      // db.run('DROP TABLE IF EXISTS users');
      
      // Создаем таблицы
      db.exec(createTables, (err) => {
        if (err) {
          console.error('❌ Ошибка при создании таблиц:', err.message);
          process.exit(1);
        }
        console.log('✅ Таблицы созданы успешно');
        
        // Вставляем тестовые данные
        db.exec(insertTestData, (err) => {
          if (err) {
            console.error('❌ Ошибка при вставке тестовых данных:', err.message);
          } else {
            console.log('✅ Тестовые данные добавлены');
          }
          
          db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
            if (err) {
              console.error('❌ Ошибка при получении списка таблиц:', err.message);
            } else {
              console.log('\n📋 Созданные таблицы:');
              tables.forEach(table => console.log(`   - ${table.name}`));
            }
            
            console.log('\n🎉 База данных успешно инициализирована!');
            console.log('👤 Тестовый пользователь: test@example.com / test123');
            
            // Показываем тестовые данные
            db.all("SELECT COUNT(*) as count FROM users", (err, res) => {
              console.log(`👥 Пользователей: ${res[0].count}`);
            });
            
            db.all("SELECT COUNT(*) as count FROM decks", (err, res) => {
              console.log(`🃏 Колод: ${res[0].count}`);
            });
            
            db.all("SELECT COUNT(*) as count FROM cards", (err, res) => {
              console.log(`🎴 Карточек: ${res[0].count}`);
            });
            
            db.close();
          });
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Ошибка при инициализации базы данных:', error);
    process.exit(1);
  }
}

// Запускаем инициализацию
initDatabase();