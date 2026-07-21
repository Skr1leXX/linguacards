import { useState, useEffect } from 'react';
import {
  BookOpen, TrendingUp, Calendar, Target,
  Plus, Clock, Award, Languages,
  BarChart3, ChevronRight, Sparkles, Brain,
  RefreshCw, ChevronsRight, Layers, Repeat, CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { deckAPI, statsAPI } from '../services/api';
import type { Deck, StudyStats } from '../types';

// ─── Streak виджет ────────────────────────────────────────────────────────────
const StreakWidget = ({ days }: { days: number }) => {
  const getMessage = (d: number) => {
    if (d === 0) return { text: 'Начните серию сегодня!', color: 'text-gray-500' };
    if (d < 3)  return { text: 'Хорошее начало!', color: 'text-blue-600' };
    if (d < 7)  return { text: 'Так держать!', color: 'text-green-600' };
    if (d < 14) return { text: 'Отличная серия!', color: 'text-orange-500' };
    if (d < 30) return { text: 'Вы на огне!', color: 'text-orange-600' };
    return { text: 'Легенда!', color: 'text-red-600' };
  };

  const getFlameSize = (d: number) => {
    if (d === 0) return 'text-3xl opacity-30';
    if (d < 7)   return 'text-3xl';
    if (d < 14)  return 'text-4xl';
    if (d < 30)  return 'text-5xl';
    return 'text-5xl animate-bounce';
  };

  const { text, color } = getMessage(days);

  // Последние 7 дней — кружки активности (заглушка, реальные данные из streak_days)
  const circles = Array.from({ length: 7 }, (_, i) => i < days % 7 || days >= 7);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 font-medium">Серия дней</p>
        <Calendar className="h-5 w-5 text-orange-400" />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <span className={`${getFlameSize(days)} select-none`}>🔥</span>
        <div>
          <div className="text-5xl font-bold text-gray-900 leading-none">{days}</div>
          <div className={`text-sm font-medium mt-1 ${color}`}>{text}</div>
        </div>
      </div>

      {/* Кружки — последние 7 дней */}
      <div className="flex gap-1.5 mt-auto pt-3 border-t border-gray-100">
        {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((label, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className={`w-full aspect-square rounded-full ${
              circles[i] ? 'bg-orange-400' : 'bg-gray-100'
            }`} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── DashboardPage ─────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [decksResponse, overviewResponse, dailyResponse, languagesResponse] = await Promise.all([
        deckAPI.getAll(),
        statsAPI.getOverview(),
        statsAPI.getDailyStats(7),
        statsAPI.getLanguageStats(),
      ]);

      setDecks(decksResponse.data);
      setStats({
        overview: overviewResponse.data,
        daily_stats: dailyResponse.data,
        language_stats: languagesResponse.data,
      });
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const languages = [
    { code: 'en', name: 'Английский', flag: '🇬🇧' },
    { code: 'es', name: 'Испанский', flag: '🇪🇸' },
    { code: 'de', name: 'Немецкий', flag: '🇩🇪' },
    { code: 'fr', name: 'Французский', flag: '🇫🇷' },
  ];

  const quickActions = [
    { title: 'Начать изучение', description: 'Повторить карточки по алгоритму', icon: Brain, path: '/study', color: 'bg-blue-500' },
    { title: 'Создать курс', description: 'Добавить новые слова для изучения', icon: Plus, path: '/decks/new', color: 'bg-green-500' },
    { title: 'Добавить карточки', description: 'Расширить существующие колоды', icon: BookOpen, path: '/decks', color: 'bg-purple-500' },
    { title: 'Посмотреть статистику', description: 'Анализ вашего прогресса', icon: BarChart3, path: '/stats', color: 'bg-yellow-500' },
  ];

  const leitnerMethodSteps = [
    { icon: Layers, title: 'Карточки в 5 уровнях', description: 'Все карточки распределены по 5 уровням в зависимости от вашего знания' },
    { icon: Repeat, title: 'Интервалы повторения', description: 'Чем выше уровень — тем реже повторение. Уровень 1: каждый день, Уровень 5: раз в месяц' },
    { icon: CheckCircle, title: 'Прогресс через ответы', description: 'Правильный ответ — карточка переходит на уровень выше. Ошибка — возвращается на уровень 1' },
    { icon: ChevronsRight, title: 'Автоматический расчет', description: 'Система автоматически рассчитывает когда показывать каждую карточку' },
  ];

  const learningTips = [
    'Занимайтесь по 15–20 минут ежедневно для лучших результатов',
    'Создавайте карточки с примерами использования слов',
    'Используйте интервальное повторение для эффективного запоминания',
    'Не пропускайте дни — регулярность важнее длительности занятий',
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredDecks = selectedLanguage === 'all'
    ? decks
    : decks.filter(deck => deck.language === selectedLanguage);

  const streakDays = stats?.overview.streak_days || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Приветствие */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Добро пожаловать{user?.username ? `, ${user.username}` : ''}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Продолжайте изучать языки с помощью научно обоснованного метода интервального повторения
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={fetchData} disabled={refreshing} className="btn-secondary flex items-center">
              <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            <Link to="/study" className="btn-primary flex items-center px-6 py-3">
              <Brain className="h-5 w-5 mr-2" />
              Начать изучение
            </Link>
          </div>
        </div>
      </div>

      {/* Метод Лейтнера */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-blue-900 flex items-center">
              <Sparkles className="h-6 w-6 mr-2 text-blue-600" />
              🔁 Как работает метод Лейтнера?
            </h2>
            <p className="text-blue-700 mt-2">
              Ваш прогресс управляется системой интервального повторения, которая увеличивает интервалы
              для хорошо изученных карточек и сокращает их для забытых.
            </p>
          </div>
          <Link to="/about/method" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
            Подробнее <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {leitnerMethodSteps.map((step, index) => (
            <div key={index} className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-blue-100 hover:border-blue-300 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <step.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">{step.title}</h3>
                  <p className="text-sm text-blue-700 mt-1">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div><span>Карточки перемещаются между уровнями</span></div>
            <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div><span>Чем лучше знаете — тем реже повторяете</span></div>
            <div className="flex items-center"><div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div><span>Автоматический расчёт времени повторения</span></div>
          </div>
        </div>
      </div>

      {/* Быстрые действия и колоды */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Быстрые действия */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
            Быстрые действия
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.path} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all duration-200">
                <div className="flex items-start space-x-3">
                  <div className={`${action.color} p-2 rounded-lg`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Колоды */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
              Мои курсы ({filteredDecks.length})
            </h2>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Все языки</option>
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {filteredDecks.map(deck => (
              <div key={deck.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-100 text-primary-800 text-sm font-bold px-3 py-1 rounded-full">
                    {deck.language.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium">{deck.name}</h3>
                    <p className="text-sm text-gray-600">{deck.card_count || 0} карточек • {deck.due_count || 0} к повторению</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {(deck.due_count || 0) > 0 ? (
                    <Link to={`/study?deckId=${deck.id}`} className="btn-primary text-sm px-3 py-1">
                      Учить ({deck.due_count})
                    </Link>
                  ) : (deck.card_count || 0) > 0 ? (
                    <Link to={`/decks/${deck.id}/cards`} className="btn-secondary text-sm px-3 py-1">
                      Добавить карточки
                    </Link>
                  ) : (
                    <Link to={`/decks/${deck.id}/cards`} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      Начать заполнять
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {filteredDecks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {decks.length === 0 ? (
                  <>
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>У вас пока нет курсов</p>
                    <Link to="/decks/new" className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
                      Создать первый курс →
                    </Link>
                  </>
                ) : (
                  <p>Нет курсов на выбранном языке</p>
                )}
              </div>
            )}

            <Link to="/decks/new" className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
              <Plus className="h-5 w-5 mr-2" />
              Создать новый курс
            </Link>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <BarChart3 className="h-6 w-6 mr-2 text-primary-600" />
          Ваша статистика
        </h2>

        {/* Метрики — 3 карточки + streak виджет */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Streak — отдельный виджет */}
          <StreakWidget days={streakDays} />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Карточек к повторению</p>
                <p className="text-3xl font-bold">{stats?.overview.due_cards || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-sm text-gray-500">Готовы к изучению сегодня</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Точность</p>
                <p className="text-3xl font-bold">{stats?.overview.accuracy || 0}%</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="text-sm text-gray-500">За последние 7 дней</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Всего изучено</p>
                <p className="text-3xl font-bold">{stats?.overview.unique_cards || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="text-sm text-gray-500">Карточек в {decks.length} курсах</div>
          </div>
        </div>

        {/* График активности и советы */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {stats && stats.daily_stats.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                Активность за неделю
              </h2>
              <div className="space-y-4">
                {stats.daily_stats.slice(0, 7).map((day, index) => {
                  const date = new Date(day.date);
                  const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
                  const dayNumber = date.getDate();
                  return (
                    <div key={index} className="flex items-center">
                      <div className="w-20 text-sm text-gray-600">{dayName} {dayNumber}</div>
                      <div className="flex-1">
                        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-primary-500" style={{ width: `${(day.total / 20) * 100}%` }} />
                          <div className="absolute top-0 left-0 h-full bg-primary-300" style={{ width: `${(day.correct / 20) * 100}%` }} />
                        </div>
                      </div>
                      <div className="w-20 text-right text-sm">
                        <span className="font-medium">{day.total}</span>
                        <span className="text-gray-500 ml-1">карт.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex items-center space-x-4 text-sm">
                <div className="flex items-center"><div className="w-4 h-4 bg-primary-300 rounded mr-2"></div><span>Правильно</span></div>
                <div className="flex items-center"><div className="w-4 h-4 bg-primary-500 rounded mr-2"></div><span>Всего</span></div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <h2 className="text-xl font-bold mb-6 text-blue-900">💡 Советы по эффективному обучению</h2>
            <div className="space-y-4">
              {learningTips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-blue-800">{tip}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">Система интервального повторения</p>
                  <p className="text-sm text-blue-700">Научный метод для долгосрочного запоминания</p>
                </div>
                <Link to="/about/method" className="text-blue-600 hover:text-blue-800 font-medium text-sm">Узнать больше →</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Прогресс по языкам */}
        {stats && stats.language_stats.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Languages className="h-5 w-5 mr-2 text-primary-600" />
              Прогресс по языкам
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.language_stats.map((langStat, index) => {
                const language = languages.find(l => l.code === langStat.language);
                const accuracy = langStat.total_reviews > 0
                  ? Math.round((langStat.correct_reviews / langStat.total_reviews) * 100)
                  : 0;
                return (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">{language?.flag || '🌐'}</span>
                      <div>
                        <h3 className="font-bold">{language?.name || langStat.language}</h3>
                        <p className="text-sm text-gray-600">{langStat.total_cards} карточек</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Точность</span><span>{accuracy}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${accuracy}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-blue-50 rounded">
                          <div className="font-bold">{langStat.due_cards}</div>
                          <div className="text-xs text-gray-600">К повторению</div>
                        </div>
                        <div className="p-2 bg-green-50 rounded">
                          <div className="font-bold">{langStat.correct_reviews}</div>
                          <div className="text-xs text-gray-600">Правильных</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;