// ─── Мокаем зависимости ──────────────────────────────────────────────────────
const mockDb = {
  get: jest.fn(),
  run: jest.fn(),
  all: jest.fn(),
};
jest.mock('../src/config/database', () => mockDb);
jest.mock('../src/services/spaced-repetition.service', () => ({
  isCardDue: jest.fn().mockReturnValue(true),
  calculateProgress: jest.fn().mockReturnValue(40),
  calculateNextReview: jest.fn().mockReturnValue({
    newLevel: 1,
    nextReviewDate: '2026-06-01T00:00:00.000Z',
  }),
}));

const cardController = require('../src/controllers/card.controller');

// ─── Хелпер ──────────────────────────────────────────────────────────────────
const mockReqRes = (body = {}, params = {}, userId = 1) => {
  const req = { body, params, userId };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return { req, res };
};

beforeEach(() => jest.clearAllMocks());

// ════════════════════════════════════════════════════════════════════════════════
describe('Card Controller', () => {

  // ── getCardsByDeck ─────────────────────────────────────────────────────────
  describe('getCardsByDeck', () => {
    test('возвращает список карточек колоды', async () => {
      const { req, res } = mockReqRes({}, { deckId: '1' }, 1);

      const fakeDeck = { id: 1 };
      const fakeCards = [
        { id: 1, deck_id: 1, front_text: 'Hello', back_text: 'Привет', difficulty_level: 0 },
        { id: 2, deck_id: 1, front_text: 'Bye', back_text: 'Пока', difficulty_level: 1 },
      ];

      mockDb.get.mockImplementation((sql, params, cb) => cb(null, fakeDeck));
      mockDb.all.mockImplementation((sql, params, cb) => cb(null, fakeCards));

      await cardController.getCardsByDeck(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ front_text: 'Hello', is_due: true }),
          expect.objectContaining({ front_text: 'Bye', is_due: true }),
        ])
      );
    });

    test('возвращает 404 если колода не найдена', async () => {
      const { req, res } = mockReqRes({}, { deckId: '999' }, 1);

      mockDb.get.mockImplementation((sql, params, cb) => cb(null, null));

      await cardController.getCardsByDeck(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Колода не найдена' });
    });
  });

  // ── createCard ─────────────────────────────────────────────────────────────
  describe('createCard', () => {
    test('успешно создаёт карточку', async () => {
      const { req, res } = mockReqRes(
        { front_text: 'Apple', back_text: 'Яблоко', example: 'I like apples' },
        { deckId: '1' },
        1
      );

      const fakeDeck = { id: 1 };
      const fakeCard = {
        id: 10,
        deck_id: 1,
        front_text: 'Apple',
        back_text: 'Яблоко',
        example: 'I like apples',
        difficulty_level: 0,
      };

      mockDb.get
        .mockImplementationOnce((sql, params, cb) => cb(null, fakeDeck))
        .mockImplementationOnce((sql, params, cb) => cb(null, fakeCard));

      mockDb.run.mockImplementation((sql, params, cb) => {
        if (typeof cb === 'function') cb.call({ lastID: 10 }, null);
      });

      await cardController.createCard(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Карточка успешно создана',
          card: expect.objectContaining({ front_text: 'Apple' }),
        })
      );
    });

    test('возвращает 400 если не переданы front_text или back_text', async () => {
      const { req, res } = mockReqRes({ front_text: 'Apple' }, { deckId: '1' }, 1);

      await cardController.createCard(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Передний и обратный текст обязательны',
      });
    });

    test('возвращает 404 если колода не принадлежит пользователю', async () => {
      const { req, res } = mockReqRes(
        { front_text: 'Apple', back_text: 'Яблоко' },
        { deckId: '1' },
        1
      );

      mockDb.get.mockImplementationOnce((sql, params, cb) => cb(null, null));

      await cardController.createCard(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Колода не найдена' });
    });
  });

  // ── updateCard ─────────────────────────────────────────────────────────────
  describe('updateCard', () => {
    test('успешно обновляет карточку', async () => {
      const { req, res } = mockReqRes(
        { front_text: 'New front', back_text: 'New back' },
        { id: '1' },
        1
      );

      const fakeCard = { id: 1, front_text: 'New front', back_text: 'New back', difficulty_level: 0 };

      mockDb.get
        .mockImplementationOnce((sql, params, cb) => cb(null, { id: 1 }))
        .mockImplementationOnce((sql, params, cb) => cb(null, fakeCard));

      mockDb.run.mockImplementation((sql, params, cb) => cb && cb(null));

      await cardController.updateCard(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          card: expect.objectContaining({ front_text: 'New front' }),
        })
      );
    });

    test('возвращает 400 если нет данных для обновления', async () => {
      const { req, res } = mockReqRes({}, { id: '1' }, 1);

      mockDb.get.mockImplementationOnce((sql, params, cb) => cb(null, { id: 1 }));

      await cardController.updateCard(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Нет данных для обновления' });
    });

    test('возвращает 404 если карточка не найдена', async () => {
      const { req, res } = mockReqRes({ front_text: 'Test' }, { id: '999' }, 1);

      mockDb.get.mockImplementationOnce((sql, params, cb) => cb(null, null));

      await cardController.updateCard(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Карточка не найдена' });
    });
  });

  // ── deleteCard ─────────────────────────────────────────────────────────────
  describe('deleteCard', () => {
    test('успешно удаляет карточку', async () => {
      const { req, res } = mockReqRes({}, { id: '1' }, 1);

      mockDb.get.mockImplementationOnce((sql, params, cb) => cb(null, { id: 1 }));
      mockDb.run.mockImplementation((sql, params, cb) => cb && cb(null));

      await cardController.deleteCard(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Карточка успешно удалена' });
    });

    test('возвращает 404 если карточка не найдена', async () => {
      const { req, res } = mockReqRes({}, { id: '999' }, 1);

      // deleteCard использует db.run с DELETE и проверяет this.changes
      mockDb.run.mockImplementation((sql, params, cb) => {
        cb.call({ changes: 0 }, null); // changes=0 значит ничего не удалено
      });

      await cardController.deleteCard(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Карточка не найдена' });
    });
  });

});