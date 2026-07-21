const bcrypt = require('bcryptjs');
const db = require('../src/config/database');

const createTables = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  language_preference VARCHAR(50) DEFAULT 'ru'
);

CREATE TABLE IF NOT EXISTS decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  language VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
  FOREIGN KEY (deck_id) REFERENCES cards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  card_id INTEGER NOT NULL,
  deck_id INTEGER,
  result BOOLEAN NOT NULL,
  review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used INTEGER DEFAULT 0
);
`;

const createTestUser = async () => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('test123', salt);

  db.run(`
    INSERT OR IGNORE INTO users (email, username, password_hash, is_verified)
    VALUES ('test@example.com', 'Тест', ?, 1)
  `, [hash], (err) => {
    if (err) console.error('Ошибка создания тест. пользователя:', err.message);
    else console.log('✅ Тестовый пользователь: test@example.com / test123');
  });
};

// Выполняем SQL по одному выражению
const statements = createTables
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

let done = 0;
statements.forEach(sql => {
  db.run(sql, (err) => {
    if (err) console.error('SQL ошибка:', err.message, '\nSQL:', sql.slice(0, 60));
    done++;
    if (done === statements.length) {
      console.log('✅ Все таблицы созданы');
      createTestUser();
    }
  });
});