import { useState, useEffect } from 'react';
import {
  TrendingUp, Calendar, Target, Award, BarChart as BarChartIcon,
  Filter, PieChart, LineChart as LineChartIcon, Clock, RefreshCw, Globe
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
import { statsAPI } from '../services/api';
import type { StudyStats } from '../types';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title,
  Tooltip, Legend, PointElement, LineElement, ArcElement
);

// ─── Heatmap компонент ────────────────────────────────────────────────────────
interface HeatmapDay {
  date: string;
  total: number;
}

const ActivityHeatmap = ({ data }: { data: HeatmapDay[] }) => {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  // Строим карту дата → количество
  const countMap: Record<string, number> = {};
  data.forEach(d => { countMap[d.date] = d.total; });

  // Определяем максимум для интенсивности цвета
  const maxCount = Math.max(...data.map(d => d.total), 1);

  // Генерируем 365 дней от сегодня назад
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  // Дополняем до начала недели (чтобы сетка выровнялась)
  const firstDay = days[0];
  const startPad = firstDay.getDay(); // 0=вс, 1=пн...
  const paddedDays: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...days,
  ];

  // Разбиваем по неделям (колонки)
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  const toKey = (d: Date) => d.toISOString().split('T')[0];

  const getColor = (date: Date | null) => {
    if (!date) return 'transparent';
    const key = toKey(date);
    const count = countMap[key] || 0;
    if (count === 0) return '#ebedf0';
    const intensity = count / maxCount;
    if (intensity < 0.25) return '#9be9a8';
    if (intensity < 0.5)  return '#40c463';
    if (intensity < 0.75) return '#30a14e';
    return '#216e39';
  };

  const months = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  const weekDays = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

  // Метки месяцев — берём первую колонку каждого нового месяца
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, col) => {
    const firstReal = week.find(d => d !== null) as Date | undefined;
    if (firstReal && firstReal.getMonth() !== lastMonth) {
      lastMonth = firstReal.getMonth();
      monthLabels.push({ label: months[lastMonth], col });
    }
  });

  const CELL = 13;
  const GAP = 3;
  const STEP = CELL + GAP;
  const LEFT_PAD = 28;
  const TOP_PAD = 22;

  const svgWidth  = LEFT_PAD + weeks.length * STEP;
  const svgHeight = TOP_PAD + 7 * STEP;

  return (
    <div style={{ overflowX: 'auto', position: 'relative' }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        style={{ display: 'block', minWidth: svgWidth }}
      >
        {/* Метки месяцев */}
        {monthLabels.map(({ label, col }) => (
          <text
            key={label + col}
            x={LEFT_PAD + col * STEP}
            y={12}
            fontSize={11}
            fill="#57606a"
          >
            {label}
          </text>
        ))}

        {/* Метки дней недели */}
        {['','Пн','','Ср','','Пт',''].map((label, i) => (
          label ? (
            <text
              key={i}
              x={10}
              y={TOP_PAD + i * STEP + CELL - 2}
              fontSize={10}
              fill="#57606a"
              textAnchor="middle"
            >
              {label}
            </text>
          ) : null
        ))}

        {/* Ячейки */}
        {weeks.map((week, col) =>
          week.map((date, row) => {
            if (!date) return null;
            const key = toKey(date);
            const count = countMap[key] || 0;
            const x = LEFT_PAD + col * STEP;
            const y = TOP_PAD + row * STEP;
            return (
              <rect
                key={key}
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={2}
                fill={getColor(date)}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  const fmt = date.toLocaleDateString('ru-RU', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  });
                  setTooltip({
                    text: count > 0 ? `${count} повторений — ${fmt}` : `Нет активности — ${fmt}`,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })
        )}
      </svg>

      {/* Легенда */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: '#57606a' }}>
        <span>Меньше</span>
        {['#ebedf0','#9be9a8','#40c463','#30a14e','#216e39'].map(c => (
          <div key={c} style={{ width: 13, height: 13, borderRadius: 2, background: c }} />
        ))}
        <span>Больше</span>
      </div>

      {/* Тултип */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top: tooltip.y - 32,
          background: '#24292f',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: 6,
          fontSize: 12,
          pointerEvents: 'none',
          zIndex: 1000,
          whiteSpace: 'nowrap',
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

// ─── StatsPage ─────────────────────────────────────────────────────────────────
const StatsPage = () => {
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const [overviewResponse, dailyResponse, languagesResponse, heatmapResponse] = await Promise.all([
        statsAPI.getOverview(),
        statsAPI.getDailyStats(timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30),
        statsAPI.getLanguageStats(),
        statsAPI.getHeatmap ? statsAPI.getHeatmap() : Promise.resolve({ data: [] }),
      ]);

      setStats({
        overview: overviewResponse.data,
        daily_stats: dailyResponse.data,
        language_stats: languagesResponse.data,
      });
      setHeatmapData(heatmapResponse.data || []);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
      },
    ],
  };

  const languageChartData = {
    labels: stats?.language_stats?.map(lang => {
      const languages: Record<string, string> = {
        en: 'Английский', es: 'Испанский', de: 'Немецкий',
        fr: 'Французский', ru: 'Русский',
      };
      return languages[lang.language] || lang.language;
    }) || [],
    datasets: [{
      data: stats?.language_stats?.map(lang => lang.total_cards) || [],
      backgroundColor: [
        'rgba(59,130,246,0.8)', 'rgba(34,197,94,0.8)', 'rgba(249,115,22,0.8)',
        'rgba(168,85,247,0.8)', 'rgba(239,68,68,0.8)',
      ],
      borderColor: [
        'rgba(59,130,246,1)', 'rgba(34,197,94,1)', 'rgba(249,115,22,1)',
        'rgba(168,85,247,1)', 'rgba(239,68,68,1)',
      ],
      borderWidth: 1,
    }],
  };

  const accuracyChartData = {
    labels: stats?.daily_stats?.slice(0, 7).reverse().map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }) || [],
    datasets: [{
      label: 'Точность (%)',
      data: stats?.daily_stats?.slice(0, 7).reverse().map(day =>
        day.total > 0 ? Math.round((day.correct / day.total) * 100) : 0
      ) || [],
      borderColor: 'rgba(168,85,247,1)',
      backgroundColor: 'rgba(168,85,247,0.2)',
      tension: 0.4,
    }],
  };

  // Считаем суммарную активность за год
  const totalThisYear = heatmapData.reduce((sum, d) => sum + d.total, 0);
  const activeDays = heatmapData.filter(d => d.total > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Заголовок */}
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

      {/* Метрики */}
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
          <div className="text-sm text-gray-600">{stats?.overview.unique_decks || 0} курсов</div>
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
          <div className="text-sm text-gray-600">Готовы к изучению</div>
        </div>
      </div>

      {/* ── Heatmap ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Активность за год
          </h2>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>
              <span className="font-semibold text-gray-900">{totalThisYear}</span> повторений
            </span>
            <span>
              <span className="font-semibold text-gray-900">{activeDays}</span> активных дней
            </span>
          </div>
        </div>
        <ActivityHeatmap data={heatmapData} />
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { legend: { position: 'top' as const } },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <LineChartIcon className="h-5 w-5 mr-2 text-purple-500" />
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
                    beginAtZero: true, max: 100,
                    ticks: { callback: (v) => v + '%' },
                  },
                },
                plugins: { legend: { position: 'top' as const } },
              }}
            />
          </div>
        </div>
      </div>

      {/* Языки */}
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
                plugins: { legend: { position: 'right' as const } },
              }}
            />
          </div>
          <div className="space-y-4">
            {stats?.language_stats?.map((lang, index) => {
              const languageNames: Record<string, string> = {
                en: 'Английский', es: 'Испанский', de: 'Немецкий',
                fr: 'Французский', ru: 'Русский',
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
                    <div className="h-full bg-green-500" style={{ width: `${accuracy}%` }} />
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
          {[
            { label: 'Новичок', desc: 'Изучите 10 карточек', icon: Award, color: 'yellow', val: stats?.overview.unique_cards || 0, max: 10 },
            { label: 'Неделя практики', desc: '7 дней подряд', icon: Calendar, color: 'blue', val: stats?.overview.streak_days || 0, max: 7 },
            { label: 'Точность 90%+', desc: 'Достигните 90% точности', icon: Target, color: 'green', val: stats?.overview.accuracy || 0, max: 90 },
            { label: 'Полиглот', desc: '3 языка', icon: TrendingUp, color: 'purple', val: stats?.language_stats?.length || 0, max: 3 },
          ].map(({ label, desc, icon: Icon, color, val, max }) => (
            <div key={label} className="text-center p-4 border border-gray-200 rounded-lg">
              <div className={`w-16 h-16 bg-${color}-100 rounded-full flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`h-8 w-8 text-${color}-600`} />
              </div>
              <div className="font-medium">{label}</div>
              <div className="text-sm text-gray-600">{desc}</div>
              <div className="mt-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-${color}-500`}
                    style={{ width: `${Math.min(100, (val / max) * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{val}/{max}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default StatsPage;