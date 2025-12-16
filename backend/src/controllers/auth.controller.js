const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
console.log('=== ЗАГРУЖЕН auth.controller.js ===');
console.log('bcrypt версия:', require('bcryptjs').version);
console.log('jwt версия:', require('jsonwebtoken').version);
console.log('JWT_SECRET в процессе загрузки:', process.env.JWT_SECRET ? 'установлен' : 'НЕ УСТАНОВЛЕН');


const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Проверяем, существует ли пользователь
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Создаем пользователя
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)',
        [email, username, passwordHash],
        function(err) {
          if (err) reject(err);
          resolve(this);
        }
      );
    });

    // Создаем JWT токен
    const token = jwt.sign(
      { id: result.lastID, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Получаем созданного пользователя
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, email, username, created_at, language_preference FROM users WHERE id = ?',
        [result.lastID],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    // Обновляем время последнего входа
    db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user,
    });
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔍 === НАЧАЛО ВХОДА ===');
    console.log('📧 Email:', email);
    console.log('🔑 Пароль:', password ? 'передан' : 'не передан');
    console.log('JWT_SECRET установлен?:', !!process.env.JWT_SECRET);
    console.log('JWT_SECRET значение:', process.env.JWT_SECRET ? 'да' : 'нет');

    // Находим пользователя
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, email, username, password_hash, created_at, language_preference FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) {
            console.error('❌ Ошибка поиска пользователя:', err);
            reject(err);
          } else {
            console.log('👤 Пользователь найден?:', row ? 'ДА' : 'НЕТ');
            if (row) {
              console.log('   ID:', row.id);
              console.log('   Email:', row.email);
              console.log('   Хеш пароля (первые 20 симв.):', row.password_hash ? row.password_hash.substring(0, 20) + '...' : 'отсутствует');
              console.log('   Длина хеша:', row.password_hash ? row.password_hash.length : 0);
            }
            resolve(row);
          }
        }
      );
    });

    if (!user) {
      console.log('❌ ОШИБКА: Пользователь не найден в базе данных');
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Проверяем пароль
    console.log('🔐 Проверка пароля...');
    console.log('   Введенный пароль:', password);
    console.log('   Хеш из базы:', user.password_hash.substring(0, 30) + '...');
    
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('   Результат проверки:', isPasswordValid ? '✅ ПРАВИЛЬНЫЙ' : '❌ НЕПРАВИЛЬНЫЙ');
    
    if (!isPasswordValid) {
      console.log('❌ ОШИБКА: Пароль не совпадает');
      
      // Попробуем угадать пароль для отладки
      const commonPasswords = ['test123', 'password123', 'admin123', '123456', 'qwerty', 'password'];
      console.log('🔍 Проверка стандартных паролей:');
      for (const commonPass of commonPasswords) {
        const isValid = await bcrypt.compare(commonPass, user.password_hash);
        if (isValid) {
          console.log(`   ✅ Найден правильный пароль: "${commonPass}"`);
          break;
        }
      }
      
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Создаем JWT токен
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this';
    console.log('🎫 Создание JWT токена...');
    console.log('   Секрет:', jwtSecret.substring(0, 10) + '...');
    
    const token = jwt.sign(
      { id: user.id, email: user.email },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    if (!token) {
      console.error('❌ Токен не был создан!');
      return res.status(500).json({ error: 'Ошибка создания токена' });
    }
    
    console.log('✅ Токен создан успешно');
    console.log('   Длина токена:', token.length);
    console.log('   Первые 30 символов:', token.substring(0, 30) + '...');

    // Обновляем время последнего входа
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id],
        function(err) {
          if (err) {
            console.error('❌ Ошибка обновления last_login:', err);
            reject(err);
          } else {
            console.log('🕐 Время последнего входа обновлено');
            resolve();
          }
        }
      );
    });

    // Убираем хеш пароля из ответа
    delete user.password_hash;

    console.log('🎉 === ВХОД УСПЕШЕН ===');
    console.log('   Пользователь:', user.email);
    console.log('   Токен создан:', !!token);
    console.log('   Ответ сервера подготовлен');
    
    res.json({
      message: 'Вход выполнен успешно',
      token,
      user,
    });
  } catch (error) {
    console.error('🔥 === КРИТИЧЕСКАЯ ОШИБКА ===');
    console.error('Тип ошибки:', error.name);
    console.error('Сообщение:', error.message);
    console.error('Стек:', error.stack);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, email, username, created_at, last_login, language_preference FROM users WHERE id = ?',
        [req.userId],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
};