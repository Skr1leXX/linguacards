class SpacedRepetitionService {
  constructor() {
    // Уровни Лейтнера (в днях)
    this.levels = [
      1,    // Уровень 1: повторение через 1 день
      3,    // Уровень 2: повторение через 3 дня
      7,    // Уровень 3: повторение через 7 дней
      14,   // Уровень 4: повторение через 14 дней
      30    // Уровень 5: повторение через 30 дней
    ];
  }

  // Расчет следующей даты повторения на основе алгоритма Лейтнера
  calculateNextReview(currentLevel, isCorrect) {
    let newLevel = currentLevel;
    
    if (isCorrect) {
      // Правильный ответ - повышаем уровень
      newLevel = Math.min(currentLevel + 1, this.levels.length - 1);
    } else {
      // Неправильный ответ - сбрасываем на уровень 1
      newLevel = 0;
    }
    
    // Рассчитываем следующую дату повторения
    const daysToAdd = this.levels[newLevel];
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);
    
    return {
      newLevel,
      nextReviewDate: nextReviewDate.toISOString()
    };
  }

  // Проверка, готова ли карточка к повторению
  isCardDue(card) {
    if (!card.next_review_date) return true;
    
    const now = new Date();
    const reviewDate = new Date(card.next_review_date);
    
    return now >= reviewDate;
  }

  // Получение карточек для изучения на сегодня
  getCardsForReview(cards) {
    return cards.filter(card => this.isCardDue(card));
  }

  // Рассчет прогресса карточки
  calculateProgress(card) {
    const maxLevel = this.levels.length - 1;
    return Math.min(Math.floor((card.difficulty_level / maxLevel) * 100), 100);
  }
}

module.exports = new SpacedRepetitionService();