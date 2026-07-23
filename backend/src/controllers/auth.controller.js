const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../config/database');

// ─── Email transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

const sendVerificationEmail = async (email, code) => {
  await transporter.sendMail({
    from: `"Spaced Repetition" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Код подтверждения регистрации',
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto">
        <h2>Подтверждение email</h2>
        <p>Ваш код подтверждения:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;
                    background:#f3f4f6;padding:16px 24px;border-radius:8px;
                    text-align:center">${code}</div>
        <p style="color:#6b7280;font-size:13px">Код действителен 10 минут.</p>
      </div>
    `,
  });
};

// ─── 1. Отправить код верификации (первый шаг регистрации) ────────────────────
const sendCode = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Заполните все поля' });
    }

    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM verification_codes WHERE email = ?', [email], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)',
        [email, code, expiresAt],
        (err) => { if (err) reject(err); else resolve(); }
      );
    });

    await sendVerificationEmail(email, code);

    res.json({ message: 'Код отправлен на email' });
  } catch (error) {
    console.error('Ошибка sendCode:', error);
    res.status(500).json({ error: 'Не удалось отправить код. Проверьте настройки email.' });
  }
};

// ─── 2. Верифицировать код и создать аккаунт ──────────────────────────────────
const register = async (req, res) => {
  try {
    const { email, username, password, code } = req.body;

    const record = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM verification_codes WHERE email = ? AND code = ?',
        [email, code],
        (err, row) => { if (err) reject(err); else resolve(row); }
      );
    });

    if (!record) {
      return res.status(400).json({ error: 'Неверный код подтверждения' });
    }
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Код истёк. Запросите новый.' });
    }

    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });
    if (existing) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (email, username, password_hash, is_verified) VALUES (?, ?, ?, 1)',
        [email, username, passwordHash],
        function(err) { if (err) reject(err); else resolve(this); }
      );
    });

    db.run('DELETE FROM verification_codes WHERE email = ?', [email]);

    const token = jwt.sign(
      { id: result.lastID, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, email, username, created_at, language_preference FROM users WHERE id = ?',
        [result.lastID],
        (err, row) => { if (err) reject(err); else resolve(row); }
      );
    });

    db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    res.status(201).json({ message: 'Пользователь успешно зарегистрирован', token, user });
  } catch (error) {
    console.error('Ошибка register:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ─── 3. Вход ──────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, email, username, password_hash, created_at, language_preference FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) reject(err); else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id],
        (err) => { if (err) reject(err); else resolve(); }
      );
    });

    delete user.password_hash;

    res.json({ message: 'Вход выполнен успешно', token, user });
  } catch (error) {
    console.error('Ошибка login:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ─── 4. Получить профиль ──────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, email, username, created_at, last_login, language_preference FROM users WHERE id = ?',
        [req.userId],
        (err, row) => {
          if (err) reject(err); else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка getProfile:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ─── 5. Запросить сброс пароля ────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Введите email' });
    }

    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, email, username FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });

    // Всегда отвечаем одинаково — чтобы не раскрывать какие email зарегистрированы
    if (!user) {
      return res.json({ message: 'Если такой email зарегистрирован, вы получите письмо' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 час

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM password_resets WHERE email = ?', [email], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
        [email, token, expiresAt],
        (err) => { if (err) reject(err); else resolve(); }
      );
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Spaced Repetition" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Сброс пароля',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2>Сброс пароля</h2>
          <p>Привет, ${user.username}!</p>
          <p>Мы получили запрос на сброс пароля для вашего аккаунта.</p>
          <p style="margin:24px 0">
            <a href="${resetUrl}"
               style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;
                      text-decoration:none;font-weight:600;display:inline-block">
              Сбросить пароль
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px">
            Ссылка действительна 1 час. Если вы не запрашивали сброс — просто проигнорируйте это письмо.
          </p>
          <p style="color:#9ca3af;font-size:12px;word-break:break-all">
            Или скопируйте ссылку: ${resetUrl}
          </p>
        </div>
      `,
    });

    res.json({ message: 'Если такой email зарегистрирован, вы получите письмо' });
  } catch (error) {
    console.error('Ошибка forgotPassword:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ─── 6. Сбросить пароль по токену ────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Токен и новый пароль обязательны' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    const record = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM password_resets WHERE token = ? AND used = 0',
        [token],
        (err, row) => { if (err) reject(err); else resolve(row); }
      );
    });

    if (!record) {
      return res.status(400).json({ error: 'Ссылка недействительна или уже использована' });
    }
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Ссылка истекла. Запросите новую.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [passwordHash, record.email],
        (err) => { if (err) reject(err); else resolve(); }
      );
    });

    db.run('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);

    res.json({ message: 'Пароль успешно изменён' });
  } catch (error) {
    console.error('Ошибка resetPassword:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = {
  sendCode,
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
};
