const spacedRepetition = require('../src/services/spaced-repetition.service');

// ════════════════════════════════════════════════════════════════════════════════
describe('SpacedRepetitionService', () => {

  // ── calculateNextReview ────────────────────────────────────────────────────
  describe('calculateNextReview', () => {
    test('повышает уровень при правильном ответе', () => {
      const result = spacedRepetition.calculateNextReview(0, true);
      expect(result.newLevel).toBe(1);
    });

    test('сбрасывает на уровень 0 при неправильном ответе', () => {
      const result = spacedRepetition.calculateNextReview(3, false);
      expect(result.newLevel).toBe(0);
    });

    test('не превышает максимальный уровень (4)', () => {
      const result = spacedRepetition.calculateNextReview(4, true);
      expect(result.newLevel).toBe(4);
    });

    test('возвращает корректную nextReviewDate', () => {
      const result = spacedRepetition.calculateNextReview(0, true);
      const reviewDate = new Date(result.nextReviewDate);
      expect(reviewDate).toBeInstanceOf(Date);
      expect(reviewDate > new Date()).toBe(true);
    });

    test('уровень 1 (правильно) → переходит на уровень 2, интервал 7 дней', () => {
      const before = new Date();
      const result = spacedRepetition.calculateNextReview(1, true);
      const reviewDate = new Date(result.nextReviewDate);
      const diffDays = Math.round((reviewDate - before) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);
    });

    test('при ошибке с любого уровня → интервал 1 день', () => {
      const before = new Date();
      const result = spacedRepetition.calculateNextReview(4, false);
      const reviewDate = new Date(result.nextReviewDate);
      const diffDays = Math.round((reviewDate - before) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(1);
    });
  });

  // ── isCardDue ──────────────────────────────────────────────────────────────
  describe('isCardDue', () => {
    test('карточка без даты повторения считается готовой', () => {
      expect(spacedRepetition.isCardDue({ next_review_date: null })).toBe(true);
      expect(spacedRepetition.isCardDue({ next_review_date: undefined })).toBe(true);
    });

    test('карточка с прошедшей датой считается готовой', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(spacedRepetition.isCardDue({ next_review_date: pastDate })).toBe(true);
    });

    test('карточка с будущей датой НЕ готова к повторению', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      expect(spacedRepetition.isCardDue({ next_review_date: futureDate })).toBe(false);
    });
  });

  // ── calculateProgress ──────────────────────────────────────────────────────
  describe('calculateProgress', () => {
    test('уровень 0 → прогресс 0%', () => {
      expect(spacedRepetition.calculateProgress({ difficulty_level: 0 })).toBe(0);
    });

    test('уровень 4 (максимум) → прогресс 100%', () => {
      expect(spacedRepetition.calculateProgress({ difficulty_level: 4 })).toBe(100);
    });

    test('уровень 2 → прогресс 50%', () => {
      expect(spacedRepetition.calculateProgress({ difficulty_level: 2 })).toBe(50);
    });

    test('прогресс не превышает 100%', () => {
      expect(spacedRepetition.calculateProgress({ difficulty_level: 99 })).toBeLessThanOrEqual(100);
    });
  });

  // ── getCardsForReview ──────────────────────────────────────────────────────
  describe('getCardsForReview', () => {
    test('возвращает только карточки готовые к повторению', () => {
      const past = new Date(Date.now() - 1000).toISOString();
      const future = new Date(Date.now() + 86400000).toISOString();

      const cards = [
        { id: 1, next_review_date: past },
        { id: 2, next_review_date: future },
        { id: 3, next_review_date: null },
      ];

      const due = spacedRepetition.getCardsForReview(cards);

      expect(due).toHaveLength(2);
      expect(due.map(c => c.id)).toEqual([1, 3]);
    });

    test('возвращает пустой массив если нет готовых карточек', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const cards = [
        { id: 1, next_review_date: future },
        { id: 2, next_review_date: future },
      ];
      expect(spacedRepetition.getCardsForReview(cards)).toHaveLength(0);
    });

    test('возвращает все карточки если все готовы', () => {
      const cards = [
        { id: 1, next_review_date: null },
        { id: 2, next_review_date: null },
        { id: 3, next_review_date: null },
      ];
      expect(spacedRepetition.getCardsForReview(cards)).toHaveLength(3);
    });
  });

});