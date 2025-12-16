const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database/spaced_repetition.db');

// Создаем соединение с базой данных
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Ошибка подключения к базе данных:', err.message);
  } else {
    console.log('✅ Подключение к SQLite базе данных установлено');
    // Включаем поддержку foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
});

module.exports = db;