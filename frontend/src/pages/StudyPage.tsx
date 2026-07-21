import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, RotateCcw, Volume2, ChevronRight, Brain, Target, Lightbulb } from 'lucide-react';
import { useStudy } from '../hooks/useStudy';
import type { Card } from '../types';

// ─── 3D flip стили ────────────────────────────────────────────────────────────
const FlipStyles = () => (
  <style>{`
    .flip-scene {
      width: 100%;
      cursor: pointer;
      min-height: 340px;
      position: relative;
    }
    .flip-card {
      position: relative;
      width: 100%;
      min-height: 340px;
    }
    .flip-front,
    .flip-back {
      width: 100%;
      min-height: 340px;
      border-radius: 0.75rem;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 24px rgba(0,0,0,0.07);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .flip-front {
      background: white;
      position: relative;
    }
    .flip-back {
      background: #f9fafb;
      position: relative;
      display: none;
    }
    .flip-card.flipped .flip-front {
      display: none;
    }
    .flip-card.flipped .flip-back {
      display: flex;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .flip-hint {
      position: absolute;
      bottom: 14px;
      left: 0; right: 0;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      pointer-events: none;
    }
    .flip-front {
      position: relative;
    }
  `}</style>
);

// ─── Определяем язык текста для озвучки ──────────────────────────────────────
const detectLang = (text: string): string => {
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh-CN';
  if (/[\u3040-\u30ff]/.test(text)) return 'ja-JP';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko-KR';
  if (/[\u0400-\u04ff]/.test(text)) return 'ru-RU';
  if (/[\u00c0-\u024f]/.test(text)) return 'fr-FR';
  if (/[äöüßÄÖÜ]/.test(text)) return 'de-DE';
  if (/[áéíóúüñ¿¡]/i.test(text)) return 'es-ES';
  return 'en-US';
};

const speak = (text: string) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = detectLang(text);
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
};

// ─── Кнопка озвучки ──────────────────────────────────────────────────────────
const SpeakButton = ({ text, size = 'md' }: { text: string; size?: 'sm' | 'md' | 'lg' }) => {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = detectLang(text);
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <button
      onClick={handleSpeak}
      title="Озвучить"
      className={`inline-flex items-center justify-center rounded-full p-1.5 transition-colors
        ${speaking
          ? 'text-primary-600 bg-primary-50 animate-pulse'
          : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'
        }`}
    >
      <Volume2 className={sizeClasses[size]} />
    </button>
  );
};

