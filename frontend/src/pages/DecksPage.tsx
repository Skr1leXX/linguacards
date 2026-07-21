import { useState, useEffect } from 'react';
import { Plus, BookOpen, Globe, Calendar, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDecks } from '../hooks/useDecks';
import type { Deck } from '../types';

const DecksPage = () => {
  const { decks, loading, error, fetchDecks } = useDecks();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDecks();
    setRefreshing(false);
  };

  const getLanguageName = (code: string) => {
    const languages: { [key: string]: string } = {
      'en': 'Английский',
      'es': 'Испанский',
      'de': 'Немецкий',
      'fr': 'Французский',
      'ru': 'Русский',
      'it': 'Итальянский',
    };
    return languages[code] || code.toUpperCase();
  };

  const getLanguageFlag = (code: string) => {
    const flags: { [key: string]: string } = {
      'en': '🇬🇧',
      'es': '🇪🇸',
      'de': '🇩🇪',
      'fr': '🇫🇷',
      'ru': '🇷🇺',
      'it': '🇮🇹',
    };
    return flags[code] || '🌐';
  };

  if (loading && !decks.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка курсов...</p>
        </div>
      </div>
    );
  }

  if (error && !decks.length) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка при загрузке курсов</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <button
          onClick={handleRefresh}
          className="btn-primary"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  const totalCards = decks.reduce((sum, deck) => sum + (deck.card_count || 0), 0);
  const totalDue = decks.reduce((sum, deck) => sum + (deck.due_count || 0), 0);
  const uniqueLanguages = [...new Set(decks.map(deck => deck.language))];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Заголовок и действия */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Мои курсы</h1>
          <p className="text-gray-600 mt-2">
            {decks.length > 0 
              ? `Управляйте ${decks.length} колодами для изучения языков` 
              : 'Создавайте и управляйте колодами для изучения'
            }
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Обновить
          </button>
          <Link to="/decks/new" className="btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Новая колода
          </Link>
        </div>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-primary-100 p-3 rounded-lg mr-4">
              <BookOpen className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Всего курсов</p>
              <p className="text-2xl font-bold">{decks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Всего карточек</p>
              <p className="text-2xl font-bold">{totalCards}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg mr-4">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">К повторению</p>
              <p className="text-2xl font-bold">{totalDue}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg mr-4">
              <Globe className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Языков</p>
              <p className="text-2xl font-bold">{uniqueLanguages.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Список колод */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map(deck => (
          <div key={deck.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{deck.name}</h3>
                <div className="flex items-center mt-2 space-x-2">
                  <span className="flex items-center text-sm text-gray-600">
                    <span className="text-lg mr-1">{getLanguageFlag(deck.language)}</span>
                    {getLanguageName(deck.language)}
                  </span>
                  <span className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(deck.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
              <div className={`'bg-gray-100 text-gray-600' text-xs font-bold px-3 py-1 rounded-full`}>
                {deck.card_count || 0} карт.
              </div>
            </div>
            
            {deck.description && (
              <p className="text-gray-600 mb-6 line-clamp-2">{deck.description}</p>
            )}
            
            <div className="space-y-4">
              {/* Индикатор публичности */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                </span>
                <span className="text-sm font-medium text-primary-600">
                  {deck.due_count || 0} к повторению
                </span>
              </div>
              
              {/* Кнопки действий */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Link 
                    to={`/study?deckId=${deck.id}`}
                    className={`btn-primary text-sm px-4 ${(deck.due_count || 0) === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={(deck.due_count || 0) === 0 ? 'Нет карточек к повторению' : 'Начать изучение'}
                  >
                    <BookOpen className="h-4 w-4 mr-1 inline" />
                    Учить
                  </Link>
                  <Link 
  to={`/decks/${deck.id}`}
  className="btn-secondary text-sm px-4"
>
  Редактировать
</Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Карточка для создания новой колоды */}
        <Link 
  to="/decks/new"
  className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:border-primary-400 hover:bg-primary-50 transition-colors"
>
  <div className="bg-primary-100 p-3 rounded-full mb-4">
    <Plus className="h-8 w-8 text-primary-600" />
  </div>
  <h3 className="text-lg font-medium text-gray-900 mb-2">Создать новый курс</h3>
  <p className="text-gray-600 text-center text-sm">
    Начните изучать новые слова с собственным курсом
  </p>
</Link>
      </div>

      {/* Сообщение если нет колод */}
      {decks.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-gray-900 mb-4">У вас пока нет курсов</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Создайте свой первый курс карточек для изучения иностранных языков с помощью системы интервального повторения
          </p>
          <Link to="/decks/new" className="btn-primary inline-flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Создать первый курс
          </Link>
        </div>
      )}

      {/* Подсказки по использованию */}
      <div className="mt-12 bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-4">💡 Советы по работе с курсами</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 mr-2 flex-shrink-0">
              1
            </div>
            <p className="text-blue-800">Создавайте тематические курсы (глаголы, существительные, фразы для путешествий)</p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 mr-2 flex-shrink-0">
              2
            </div>
            <p className="text-blue-800">Добавляйте по 5-10 карточек за раз, чтобы не перегружать себя</p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 mr-2 flex-shrink-0">
              3
            </div>
            <p className="text-blue-800">Используйте систему интервального повторения для эффективного запоминания</p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 mr-2 flex-shrink-0">
              4
            </div>
            <p className="text-blue-800">Регулярно добавляйте новые карточки и повторяйте старые</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecksPage;