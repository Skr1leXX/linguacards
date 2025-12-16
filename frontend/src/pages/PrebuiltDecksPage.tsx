import { useState, useEffect } from 'react';
import { 
  Search, Filter, Star, Users, Clock, BookOpen, 
  Download, Globe, TrendingUp, Award, CheckCircle,
  ChevronRight, Sparkles, Tag, Plus, Eye, Lock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { studyAPI } from '../services/api';
import type { PrebuiltDeck, PrebuiltDeckCategory, PrebuiltDeckFilters } from '../types';

const PrebuiltDecksPage = () => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<PrebuiltDeck[]>([]);
  const [categories, setCategories] = useState<PrebuiltDeckCategory[]>([]);
  const [languages, setLanguages] = useState<Array<{ code: string; name: string; count: number }>>([]);
  const [difficulties, setDifficulties] = useState<Array<{ id: string; name: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [addingDeckId, setAddingDeckId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<PrebuiltDeckFilters>({
    category: '',
    language: '',
    difficulty: '',
    search: ''
  });

  useEffect(() => {
    fetchPrebuiltDecks();
  }, [filters]);

  const fetchPrebuiltDecks = async () => {
    try {
      setLoading(true);
      console.log('Fetching prebuilt decks with filters:', filters);
      
      const response = await studyAPI.getPrebuiltDecks(filters);
      console.log('API Response:', response);
      console.log('Response data:', response.data);
      
      // Backend возвращает данные напрямую, а не в поле data.data
      const responseData = response.data as any;
      
      console.log('Response data structure:', {
        hasDecks: !!responseData.decks,
        decksLength: responseData.decks?.length,
        hasCategories: !!responseData.categories,
        hasLanguages: !!responseData.languages,
        hasDifficulties: !!responseData.difficulties
      });
      
      // Убедимся, что decks есть и это массив
      if (responseData && Array.isArray(responseData.decks)) {
        setDecks(responseData.decks as PrebuiltDeck[]);
      } else {
        console.warn('No decks array found in response:', responseData);
        setDecks([]);
      }
      
      // Явно приводим типы
      setCategories((responseData.categories as PrebuiltDeckCategory[]) || []);
      setLanguages((responseData.languages as Array<{ code: string; name: string; count: number }>) || []);
      setDifficulties((responseData.difficulties as Array<{ id: string; name: string; count: number }>) || []);
      
    } catch (error: any) {
      console.error('Ошибка загрузки готовых курсов:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      // Fallback данные для разработки
      const fallbackData = {
        decks: [
          {
            id: 1,
            name: 'Английские основы (fallback)',
            language: 'en',
            description: 'Тестовые данные для отладки',
            category: 'basic',
            difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
            card_count: 20,
            tags: ['тест', 'отладка'],
            is_free: true,
            author: 'Debug Team',
            created_at: new Date().toISOString(),
            popularity: 85
          },
          {
            id: 2,
            name: 'Испанские глаголы (fallback)',
            language: 'es',
            description: 'Базовые испанские глаголы',
            category: 'grammar',
            difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
            card_count: 15,
            tags: ['глаголы', 'начальный'],
            is_free: true,
            author: 'Debug Team',
            created_at: new Date().toISOString(),
            popularity: 75
          }
        ] as PrebuiltDeck[],
        categories: [
          { id: 'basic', name: 'Основы', deck_count: 1 },
          { id: 'grammar', name: 'Грамматика', deck_count: 1 }
        ] as PrebuiltDeckCategory[],
        languages: [
          { code: 'en', name: 'Английский', count: 1 },
          { code: 'es', name: 'Испанский', count: 1 }
        ] as Array<{ code: string; name: string; count: number }>,
        difficulties: [
          { id: 'beginner', name: 'Начинающий', count: 2 }
        ] as Array<{ id: string; name: string; count: number }>
      };
      
      setDecks(fallbackData.decks);
      setCategories(fallbackData.categories);
      setLanguages(fallbackData.languages);
      setDifficulties(fallbackData.difficulties);
      
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeck = async (deckId: number, deckName: string) => {
  if (addingDeckId) return;
  
  setAddingDeckId(deckId);
  setSuccessMessage(null);
  
  try {
    console.log('Adding prebuilt deck:', deckId, deckName);
    console.log('User token:', localStorage.getItem('token'));
    
    const response = await studyAPI.addPrebuiltDeck(deckId, {
      custom_name: deckName
    });
    
    console.log('Add deck response:', response);
    console.log('Response data:', response.data);
    console.log('Response status:', response.status);
    
    setSuccessMessage(`Курс "${deckName}" успешно добавлен в вашу коллекцию!`);
    
    // Обновляем список колод
    setTimeout(() => {
      fetchPrebuiltDecks();
    }, 1000);
    
  } catch (error: any) {
    console.error('Ошибка при добавлении курса:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    
    // Более информативное сообщение
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        'Ошибка при добавлении курса';
    
    alert(`Не удалось добавить курс: ${errorMessage}\n\nПроверьте консоль для подробностей.`);
    
  } finally {
    setAddingDeckId(null);
  }
};

  const handleFilterChange = (key: keyof PrebuiltDeckFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      language: '',
      difficulty: '',
      search: ''
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Начинающий';
      case 'intermediate': return 'Средний';
      case 'advanced': return 'Продвинутый';
      default: return difficulty;
    }
  };

  const getLanguageName = (code: string) => {
    const langMap: Record<string, string> = {
      'en': 'Английский',
      'es': 'Испанский',
      'de': 'Немецкий',
      'fr': 'Французский',
      'it': 'Итальянский',
      'ru': 'Русский'
    };
    return langMap[code] || code;
  };

  const getLanguageFlag = (code: string) => {
    const flagMap: Record<string, string> = {
      'en': '🇬🇧',
      'es': '🇪🇸',
      'de': '🇩🇪',
      'fr': '🇫🇷',
      'it': '🇮🇹',
      'ru': '🇷🇺'
    };
    return flagMap[code] || '🌐';
  };

  if (loading && decks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка готовых наборов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок и описание */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Готовые наборы карточек</h1>
            <p className="text-gray-600 mt-2">
              Выберите из коллекции профессионально созданных колод для быстрого старта
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-700">Бесплатные наборы</span>
          </div>
        </div>

        {/* Сообщение об успехе */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 animate-fadeIn">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-green-800">{successMessage}</p>
                <p className="text-sm text-green-700 mt-1">
                  Курс теперь доступен в ваших курсах. <Link to="/decks" className="font-medium underline">Перейти к курсам →</Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Фильтры и поиск */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Поиск */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск курсов..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Категория */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Все категории</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.deck_count})
                </option>
              ))}
            </select>

            {/* Язык */}
            <select
              value={filters.language}
              onChange={(e) => handleFilterChange('language', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Все языки</option>
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {getLanguageName(lang.code)} ({lang.count})
                </option>
              ))}
            </select>

            {/* Сложность */}
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Любая сложность</option>
              {difficulties.map(diff => (
                <option key={diff.id} value={diff.id}>
                  {getDifficultyText(diff.id)} ({diff.count})
                </option>
              ))}
            </select>
          </div>

          {/* Активные фильтры */}
          {(filters.category || filters.language || filters.difficulty || filters.search) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Активные фильтры:</span>
                <div className="flex flex-wrap gap-2">
                  {filters.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                      Категория: {categories.find(c => c.id === filters.category)?.name || filters.category}
                      <button
                        onClick={() => handleFilterChange('category', '')}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.language && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      Язык: {getLanguageName(filters.language)}
                      <button
                        onClick={() => handleFilterChange('language', '')}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.difficulty && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                      Сложность: {getDifficultyText(filters.difficulty)}
                      <button
                        onClick={() => handleFilterChange('difficulty', '')}
                        className="ml-2 text-yellow-600 hover:text-yellow-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.search && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                      Поиск: "{filters.search}"
                      <button
                        onClick={() => handleFilterChange('search', '')}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Сбросить все
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800">Всего наборов</p>
              <p className="text-3xl font-bold text-blue-900">{decks.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-800">Бесплатных</p>
              <p className="text-3xl font-bold text-green-900">
                {decks.filter(d => d.is_free).length}
              </p>
            </div>
            <Star className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-800">Карточек всего</p>
              <p className="text-3xl font-bold text-purple-900">
                {decks.reduce((sum, deck) => sum + (deck.card_count || 0), 0)}
              </p>
            </div>
            <Tag className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-800">Языков</p>
              <p className="text-3xl font-bold text-orange-900">
                {new Set(decks.map(d => d.language)).size}
              </p>
            </div>
            <Globe className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Список колод */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Доступные наборы ({decks.length})
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <TrendingUp className="h-4 w-4" />
            <span>Сортировка по популярности</span>
          </div>
        </div>

        {decks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Наборы не найдены</h3>
            <p className="text-gray-600 mb-6">Попробуйте изменить параметры поиска</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map(deck => {
              // Вычисляем популярность на основе ID (заглушка для демо)
              const popularity = deck.popularity || (70 + (deck.id % 30)); // От 70 до 99%
              
              return (
                <div
                  key={deck.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  {/* Заголовок колоды */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-2xl">{getLanguageFlag(deck.language)}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(deck.difficulty)}`}>
                            {getDifficultyText(deck.difficulty)}
                          </span>
                          {deck.is_free ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Бесплатно
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center">
                              <Lock className="h-3 w-3 mr-1" />
                              Премиум
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                          {deck.name}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {deck.description}
                        </p>
                      </div>
                    </div>

                    {/* Статистика колоды */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="font-bold text-gray-900">{deck.card_count}</div>
                        <div className="text-xs text-gray-600">карточек</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="font-bold text-gray-900">{popularity}%</div>
                        <div className="text-xs text-gray-600">популярность</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="font-bold text-gray-900">
                          {new Date(deck.created_at).toLocaleDateString('ru-RU', { month: 'short' })}
                        </div>
                        <div className="text-xs text-gray-600">добавлена</div>
                      </div>
                    </div>
                  </div>

                  {/* Теги и автор */}
                  <div className="p-4 bg-gray-50 border-b border-gray-100">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {deck.tags?.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {deck.tags && deck.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs text-gray-500">
                          +{deck.tags.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-3 w-3 mr-1" />
                      <span>Автор: {deck.author || 'Spaced Repetition Team'}</span>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="p-4">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleAddDeck(deck.id, deck.name)}
                        disabled={!deck.is_free || addingDeckId === deck.id}
                        className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                          !deck.is_free
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : addingDeckId === deck.id
                            ? 'bg-primary-400 text-white'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {addingDeckId === deck.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Добавление...
                          </>
                        ) : !deck.is_free ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Премиум
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Добавить в мои курсы
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => navigate(`/prebuilt-decks/${deck.id}`)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Просмотр
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Преимущества готовых наборов */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200 p-8">
        <h2 className="text-2xl font-bold text-primary-900 mb-6 text-center">
          Почему готовые наборы эффективны?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Профессиональный подбор</h3>
            <p className="text-gray-600 text-sm">
              Карточки созданы опытными преподавателями с учетом частотности использования слов
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Экономия времени</h3>
            <p className="text-gray-600 text-sm">
              Не тратьте время на создание карточек - сразу приступайте к изучению
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Быстрый прогресс</h3>
            <p className="text-gray-600 text-sm">
              Сфокусированные наборы позволяют быстро освоить конкретные темы
            </p>
          </div>
        </div>
      </div>

      {/* Призыв к действию */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">
          Не нашли подходящий набор? Создайте свой курс с нуля!
        </p>
        <Link
          to="/decks/new"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 font-medium shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Создать свой курс
          <ChevronRight className="h-5 w-5 ml-2" />
        </Link>
      </div>
    </div>
  );
};

// Добавим CSS для ограничения строк
const styles = `
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
`;

// Добавляем стили в документ
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

export default PrebuiltDecksPage;