// ─── Компонент StudyPage ──────────────────────────────────────────────────────
const StudyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hintLevel, setHintLevel] = useState(0); // 0=скрыто 1=первая буква 2=половина 3=почти всё
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
          await fetchSessionCards(deckId ? parseInt(deckId) : undefined, 50);
          setSessionStarted(true);
        } catch (err) {
          console.error('Ошибка при загрузке сессии:', err);
        }
      };
      loadSession();
    }
  }, [deckId, sessionStarted, fetchSessionCards]);

  // Останавливаем озвучку и сбрасываем подсказку при смене карточки
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setHintLevel(0);
  }, [currentCardIndex]);

  const currentCard = getCurrentCard();

  // ─── Клавиатурные шорткаты ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (isAnimating || !currentCard || sessionComplete) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      }
      if (e.code === 'ArrowRight' && isFlipped) {
        e.preventDefault();
        handleAnswer(true);
      }
      if (e.code === 'ArrowLeft' && isFlipped) {
        e.preventDefault();
        handleAnswer(false);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFlipped, isAnimating, currentCard, sessionComplete]);

  // Генерируем подсказку по уровню
  const getHint = (text: string, level: number): string => {
    if (!text || level === 0) return '';
    const words = text.split(' ');
    return words.map(word => {
      const clean = word.replace(/[.,!?;:]/g, '');
      if (clean.length <= 1) return word;
      if (level === 1) return clean[0] + '_'.repeat(clean.length - 1) + word.slice(clean.length);
      if (level === 2) return clean.slice(0, Math.ceil(clean.length / 2)) + '_'.repeat(Math.floor(clean.length / 2)) + word.slice(clean.length);
      return clean.slice(0, clean.length - 1) + '_' + word.slice(clean.length);
    }).join(' ');
  };

  const handleFlip = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(prev => !prev);
    setTimeout(() => setIsAnimating(false), 620);
  };

  const handleAnswer = async (correct: boolean) => {
    if (!currentCard) return;
    window.speechSynthesis?.cancel();
    try {
      await reviewCard(currentCard.id, correct);
      setIsAnimating(true);
      setIsFlipped(false);
      setTimeout(() => setIsAnimating(false), 620);
      if (!hasNextCard()) {
        setSessionComplete(true);
      }
    } catch (err) {
      console.error('Ошибка при сохранении ответа:', err);
    }
  };

  const restartSession = async () => {
    window.speechSynthesis?.cancel();
    resetSession();
    setSessionComplete(false);
    setSessionStarted(false);
    setIsFlipped(false);
  };

  const startNewSession = () => {
    navigate('/study');
    restartSession();
  };

  // ─── Загрузка ───────────────────────────────────────────────────────────────
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

  // ─── Ошибка ─────────────────────────────────────────────────────────────────
  if (error && !sessionStarted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <button onClick={restartSession} className="btn-primary">
          Попробовать снова
        </button>
      </div>
    );
  }

  // ─── Сессия завершена ────────────────────────────────────────────────────────
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

  // ─── Нет карточек ───────────────────────────────────────────────────────────
  if (!currentCard) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Brain className="h-16 w-16 text-gray-300 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Нет карточек для изучения</h1>
        <p className="text-gray-600 mb-8">
          Все карточки изучены на сегодня. Возвращайтесь завтра для следующей сессии.
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

  // ─── Основной экран карточки ─────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      {/* Заголовок и прогресс */}
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

      {/* 3D Карточка */}
      <FlipStyles />
      <div className="flip-scene mb-8" onClick={handleFlip} style={{ minHeight: 340 }}>
        <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>

          {/* Лицевая сторона — ВОПРОС */}
          <div className="flip-front text-center">
            <div className="mb-4">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                Вопрос
              </span>
              <div className="mt-2 text-sm text-gray-500">
                Уровень сложности: {currentCard.difficulty_level + 1}/5
              </div>
            </div>

            <div className="py-6 flex flex-col items-center gap-4">
              <div className="text-4xl font-bold text-gray-900">
                {currentCard.front_text}
              </div>
              <SpeakButton text={currentCard.front_text} size="lg" />
            </div>

            {/* Подсказка */}
            {hintLevel > 0 && (
              <div className="mb-3 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <span className="text-xs text-yellow-600 font-medium block mb-1">Подсказка</span>
                <span className="text-lg font-mono tracking-widest text-yellow-800">
                  {getHint(currentCard.back_text, hintLevel)}
                </span>
              </div>
            )}

            {currentCard.example && (
              <div className="text-gray-600 italic p-4 bg-gray-50 rounded-lg flex items-center justify-center gap-2 text-sm">
                <span>"{currentCard.example}"</span>
                <SpeakButton text={currentCard.example} size="sm" />
              </div>
            )}

            {/* Кнопка подсказки + flip hint */}
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-between px-4">
              <button
                onClick={(e) => { e.stopPropagation(); setHintLevel(l => Math.min(l + 1, 3)); }}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors
                  ${hintLevel > 0
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {hintLevel === 0 ? 'Подсказка' : hintLevel === 3 ? 'Макс.' : 'Ещё'}
              </button>
              <span className="text-xs text-gray-400">Нажмите чтобы перевернуть</span>
            </div>
          </div>

          {/* Обратная сторона — ОТВЕТ */}
          <div className="flip-back text-center">
            <div className="mb-4">
              <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                Ответ
              </span>
              <div className="mt-2 text-sm text-gray-500">
                Прогресс изучения: {currentCard.progress || 0}%
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="text-4xl font-bold text-gray-900">
                {currentCard.back_text}
              </div>
              <SpeakButton text={currentCard.back_text} size="lg" />
            </div>

            {currentCard.example && (
              <div className="text-gray-600 italic mb-4 p-4 bg-white rounded-lg flex items-center justify-center gap-2 text-sm">
                <span>"{currentCard.example}"</span>
                <SpeakButton text={currentCard.example} size="sm" />
              </div>
            )}

            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <div><Target className="h-4 w-4 inline mr-1" />Повторений: {currentCard.review_count}</div>
              <div>✓ Правильно: {currentCard.correct_count}</div>
            </div>

            <p className="text-sm text-gray-400 mt-4">Оцените ваш ответ ниже</p>
          </div>
        </div>
      </div>

      {/* Подсказка шорткатов */}
      <div className="flex items-center justify-center gap-6 mb-4 text-xs text-gray-400 select-none">
        <span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-500 font-mono">Space</kbd>
          {' '}перевернуть
        </span>
        {isFlipped && (
          <>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-500 font-mono">←</kbd>
              {' '}забыл
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-500 font-mono">→</kbd>
              {' '}помню
            </span>
          </>
        )}
      </div>

      {/* Кнопки оценки */}
      {isFlipped && !isAnimating && (
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

      {/* Инфо блок */}
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