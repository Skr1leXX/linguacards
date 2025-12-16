const db = require('./src/config/database');

console.log('🔍 Проверка структуры базы данных...');

// Проверяем таблицы и их колонки
const tables = ['users', 'decks', 'cards', 'study_logs'];

tables.forEach(table => {
  db.all(`PRAGMA table_info(${table})`, (err, columns) => {
    if (err) {
      console.log(`❌ Таблица ${table}: НЕ СУЩЕСТВУЕТ или ошибка`);
      return;
    }
    
    console.log(`\n📊 Таблица ${table}:`);
    columns.forEach(col => {
      console.log(`  ${col.name} (${col.type})${col.pk ? ' PRIMARY KEY' : ''}`);
    });
  });
});

// Проверяем пользователей
setTimeout(() => {
  console.log('\n👥 Пользователи в базе:');
  db.all('SELECT id, email, username, created_at FROM users', (err, rows) => {
    if (err) {
      console.error('Ошибка:', err);
    } else {
      rows.forEach(user => {
        console.log(`  ${user.id}: ${user.email} - "${user.username}" (${user.created_at})`);
      });
    }
    db.close();
  });
}, 500);