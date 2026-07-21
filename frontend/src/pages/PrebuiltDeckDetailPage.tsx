import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Globe, Download, CheckCircle, Plus } from 'lucide-react';
import { studyAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const PrebuiltDeckDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [deck, setDeck] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDeckDetails();
  }, [id]);

  const fetchDeckDetails = async () => {
    try {
      setLoading(true);

      const decksResponse = await studyAPI.getPrebuiltDecks({});
      const responseData = decksResponse.data as any;
      const decksArray = responseData.decks || responseData.data?.decks || [];
      const foundDeck = decksArray.find((d: any) => d.id === parseInt(id || '0'));

      if (!foundDeck) { navigate('/prebuilt-decks'); return; }
      setDeck(foundDeck);

      const cardsResponse = await studyAPI.getPrebuiltDeckCards(parseInt(id || '0'));
      const cardsData = cardsResponse.data as any;
      setCards(cardsData.cards || cardsData.data?.cards || []);

    } catch (err) {
      console.error('Ошибка загрузки деталей курса:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (adding || added) return;
    setAdding(true);
    setError('');
    try {
      await studyAPI.addPrebuiltDeck(parseInt(id || '0'), { custom_name: deck.name });
      setAdded(true);
      toast.success(`Колода добавлена! Перейдите в Мои колоды.`);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Ошибка при добавлении';
      setError(msg);
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  const getDifficultyColor = (d: string) => {
    if (d === 'beginner') return 'bg-green-100 text-green-800';
    if (d === 'intermediate') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDifficultyText = (d: string) => {
    if (d === 'beginner') return 'Начинающий';
    if (d === 'intermediate') return 'Средний';
    if (d === 'advanced') return 'Продвинутый';
    return d;
  };

  const flagMap: Record<string, string> = {
    en: '🇬🇧', es: '🇪🇸', de: '🇩🇪', fr: '🇫🇷',
    it: '🇮🇹', ja: '🇯🇵', zh: '🇨🇳', ru: '🇷🇺',
  };
  const langMap: Record<string, string> = {
    en: 'Английский', es: 'Испанский', de: 'Немецкий',
    fr: 'Французский', it: 'Итальянский', ja: 'Японский',
    zh: 'Китайский', ru: 'Русский',
  };
  const catMap: Record<string, string> = {
    basic: 'Основы', grammar: 'Грамматика', travel: 'Путешествия',
    business: 'Бизнес', food: 'Еда', vocabulary: 'Словарный запас',
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
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Курс не найден</h1>
        <Link to="/prebuilt-decks" className="btn-primary">Вернуться к библиотеке</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Назад */}
      <button onClick={() => navigate('/prebuilt-decks')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Назад к библиотеке
      </button>

      {/* Заголовок */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-4xl">{flagMap[deck.language] || '🌐'}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(deck.difficulty)}`}>
                {getDifficultyText(deck.difficulty)}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Бесплатно
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">{deck.name}</h1>
            <p className="text-gray-700 text-lg mb-5">{deck.description}</p>

            <div className="flex flex-wrap gap-2">
              {deck.tags?.map((tag: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Инфо карточка */}
          <div className="bg-gray-50 rounded-xl p-6 w-full md:w-72 shrink-0">
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold">{cards.length}</div>
                <div className="text-xs text-gray-500">карточек</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold">{deck.popularity || 90}%</div>
                <div className="text-xs text-gray-500">популярность</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                {langMap[deck.language] || deck.language}
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gray-400" />
                {catMap[deck.category] || deck.category}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                Автор: {deck.author || 'LinguaCards Team'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Предпросмотр */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Предпросмотр карточек ({cards.length})</h2>
        {cards.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">
            Нет карточек для предпросмотра
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.slice(0, 6).map((card, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex gap-4">
                    <div className="flex-1 border-r border-gray-100 pr-4">
                      <div className="text-xs text-gray-400 mb-1">Вопрос</div>
                      <div className="font-medium text-gray-900">{card.front_text}</div>
                    </div>
                    <div className="flex-1 pl-4">
                      <div className="text-xs text-gray-400 mb-1">Ответ</div>
                      <div className="font-medium text-gray-900">{card.back_text}</div>
                      {card.example && (
                        <div className="text-xs text-gray-500 mt-1 italic">"{card.example}"</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cards.length > 6 && (
              <p className="text-center mt-3 text-gray-500 text-sm">
                и ещё {cards.length - 6} карточек в этой колоде...
              </p>
            )}
          </>
        )}
      </div>

      {/* Кнопка добавить */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-blue-900 mb-1">Хотите изучать этот курс?</h3>
            <p className="text-blue-700 text-sm">
              Добавьте его в свои колоды и начните прямо сейчас
            </p>
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <div className="flex gap-3">
            <button onClick={() => navigate('/prebuilt-decks')}
              className="px-5 py-2.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm font-medium">
              Назад
            </button>

            {added ? (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                Добавлено!
                <Link to="/decks" className="underline ml-1">Перейти к колодам →</Link>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
              >
                {adding ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {adding ? 'Добавляем...' : 'Добавить в мои колоды'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrebuiltDeckDetailPage;