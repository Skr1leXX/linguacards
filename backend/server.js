const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('❌ ОШИБКА: JWT_SECRET не установлен в .env файле!');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);

// ─── Helmet — защита HTTP заголовков ─────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ─── Rate Limiting ────────────────────────────────────────────────────────────

// Общий лимит — 100 запросов за 15 минут с одного IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов. Попробуйте через 15 минут.' },
});

// Строгий лимит для входа — 10 попыток за 15 минут (защита от брутфорса)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток входа. Попробуйте через 15 минут.' },
});

// Лимит на отправку email — 5 раз в час (защита от спама)
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов на отправку email. Попробуйте через час.' },
});

app.use(generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/send-code', emailLimiter);
app.use('/api/auth/forgot-password', emailLimiter);

// ─── Логирование запросов ─────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ─── Swagger ──────────────────────────────────────────────────────────────────
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Spaced Repetition API',
    version: '1.0.0',
    description: 'REST API для веб-приложения изучения иностранных слов с алгоритмом интервального повторения Лейтнера.',
    contact: { name: 'Документация проекта' },
  },
  servers: [{ url: 'http://localhost:5000/api', description: 'Локальный сервер разработки' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Введите JWT токен полученный при входе. Пример: Bearer eyJhbGci...',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          username: { type: 'string', example: 'Иван' },
          created_at: { type: 'string', format: 'date-time' },
          last_login: { type: 'string', format: 'date-time' },
          language_preference: { type: 'string', example: 'ru' },
        },
      },
      Deck: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Английский — базовый' },
          description: { type: 'string', example: 'Базовые слова для начинающих' },
          language: { type: 'string', example: 'en' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Card: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          deck_id: { type: 'integer', example: 1 },
          front_text: { type: 'string', example: 'Hello' },
          back_text: { type: 'string', example: 'Привет' },
          example: { type: 'string', example: 'Hello, how are you?' },
          difficulty_level: { type: 'integer', minimum: 0, maximum: 4, example: 0 },
          review_count: { type: 'integer', example: 5 },
          correct_count: { type: 'integer', example: 4 },
          next_review_date: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: { error: { type: 'string', example: 'Описание ошибки' } },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Аутентификация и регистрация' },
    { name: 'Users', description: 'Управление профилем пользователя' },
    { name: 'Decks', description: 'Управление колодами карточек' },
    { name: 'Cards', description: 'Управление карточками внутри колод' },
    { name: 'Study', description: 'Сессии изучения и интервальное повторение' },
    { name: 'Stats', description: 'Статистика и аналитика прогресса' },
  ],
  paths: {
    '/auth/send-code': {
      post: { tags: ['Auth'], summary: 'Отправить код верификации', description: 'Первый шаг регистрации. Лимит: 5 запросов/час.', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'username', 'password'], properties: { email: { type: 'string', format: 'email', example: 'user@example.com' }, username: { type: 'string', example: 'Иван' }, password: { type: 'string', minLength: 6, example: 'mypassword123' } } } } } }, responses: { 200: { description: 'Код отправлен' }, 400: { description: 'Ошибка валидации' }, 429: { description: 'Слишком много запросов' } } },
    },
    '/auth/register': {
      post: { tags: ['Auth'], summary: 'Завершить регистрацию', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'username', 'password', 'code'], properties: { email: { type: 'string', format: 'email', example: 'user@example.com' }, username: { type: 'string', example: 'Иван' }, password: { type: 'string', example: 'mypassword123' }, code: { type: 'string', example: '123456' } } } } } }, responses: { 201: { description: 'Зарегистрирован', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } }, 400: { description: 'Неверный код' } } },
    },
    '/auth/login': {
      post: { tags: ['Auth'], summary: 'Войти в аккаунт', description: 'Лимит: 10 попыток за 15 минут (защита от брутфорса).', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email', example: 'test@example.com' }, password: { type: 'string', example: 'test123' } } } } } }, responses: { 200: { description: 'Успешный вход', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } }, 401: { description: 'Неверный email или пароль' }, 429: { description: 'Слишком много попыток' } } },
    },
    '/auth/forgot-password': {
      post: { tags: ['Auth'], summary: 'Запросить сброс пароля', description: 'Лимит: 5 запросов/час.', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email', example: 'user@example.com' } } } } } }, responses: { 200: { description: 'Письмо отправлено' }, 429: { description: 'Слишком много запросов' } } },
    },
    '/auth/reset-password': {
      post: { tags: ['Auth'], summary: 'Сбросить пароль по токену', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token', 'newPassword'], properties: { token: { type: 'string', example: 'a3f2c1d4...' }, newPassword: { type: 'string', minLength: 6, example: 'newpassword123' } } } } } }, responses: { 200: { description: 'Пароль изменён' }, 400: { description: 'Токен недействителен' } } },
    },
    '/auth/profile': {
      get: { tags: ['Auth'], summary: 'Профиль текущего пользователя', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Профиль', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }, 401: { description: 'Не авторизован' } } },
    },
    '/users/me': {
      get: { tags: ['Users'], summary: 'Получить данные профиля', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Данные пользователя', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } } } },
    },
    '/users/profile': {
      put: { tags: ['Users'], summary: 'Обновить профиль', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, language_preference: { type: 'string' } } } } } }, responses: { 200: { description: 'Профиль обновлён' } } },
    },
    '/users/change-password': {
      put: { tags: ['Users'], summary: 'Сменить пароль', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 6 } } } } } }, responses: { 200: { description: 'Пароль изменён' }, 401: { description: 'Текущий пароль неверен' } } },
    },
    '/decks': {
      get: { tags: ['Decks'], summary: 'Все колоды пользователя', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Список колод', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Deck' } } } } } } },
      post: { tags: ['Decks'], summary: 'Создать колоду', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', example: 'Английский' }, description: { type: 'string' }, language: { type: 'string', example: 'en' } } } } } }, responses: { 201: { description: 'Колода создана', content: { 'application/json': { schema: { $ref: '#/components/schemas/Deck' } } } } } },
    },
    '/decks/{id}': {
      get: { tags: ['Decks'], summary: 'Колода по ID', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Колода', content: { 'application/json': { schema: { $ref: '#/components/schemas/Deck' } } } }, 404: { description: 'Не найдена' } } },
      put: { tags: ['Decks'], summary: 'Обновить колоду', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, language: { type: 'string' } } } } } }, responses: { 200: { description: 'Обновлена' } } },
      delete: { tags: ['Decks'], summary: 'Удалить колоду', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Удалена' } } },
    },
    '/cards/deck/{deckId}': {
      get: { tags: ['Cards'], summary: 'Карточки колоды', security: [{ bearerAuth: [] }], parameters: [{ name: 'deckId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Список карточек', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Card' } } } } } } },
      post: { tags: ['Cards'], summary: 'Создать карточку', security: [{ bearerAuth: [] }], parameters: [{ name: 'deckId', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['front_text', 'back_text'], properties: { front_text: { type: 'string', example: 'Apple' }, back_text: { type: 'string', example: 'Яблоко' }, example: { type: 'string', example: 'I eat an apple every day.' } } } } } }, responses: { 201: { description: 'Карточка создана', content: { 'application/json': { schema: { $ref: '#/components/schemas/Card' } } } } } },
    },
    '/cards/{id}': {
      get: { tags: ['Cards'], summary: 'Карточка по ID', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Карточка', content: { 'application/json': { schema: { $ref: '#/components/schemas/Card' } } } } } },
      put: { tags: ['Cards'], summary: 'Обновить карточку', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { front_text: { type: 'string' }, back_text: { type: 'string' }, example: { type: 'string' } } } } } }, responses: { 200: { description: 'Обновлена' } } },
      delete: { tags: ['Cards'], summary: 'Удалить карточку', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Удалена' } } },
    },
    '/cards/{id}/review': {
      post: { tags: ['Cards'], summary: 'Отметить результат повторения', description: 'Обновляет уровень по алгоритму Лейтнера и устанавливает следующую дату повторения', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['correct'], properties: { correct: { type: 'boolean', example: true, description: 'true = знал ответ, false = не знал' } } } } } }, responses: { 200: { description: 'Результат сохранён' } } },
    },
    '/study/session': {
      get: { tags: ['Study'], summary: 'Карточки для текущей сессии', description: 'Возвращает карточки готовые к повторению сегодня', security: [{ bearerAuth: [] }], parameters: [{ name: 'deckId', in: 'query', schema: { type: 'integer' }, description: 'Фильтр по колоде' }, { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }], responses: { 200: { description: 'Карточки для изучения', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Card' } } } } } } },
    },
    '/stats/overview': {
      get: { tags: ['Stats'], summary: 'Общая статистика пользователя', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Сводная статистика', content: { 'application/json': { schema: { type: 'object', properties: { total_cards: { type: 'integer', example: 120 }, cards_today: { type: 'integer', example: 15 }, accuracy: { type: 'integer', example: 82 }, streak_days: { type: 'integer', example: 7 }, due_cards: { type: 'integer', example: 23 } } } } } } } },
    },
    '/stats/daily': {
      get: { tags: ['Stats'], summary: 'Статистика по дням', security: [{ bearerAuth: [] }], parameters: [{ name: 'days', in: 'query', schema: { type: 'integer', default: 7 }, description: 'Количество дней' }], responses: { 200: { description: 'Массив по дням' } } },
    },
    '/stats/deck/{deckId}': {
      get: { tags: ['Stats'], summary: 'Статистика колоды', security: [{ bearerAuth: [] }], parameters: [{ name: 'deckId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Статистика колоды' }, 404: { description: 'Не найдена' } } },
    },
  },
};

const swaggerSpec = swaggerJsdoc({ definition: swaggerDefinition, apis: [] });

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Spaced Repetition — API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: { persistAuthorization: true },
}));

// ─── Маршруты ─────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/users', require('./src/routes/user.routes'));
app.use('/api/decks', require('./src/routes/deck.routes'));
app.use('/api/cards', require('./src/routes/card.routes'));
app.use('/api/study', require('./src/routes/study.routes'));
app.use('/api/stats', require('./src/routes/stats.routes'));

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend работает!', timestamp: new Date().toISOString(), docs: 'http://localhost:5000/api/docs' });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// ─── Ошибки ───────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Ошибка сервера:', err.stack);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ─── Production static ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, 'public');
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
  }
}

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`🔒 Helmet и Rate Limiting активны`);
  console.log(`📚 Swagger: http://localhost:${PORT}/api/docs`);
});
