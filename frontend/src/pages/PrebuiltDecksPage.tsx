import { useState, useEffect } from 'react';
import { 
  Search, Filter, Star, Users, Clock, BookOpen, 
  Download, Globe, TrendingUp, Award, CheckCircle,
  ChevronRight, Sparkles, Plus, Eye
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { studyAPI } from '../services/api';
import { useToast } from '../context/ToastContext'; // ← Оставляем studyAPI как было
import type { PrebuiltDeck, PrebuiltDeckCategory, PrebuiltDeckFilters } from '../types';

const PrebuiltDecksPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
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
      
      // Используем старый метод studyAPI.getPrebuiltDecks
      const response = await studyAPI.getPrebuiltDecks(filters);
      console.log('API Response:', response);
      
      // Старая структура: response.data содержит decks, categories и т.д.
      const responseData = response.data as any;
      
      console.log('Response data:', {
        decks: responseData.decks,
        categories: responseData.categories,
        languages: responseData.languages,
        difficulties: responseData.difficulties
      });
      
      // Проверяем структуру данных
      if (responseData) {
        // В старой структуре decks может быть в responseData.decks или responseData.data.decks
        const decksData = responseData.decks || responseData.data?.decks || [];
        const categoriesData = responseData.categories || responseData.data?.categories || [];
        const languagesData = responseData.languages || responseData.data?.languages || [];
        const difficultiesData = responseData.difficulties || responseData.data?.difficulties || [];
        
        setDecks(Array.isArray(decksData) ? decksData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setLanguages(Array.isArray(languagesData) ? languagesData : []);
        setDifficulties(Array.isArray(difficultiesData) ? difficultiesData : []);
      } else {
        setDecks([]);
        setCategories([]);
        setLanguages([]);
        setDifficulties([]);
      }
      
    } catch (error: any) {
      console.error('Ошибка загрузки готовых курсов:', error);
      
      // Fallback данные если API не работает
      const fallbackData = {
        decks: [
          {
            id: 1,
            name: 'Английские глаголы',
            language: 'en',
            description: 'Основные английские глаголы',
            category: 'verbs',
            difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
            card_count: 50,
            tags: ['глаголы', 'начальный'],
            is_free: true,
            author: 'System',
            created_at: new Date().toISOString(),
            popularity: 85
          },
          {
            id: 2,
            name: 'Испанские существительные',
            language: 'es',
            description: 'Базовые испанские существительные',
            category: 'nouns',
            difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
            card_count: 40,
            tags: ['существительные', 'начальный'],
            is_free: true,
            author: 'System',
            created_at: new Date().toISOString(),
            popularity: 75
          }
        ] as PrebuiltDeck[],
        categories: [
          { id: 'verbs', name: 'Глаголы', deck_count: 1 },
          { id: 'nouns', name: 'Существительные', deck_count: 1 }
        ] as PrebuiltDeckCategory[],
        languages: [
          { code: 'en', name: 'Английский', count: 1 },
          { code: 'es', name: 'Испанский', count: 1 }
        ],
        difficulties: [
          { id: 'beginner', name: 'Начинающий', count: 2 }
        ]
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
      
      // Используем старый метод studyAPI.addPrebuiltDeck
      const response = await studyAPI.addPrebuiltDeck(deckId, {
        custom_name: deckName
      });
      
      console.log('Add deck response:', response);
      
      setSuccessMessage(`Курс "${deckName}" успешно добавлен в вашу коллекцию!`);
      
      // Обновляем список колод
      setTimeout(() => {
        fetchPrebuiltDecks();
      }, 1000);
      
    } catch (error: any) {
      console.error('Ошибка при добавлении курса:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Ошибка при добавлении курса';
      
      toast.error(`Не удалось добавить курс: ${errorMessage}`);
      
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
      'ru': 'Русский',
      'ja': 'Японский',
      'zh': 'Китайский'
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
      'ru': '🇷🇺',
      'ja': '🇯🇵',
      'zh': '🇨🇳'
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
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
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
                  {cat.name} ({cat.deck_count || 0})
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
                  {getLanguageName(lang.code)} ({lang.count || 0})
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
                  {getDifficultyText(diff.id)} ({diff.count || 0})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Список колод */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Доступные наборы ({decks.length})
          </h2>
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
              const popularity = deck.popularity || (70 + (deck.id % 30));
              
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
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Бесплатно</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {deck.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
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
                          {deck.created_at ? new Date(deck.created_at).toLocaleDateString('ru-RU', { month: 'short' }) : 'Готовая'}
                        </div>
                        <div className="text-xs text-gray-600">добавлена</div>
                      </div>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="p-4">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleAddDeck(deck.id, deck.name)}
                        disabled={addingDeckId === deck.id}
                        className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                          addingDeckId === deck.id
                            ? 'bg-primary-400 text-white'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {addingDeckId === deck.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Добавление...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Добавить
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

      {/* Призыв к действию */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">
          Не нашли подходящий набор? Создайте свой курс с нуля!
        </p>
        <Link
          to="/decks/new"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 font-medium"
        >
          <Plus className="h-5 w-5 mr-2" />
          Создать свой курс
          <ChevronRight className="h-5 w-5 ml-2" />
        </Link>
      </div>
    </div>
  );
};

export default PrebuiltDecksPage;