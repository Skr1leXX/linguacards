const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ─── Мокаем зависимости ДО импорта контроллера ───────────────────────────────
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}));

// Мок базы данных — путь от rootDir (папка backend/)
const mockDb = {
  get: jest.fn(),
  run: jest.fn(),
  all: jest.fn(),
};
jest.mock('../src/config/database', () => mockDb);

// Устанавливаем переменные окружения
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '24h';
process.env.EMAIL_FROM = 'test@test.com';

const authController = require('../src/controllers/auth.controller');

// ─── Хелпер для создания mock req/res ────────────────────────────────────────
const mockReqRes = (body = {}, params = {}, userId = null) => {
  const req = { body, params, userId };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return { req, res };
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════════
describe('Auth Controller', () => {

  // ── login ──────────────────────────────────────────────────────────────────
  describe('login', () => {
    test('успешный вход с правильными данными', async () => {
      const { req, res } = mockReqRes({ email: 'test@example.com', password: 'password123' });

      const fakeUser = {
        id: 1,
        email: 'test@example.com',
        username: 'Тест',
        password_hash: '$2a$10$hashedpassword',
        created_at: '2026-01-01',
        language_preference: 'ru',
      };

      mockDb.get.mockImplementation((sql, params, cb) => cb(null, fakeUser));
      mockDb.run.mockImplementation((sql, params, cb) => cb && cb(null));
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('fake-jwt-token');

      await authController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Вход выполнен успешно',
          token: 'fake-jwt-token',
        })
      );
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.user).not.toHaveProperty('password_hash');
    });

    test('возвращает 401 если пользователь не найден', async () => {
      const { req, res } = mockReqRes({ email: 'noone@example.com', password: '123456' });

      mockDb.get.mockImplementation((sql, params, cb) => cb(null, null));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Неверный email или пароль' });
    });

    test('возвращает 401 при неверном пароле', async () => {
      const { req, res } = mockReqRes({ email: 'test@example.com', password: 'wrongpassword' });

      const fakeUser = { id: 1, email: 'test@example.com', password_hash: '$2a$10$hash' };
      mockDb.get.mockImplementation((sql, params, cb) => cb(null, fakeUser));
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Неверный email или пароль' });
    });

    test('возвращает 500 при ошибке базы данных', async () => {
      const { req, res } = mockReqRes({ email: 'test@example.com', password: '123456' });

      mockDb.get.mockImplementation((sql, params, cb) => cb(new Error('DB Error'), null));

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Ошибка сервера' });
    });
  });

  // ── register ───────────────────────────────────────────────────────────────
  describe('register', () => {
    test('успешная регистрация с правильным кодом', async () => {
      const { req, res } = mockReqRes({
        email: 'new@example.com',
        username: 'Новый',
        password: 'newpassword',
        code: '123456',
      });

      const fakeCode = {
        id: 1,
        email: 'new@example.com',
        code: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };

      const fakeUser = {
        id: 2,
        email: 'new@example.com',
        username: 'Новый',
        created_at: '2026-01-01',
        language_preference: 'ru',
      };

      mockDb.get
        .mockImplementationOnce((sql, params, cb) => cb(null, fakeCode))
        .mockImplementationOnce((sql, params, cb) => cb(null, null))
        .mockImplementationOnce((sql, params, cb) => cb(null, fakeUser));

      mockDb.run.mockImplementation((sql, params, cb) => {
        if (typeof cb === 'function') cb.call({ lastID: 2 }, null);
      });

      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('$2a$10$hashed');
      jwt.sign.mockReturnValue('reg-token');

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Пользователь успешно зарегистрирован',
          token: 'reg-token',
        })
      );
    });

    test('возвращает 400 при неверном коде', async () => {
      const { req, res } = mockReqRes({
        email: 'new@example.com',
        username: 'Новый',
        password: 'pass',
        code: '000000',
      });

      mockDb.get.mockImplementationOnce((sql, params, cb) => cb(null, null));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Неверный код подтверждения' });
    });

    test('возвращает 400 если код истёк', async () => {
      const { req, res } = mockReqRes({
        email: 'new@example.com',
        username: 'Новый',
        password: 'pass',
        code: '123456',
      });

      const expiredCode = {
        id: 1,
        email: 'new@example.com',
        code: '123456',
        expires_at: new Date(Date.now() - 60 * 1000).toISOString(),
      };

      mockDb.get.mockImplementationOnce((sql, params, cb) => cb(null, expiredCode));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Код истёк. Запросите новый.' });
    });

    test('возвращает 400 если email уже занят', async () => {
      const { req, res } = mockReqRes({
        email: 'exists@example.com',
        username: 'Кто-то',
        password: 'pass',
        code: '123456',
      });

      const validCode = {
        id: 1,
        code: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };

      mockDb.get
        .mockImplementationOnce((sql, params, cb) => cb(null, validCode))
        .mockImplementationOnce((sql, params, cb) => cb(null, { id: 5 }));

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Пользователь уже существует' });
    });
  });

  // ── sendCode ───────────────────────────────────────────────────────────────
  describe('sendCode', () => {
    test('отправляет код если email свободен', async () => {
      const { req, res } = mockReqRes({
        email: 'free@example.com',
        username: 'Юзер',
        password: 'password',
      });

      mockDb.get.mockImplementationOnce((sql, params, cb) => cb(null, null));
      mockDb.run.mockImplementation((sql, params, cb) => cb && cb(null));

      await authController.sendCode(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Код отправлен на email' });
    });

    test('возвращает 400 если email уже занят', async () => {
      const { req, res } = mockReqRes({
        email: 'taken@example.com',
        username: 'Юзер',
        password: 'password',
      });

      mockDb.get.mockImplementationOnce((sql, params, cb) => cb(null, { id: 1 }));

      await authController.sendCode(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Пользователь с таким email уже существует',
      });
    });

    test('возвращает 400 если не переданы все поля', async () => {
      const { req, res } = mockReqRes({ email: 'test@example.com' });

      await authController.sendCode(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Заполните все поля' });
    });
  });

  // ── getProfile ─────────────────────────────────────────────────────────────
  describe('getProfile', () => {
    test('возвращает профиль авторизованного пользователя', async () => {
      const { req, res } = mockReqRes({}, {}, 1);
      req.userId = 1;

      const fakeUser = {
        id: 1,
        email: 'test@example.com',
        username: 'Тест',
        created_at: '2026-01-01',
        last_login: '2026-05-01',
        language_preference: 'ru',
      };

      mockDb.get.mockImplementation((sql, params, cb) => cb(null, fakeUser));

      await authController.getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeUser);
    });

    test('возвращает 404 если пользователь не найден', async () => {
      const { req, res } = mockReqRes({}, {}, 999);
      req.userId = 999;

      mockDb.get.mockImplementation((sql, params, cb) => cb(null, null));

      await authController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Пользователь не найден' });
    });
  });

  // ── forgotPassword ─────────────────────────────────────────────────────────
  describe('forgotPassword', () => {
    test('возвращает одинаковый ответ если email не найден', async () => {
      const { req, res } = mockReqRes({ email: 'ghost@example.com' });

      mockDb.get.mockImplementationOnce((sql, params, cb) => cb(null, null));

      await authController.forgotPassword(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Если такой email зарегистрирован, вы получите письмо',
      });
    });

    test('отправляет письмо если пользователь существует', async () => {
      const { req, res } = mockReqRes({ email: 'real@example.com' });

      const fakeUser = { id: 1, email: 'real@example.com', username: 'Реал' };
      mockDb.get.mockImplementationOnce((sql, params, cb) => cb(null, fakeUser));
      mockDb.run.mockImplementation((sql, params, cb) => cb && cb(null));

      await authController.forgotPassword(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Если такой email зарегистрирован, вы получите письмо',
      });
    });

    test('возвращает 400 если email не передан', async () => {
      const { req, res } = mockReqRes({});

      await authController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Введите email' });
    });
  });

  // ── resetPassword ──────────────────────────────────────────────────────────
  describe('resetPassword', () => {
    test('успешно меняет пароль по валидному токену', async () => {
      const { req, res } = mockReqRes({ token: 'validtoken123', newPassword: 'newpass123' });

      const fakeRecord = {
        email: 'user@example.com',
        token: 'validtoken123',
        used: 0,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };

      mockDb.get.mockImplementationOnce((sql, params, cb) => cb(null, fakeRecord));
      mockDb.run.mockImplementation((sql, params, cb) => cb && cb(null));
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('$2a$10$newhash');

      await authController.resetPassword(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Пароль успешно изменён' });
    });

    test('возвращает 400 если токен не найден', async () => {
      const { req, res } = mockReqRes({ token: 'badtoken', newPassword: 'newpass123' });

      mockDb.get.mockImplementationOnce((sql, params, cb) => cb(null, null));

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Ссылка недействительна или уже использована',
      });
    });

    test('возвращает 400 если токен истёк', async () => {
      const { req, res } = mockReqRes({ token: 'expiredtoken', newPassword: 'newpass123' });

      const expiredRecord = {
        email: 'user@example.com',
        token: 'expiredtoken',
        used: 0,
        expires_at: new Date(Date.now() - 60 * 1000).toISOString(),
      };

      mockDb.get.mockImplementationOnce((sql, params, cb) => cb(null, expiredRecord));

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Ссылка истекла. Запросите новую.' });
    });

    test('возвращает 400 если пароль слишком короткий', async () => {
      const { req, res } = mockReqRes({ token: 'tok', newPassword: '123' });

      await authController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Пароль должен быть не менее 6 символов',
      });
    });
  });

});