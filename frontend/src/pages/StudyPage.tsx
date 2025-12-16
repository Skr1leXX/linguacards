import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, RotateCcw, Volume2, ChevronRight, Brain, Target } from 'lucide-react';
import { useStudy } from '../hooks/useStudy';
import type { Card } from '../types';

const StudyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  const deckId = searchParams.get('deckId');
  const {
    sessionCards,
    currentCardIndex,
    loading,
    error,
    fetchSessionCards,
    reviewCard,
    getCurrentCard,
    hasNextCard,
    resetSession,
  } = useStudy();

  useEffect(() => {
    if (!sessionStarted) {
      const loadSession = async () => {
        try {
          await fetchSessionCards(deckId ? parseInt(deckId) : undefined, 10);
          setSessionStarted(true);
        } catch (err) {
          console.error('Ошибка при загрузке сессии:', err);
        }
      };
      loadSession();
    }
  }, [deckId, sessionStarted, fetchSessionCards]);

  const currentCard = getCurrentCard();

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = async (correct: boolean) => {
    if (!currentCard) return;
    
    try {
      await reviewCard(currentCard.id, correct);
      setIsFlipped(false);
      
      if (!hasNextCard()) {
        setSessionComplete(true);
      }
    } catch (err) {
      console.error('Ошибка при сохранении ответа:', err);
    }
  };

  const restartSession = async () => {
    resetSession();
    setSessionComplete(false);
    setSessionStarted(false);
    setIsFlipped(false);
  };

  const startNewSession = () => {
    navigate('/study');
    restartSession();
  };

  if (loading && !sessionStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка карточек для изучения...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionStarted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <button
          onClick={restartSession}
          className="btn-primary"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (sessionComplete || (sessionStarted && sessionCards.length === 0)) {
    const studiedCount = sessionCards.length;
    const correctCount = sessionCards.filter(card => card.review_count > 0).length;
    const accuracy = studiedCount > 0 ? Math.round((correctCount / studiedCount) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {sessionCards.length === 0 ? 'Нет карточек для повторения' : 'Сессия завершена!'}
          </h1>
          
          {sessionCards.length > 0 ? (
            <>
              <p className="text-gray-600 mb-8">
                Вы успешно повторили {studiedCount} карточек. Следующая сессия будет доступна согласно алгоритму интервального повторения.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-green-600">{studiedCount}</div>
                  <div className="text-sm text-gray-600">Изучено сегодня</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-primary-600">{accuracy}%</div>
                  <div className="text-sm text-gray-600">Точность</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-yellow-600">
                    {sessionCards.filter(card => card.is_due).length}
                  </div>
                  <div className="text-sm text-gray-600">Осталось к повторению</div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-600 mb-8">
              На сегодня у вас нет карточек для повторения. Возвращайтесь завтра или добавьте новые карточки.
            </p>
          )}
          
          <div className="space-x-4">
            <button onClick={restartSession} className="btn-secondary">
              <RotateCcw className="h-4 w-4 mr-2 inline" />
              Повторить сессию
            </button>
            <button onClick={() => navigate('/decks')} className="btn-primary">
              К моим колодам
              <ChevronRight className="h-4 w-4 ml-2 inline" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Brain className="h-16 w-16 text-gray-300 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Нет карточек для изучения</h1>
        <p className="text-gray-600 mb-8">
          Все карточки изучены на сегодня. Возвращайтесь завтра для следующей сессии интервального повторения.
        </p>
        <button onClick={startNewSession} className="btn-primary">
          Начать новую сессию
        </button>
      </div>
    );
  }

  const progress = sessionCards.length > 0 
    ? ((currentCardIndex + 1) / sessionCards.length) * 100 
    : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Сессия изучения</h1>
        <p className="text-gray-600 mt-2">
          Карточка {currentCardIndex + 1} из {sessionCards.length} 
          {currentCard.deck_id && ` • Колода ID: ${currentCard.deck_id}`}
        </p>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
        <div 
          className={`transition-all duration-500 ${isFlipped ? 'transform' : ''}`}
        >
          {!isFlipped ? (
            <div className="text-center">
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                  Вопрос
                </span>
                <div className="mt-2 text-sm text-gray-500">
                  Уровень сложности: {currentCard.difficulty_level + 1}/5
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-6 py-8 min-h-[200px] flex items-center justify-center">
                {currentCard.front_text}
              </div>
              {currentCard.example && !isFlipped && (
                <div className="text-gray-600 italic mb-6 p-4 bg-gray-50 rounded-lg">
                  "{currentCard.example}"
                </div>
              )}
              <button 
                onClick={handleFlip}
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center mx-auto"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Показать ответ
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                  Ответ
                </span>
                <div className="mt-2 text-sm text-gray-500">
                  Прогресс изучения: {currentCard.progress || 0}%
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-4">{currentCard.back_text}</div>
              {currentCard.example && (
                <div className="text-gray-600 italic mb-8 p-4 bg-gray-50 rounded-lg">
                  "{currentCard.example}"
                  <button className="ml-2 text-gray-500 hover:text-gray-700">
                    <Volume2 className="h-4 w-4 inline" />
                  </button>
                </div>
              )}
              <div className="mb-6">
                <div className="flex justify-center space-x-4 text-sm text-gray-500">
                  <div>
                    <Target className="h-4 w-4 inline mr-1" />
                    Повторений: {currentCard.review_count}
                  </div>
                  <div>
                    ✓ Правильно: {currentCard.correct_count}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-8">
                Оцените, насколько хорошо вы знали ответ
              </p>
            </div>
          )}
        </div>
      </div>

      {isFlipped && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => handleAnswer(false)}
            className="flex-1 bg-red-50 text-red-700 border border-red-200 px-8 py-4 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center"
          >
            <XCircle className="h-5 w-5 mr-2" />
            Забыл
            <span className="ml-2 text-sm opacity-75">(Верну на 1 уровень)</span>
          </button>
          <button 
            onClick={() => handleAnswer(true)}
            className="flex-1 bg-green-50 text-green-700 border border-green-200 px-8 py-4 rounded-xl font-medium hover:bg-green-100 transition-colors flex items-center justify-center"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Помню
            <span className="ml-2 text-sm opacity-75">(Переведу на следующий уровень)</span>
          </button>
        </div>
      )}

      <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold mb-4">Система интервального повторения (Лейтнер)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="font-medium text-blue-800 mb-1">Уровни сложности</div>
            <div className="text-sm text-blue-600">
              Карточки перемещаются между 5 уровнями в зависимости от ваших ответов
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="font-medium text-green-800 mb-1">Интервалы повторения</div>
            <div className="text-sm text-green-600">
              Уровень 1: 1 день → Уровень 2: 3 дня → Уровень 3: 7 дней → Уровень 4: 14 дней → Уровень 5: 30 дней
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPage;