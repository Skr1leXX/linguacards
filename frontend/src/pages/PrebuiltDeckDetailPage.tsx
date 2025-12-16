import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Tag, Globe, Users, Download } from 'lucide-react';
import { studyAPI } from '../services/api';

const PrebuiltDeckDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeckDetails();
  }, [id]);

  const fetchDeckDetails = async () => {
    try {
      setLoading(true);
      
      // Получаем все колоды
      const decksResponse = await studyAPI.getPrebuiltDecks({});
      
      // Приводим к any чтобы обойти проблемы с типами
      const responseData = decksResponse.data as any;
      
      // Ищем колоду в разных возможных местах
      let decksArray: any[] = [];
      
      if (responseData.data && responseData.data.decks && Array.isArray(responseData.data.decks)) {
        decksArray = responseData.data.decks;
      } else if (responseData.decks && Array.isArray(responseData.decks)) {
        decksArray = responseData.decks;
      } else if (Array.isArray(responseData)) {
        decksArray = responseData;
      }
      
      const foundDeck = decksArray.find((d: any) => d.id === parseInt(id || '0'));
      
      if (!foundDeck) {
        navigate('/prebuilt-decks');
        return;
      }
      
      setDeck(foundDeck);
      
      // Получаем карточки колоды
      const cardsResponse = await studyAPI.getPrebuiltDeckCards(parseInt(id || '0'));
      const cardsData = cardsResponse.data as any;
      
      let cardsArray: any[] = [];
      
      if (cardsData.data && cardsData.data.cards && Array.isArray(cardsData.data.cards)) {
        cardsArray = cardsData.data.cards;
      } else if (cardsData.cards && Array.isArray(cardsData.cards)) {
        cardsArray = cardsData.cards;
      } else if (Array.isArray(cardsData)) {
        cardsArray = cardsData;
      }
      
      setCards(cardsArray);
      
    } catch (error: any) {
      console.error('Ошибка загрузки деталей курса:', error);
      
      // Fallback: если API не работает, покажем тестовые данные
      const mockDeck = {
        id: parseInt(id || '0'),
        name: 'Тестовый курс',
        language: 'en',
        description: 'Тестовое описание курса',
        difficulty: 'beginner',
        card_count: 10,
        tags: ['тест', 'пример'],
        is_free: true,
        author: 'Test Team',
        created_at: new Date().toISOString(),
        popularity: 75
      };
      
      const mockCards = [
        { front_text: "Hello", back_text: "Привет", example: "Hello, how are you?" },
        { front_text: "Goodbye", back_text: "До свидания", example: "Goodbye, see you tomorrow!" },
        { front_text: "Thank you", back_text: "Спасибо", example: "Thank you for your help." }
      ];
      
      setDeck(mockDeck);
      setCards(mockCards);
      
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Курс не найден</h1>
          <Link to="/prebuilt-decks" className="btn-primary">
            Вернуться к наборам
          </Link>
        </div>
      </div>
    );
  }

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Назад */}
      <button
        onClick={() => navigate('/prebuilt-decks')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Назад к наборам
      </button>

      {/* Заголовок */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-4xl">{getLanguageFlag(deck.language)}</span>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getDifficultyColor(deck.difficulty)}`}>
                {getDifficultyText(deck.difficulty)}
              </span>
              {deck.is_free ? (
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Бесплатно
                </span>
              ) : (
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  Премиум
                </span>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{deck.name}</h1>
            <p className="text-gray-700 text-lg mb-6">{deck.description}</p>
            
            {/* Теги */}
            <div className="flex flex-wrap gap-2 mb-6">
              {deck.tags?.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {/* Статистика */}
          <div className="bg-gray-50 rounded-lg p-6 w-full md:w-80">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{deck.card_count}</div>
                <div className="text-sm text-gray-600">карточек</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{deck.popularity || 85}%</div>
                <div className="text-sm text-gray-600">популярность</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <Globe className="h-5 w-5 mr-3 text-gray-500" />
                <span>Язык: {getLanguageName(deck.language)}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <BookOpen className="h-5 w-5 mr-3 text-gray-500" />
                <span>Категория: {deck.category}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Users className="h-5 w-5 mr-3 text-gray-500" />
                <span>Автор: {deck.author || 'Spaced Repetition Team'}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Clock className="h-5 w-5 mr-3 text-gray-500" />
                <span>Добавлен: {new Date(deck.created_at).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Предпросмотр карточек */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Предпросмотр карточек ({cards.length})</h2>
        
        {cards.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Нет доступных карточек для предпросмотра</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.slice(0, 6).map((card, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex">
                  <div className="w-1/2 pr-4 border-r border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Вопрос</div>
                    <div className="font-medium">{card.front_text}</div>
                    {card.phonetic && (
                      <div className="text-sm text-gray-600 mt-1">[{card.phonetic}]</div>
                    )}
                  </div>
                  <div className="w-1/2 pl-4">
                    <div className="text-sm text-gray-500 mb-1">Ответ</div>
                    <div className="font-medium">{card.back_text}</div>
                    {card.example && (
                      <div className="text-sm text-gray-600 mt-2 italic">"{card.example}"</div>
                    )}
                  </div>
                </div>
                {card.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {card.tags.map((tag: string, tagIndex: number) => (
                      <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {cards.length > 6 && (
          <div className="text-center mt-4 text-gray-600">
            и еще {cards.length - 6} карточек...
          </div>
        )}
      </div>

      {/* Действия */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">Хотите начать учить этот курс?</h3>
            <p className="text-blue-700">
              Добавьте его в свои курсы и начните изучение с системой интервального повторения
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/prebuilt-decks')}
              className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
            >
              Назад к наборам
            </button>
            <button
              onClick={() => {
                // Здесь будет логика добавления колоды
                alert('Функция добавления курса будет реализована позже');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Добавить в мои курсы
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrebuiltDeckDetailPage;