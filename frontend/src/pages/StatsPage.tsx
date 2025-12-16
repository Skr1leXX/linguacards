// frontend/src/pages/StatsPage.tsx
import { useState, useEffect } from 'react';
import { 
  TrendingUp, Calendar, Target, Award, BarChart as BarChartIcon,
  Download, Filter, PieChart, LineChart, Clock, CheckCircle, XCircle,
  RefreshCw, Globe
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { studyAPI } from '../services/api';
import type { StudyStats } from '../types';

// Регистрация компонентов Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

const StatsPage = () => {
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const response = await studyAPI.getStats(timeRange);
      setStats(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Данные для графика активности
  const activityChartData = {
    labels: stats?.daily_stats?.slice(0, 7).reverse().map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    }) || [],
    datasets: [
      {
        label: 'Правильно',
        data: stats?.daily_stats?.slice(0, 7).reverse().map(day => day.correct) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Всего',
        data: stats?.daily_stats?.slice(0, 7).reverse().map(day => day.total) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      }
    ]
  };

  // Данные для круговой диаграммы по языкам
  const languageChartData = {
    labels: stats?.language_stats?.map(lang => {
      const languages: Record<string, string> = {
        'en': 'Английский',
        'es': 'Испанский',
        'de': 'Немецкий',
        'fr': 'Французский',
        'ru': 'Русский'
      };
      return languages[lang.language] || lang.language;
    }) || [],
    datasets: [
      {
        data: stats?.language_stats?.map(lang => lang.total_cards) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1,
      }
    ]
  };

  // Данные для линейного графика прогресса
  const accuracyChartData = {
    labels: stats?.daily_stats?.slice(0, 7).reverse().map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }) || [],
    datasets: [
      {
        label: 'Точность (%)',
        data: stats?.daily_stats?.slice(0, 7).reverse().map(day => 
          day.total > 0 ? Math.round((day.correct / day.total) * 100) : 0
        ) || [],
        borderColor: 'rgba(168, 85, 247, 1)',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        tension: 0.4,
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Заголовок и фильтры */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Статистика обучения</h1>
            <p className="text-gray-600 mt-2">
              Анализ вашего прогресса с использованием системы интервального повторения
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="day">За день</option>
                <option value="week">За неделю</option>
                <option value="month">За месяц</option>
                <option value="year">За год</option>
              </select>
            </div>
            <button
              onClick={fetchStats}
              disabled={refreshing}
              className="btn-secondary flex items-center px-4 py-2"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Обновить
            </button>
          </div>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Всего изучено</p>
              <p className="text-3xl font-bold">{stats?.overview.unique_cards || 0}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-lg">
              <Award className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {stats?.overview.unique_decks || 0} курсов
          </div>
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
          <div className="text-sm text-gray-600">
            {stats?.overview.correct_reviews || 0} / {stats?.overview.total_reviews || 0} правильных
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Дней подряд</p>
              <p className="text-3xl font-bold">{stats?.overview.streak_days || 0}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>Серия активных дней</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">К повторению</p>
              <p className="text-3xl font-bold">{stats?.overview.due_cards || 0}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Готовы к изучению
          </div>
        </div>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* График активности */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <BarChartIcon className="h-5 w-5 mr-2 text-blue-500" />
            Активность за неделю
          </h2>
          <div className="h-72">
            <Bar
              data={activityChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                }
              }}
            />
          </div>
        </div>

        {/* Точность по дням */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <LineChart className="h-5 w-5 mr-2 text-purple-500" />
            Динамика точности
          </h2>
          <div className="h-72">
            <Line
              data={accuracyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      }
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Распределение по языкам */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <Globe className="h-5 w-5 mr-2 text-green-500" />
            Распределение по языкам
          </h2>
          <PieChart className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-64">
            <Pie
              data={languageChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right' as const,
                  },
                }
              }}
            />
          </div>
          
          <div className="space-y-4">
            {stats?.language_stats?.map((lang, index) => {
              const languageNames: Record<string, string> = {
                'en': 'Английский',
                'es': 'Испанский',
                'de': 'Немецкий',
                'fr': 'Французский',
                'ru': 'Русский'
              };
              const accuracy = lang.total_reviews > 0 
                ? Math.round((lang.correct_reviews / lang.total_reviews) * 100)
                : 0;
              
              return (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">{languageNames[lang.language] || lang.language}</div>
                    <div className="text-sm text-gray-600">{lang.total_cards} карточек</div>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Точность: {accuracy}%</span>
                    <span className="text-gray-600">{lang.correct_reviews}/{lang.total_reviews}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${accuracy}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>К повторению: {lang.due_cards}</span>
                    <span>Всего повторений: {lang.total_reviews}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Достижения */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Достижения</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="font-medium">Новичок</div>
            <div className="text-sm text-gray-600">Изучите 10 карточек</div>
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500" 
                  style={{ 
                    width: `${Math.min(100, ((stats?.overview.unique_cards || 0) / 10) * 100)}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats?.overview.unique_cards || 0}/10
              </div>
            </div>
          </div>

          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="font-medium">Неделя практики</div>
            <div className="text-sm text-gray-600">7 дней подряд</div>
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ 
                    width: `${Math.min(100, ((stats?.overview.streak_days || 0) / 7) * 100)}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats?.overview.streak_days || 0}/7 дней
              </div>
            </div>
          </div>

          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <div className="font-medium">Точность 90%+</div>
            <div className="text-sm text-gray-600">Достигните 90% точности</div>
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ 
                    width: `${Math.min(100, (stats?.overview.accuracy || 0) * 100 / 90)}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats?.overview.accuracy || 0}% / 90%
              </div>
            </div>
          </div>

          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="font-medium">Полиглот</div>
            <div className="text-sm text-gray-600">3 языка</div>
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500" 
                  style={{ 
                    width: `${Math.min(100, ((stats?.language_stats?.length || 0) / 3) * 100)}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats?.language_stats?.length || 0}/3 языка
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;