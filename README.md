# 🎴 LinguaCards

Веб-приложение для изучения иностранных языков методом карточек с адаптивным алгоритмом интервального повторения.

### 🚀 [Открыть живое демо →](https://linguacards-nine.vercel.app)

**Тестовый доступ для входа: 
Email: test@example.com
Пароль: test123**

## О проекте

LinguaCards — pet-проект и дипломная работа, реализующая систему изучения слов на основе модифицированного алгоритма Лейтнера с пятью уровнями сложности. Приложение адаптируется под успеваемость пользователя, показывая проблемные карточки чаще.

## Возможности

- 🔄 Адаптивный алгоритм повторения (5 уровней сложности, метод Лейтнера)
- 🔐 Аутентификация пользователей (JWT)
- 📊 Статистика прогресса и календарь активности (heatmap)
- 🔥 Счётчик серии дней (streak)
- 💡 Многоуровневая система подсказок
- 📚 Готовые колоды слов на нескольких языках
- ⌨️ Управление с клавиатуры
- 🎨 Анимация переворота карточек
- 🔔 Toast-уведомления

## Стек технологий

**Frontend:** React, TypeScript, Vite
**Backend:** Node.js, Express, SQLite
**Тестирование:** Jest

## Архитектура

Нормализованная схема базы данных из четырёх связанных таблиц. REST API на Express с JWT-аутентификацией эндпоинтов.

## Тестирование

Проект покрыт автотестами на Jest — проверяется ключевая бизнес-логика (алгоритм повторения карточек, аутентификация, подсчёт статистики).

```bash
npm test
```

## Запуск локально

**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Приложение будет доступно на `http://localhost:5173`

## Скриншоты

<img width="1920" height="1037" alt="image" src="https://github.com/user-attachments/assets/c7a5ba3d-edfc-4ee0-8b91-7847bfec60e0" />
<img width="1920" height="1038" alt="ima1ge" src="https://github.com/user-attachments/assets/d0b315c4-e425-45ed-bf86-defbbb041c4c" />
<img width="1920" height="1035" alt="imag2e" src="https://github.com/user-attachments/assets/01a553b6-ea7a-4103-9e26-f99477f5cd03" />
<img width="1920" height="1036" alt="image3" src="https://github.com/user-attachments/assets/2c5290a6-ecf8-477d-9904-eb2c31c79417" />
<img width="1920" height="1038" alt="imag4e" src="https://github.com/user-attachments/assets/844cf1f4-8ce3-4998-8cf1-9cc7caf0a81e" />
<img width="1920" height="1039" alt="ima5ge" src="https://github.com/user-attachments/assets/0a706ea8-3590-4d4c-81c9-3792d33bf6c8" />

## QA-документация

Тест-план, тест-кейсы и баг-репорты для этого проекта: [linguacards-test-plan](https://github.com/Skr1leXX/linguacards-test-plan)

## Связанные проекты

- [saucedemo-playwright](https://github.com/Skr1leXX/saucedemo-playwright) — UI-автотесты на Playwright (портфолио автоматизации тестирования)
  
## Автор

Лапин Егор Антонович
