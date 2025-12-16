const express = require('express');
const cors = require('cors');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('❌ ОШИБКА: JWT_SECRET не установлен в .env файле!');
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));
app.use(express.json());

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Маршруты
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/users', require('./src/routes/user.routes'));
app.use('/api/decks', require('./src/routes/deck.routes'));
app.use('/api/cards', require('./src/routes/card.routes'));
app.use('/api/study', require('./src/routes/study.routes'));

// УДАЛИ ЭТУ СТРОКУ:
// const statsRoutes = require('./src/routes/stats.routes');
// app.use('/api/stats', statsRoutes);

// Документация API
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Spaced Repetition API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile'
      },
      users: {
        profile: 'GET /api/users/me',
        update: 'PUT /api/users/profile',
        change_password: 'PUT /api/users/change-password'
      },
      decks: {
        list: 'GET /api/decks',
        create: 'POST /api/decks',
        detail: 'GET /api/decks/:id',
        update: 'PUT /api/decks/:id',
        delete: 'DELETE /api/decks/:id'
      },
      cards: {
        list: 'GET /api/cards/deck/:deckId',
        create: 'POST /api/cards/deck/:deckId',
        detail: 'GET /api/cards/:id',
        update: 'PUT /api/cards/:id',
        delete: 'DELETE /api/cards/:id',
        review: 'POST /api/cards/:id/review'
      },
      study: {
        session: 'GET /api/study/session',
        stats: 'GET /api/study/stats',
        import: 'POST /api/study/import/:deckId',
        export: 'GET /api/study/export/:deckId'
      }
      // УДАЛИ БЛОК stats ОТСЮДА
    }
  });
});

// Тестовый маршрут
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend работает!',
    timestamp: new Date().toISOString(),
    status: 'operational'
  });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('❌ Ошибка сервера:', err.stack);
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`📁 API доступно по адресу: http://localhost:${PORT}`);
  console.log(`📚 Документация API: http://localhost:${PORT}/api`);
  console.log('\n🔐 Тестовые данные:');
  console.log('   Email: test@example.com');
  console.log('   Пароль: test123');
  console.log('\n🔄 Запустите инициализацию базы данных: npm run init-db');
});