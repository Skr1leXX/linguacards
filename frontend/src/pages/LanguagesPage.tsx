import { useState } from 'react';
import { 
  Globe, Check, Plus, BookOpen, 
  TrendingUp, Target, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LanguagesPage = () => {
  const [languages, setLanguages] = useState([
    {
      code: 'en',
      name: 'Английский',
      flag: '🇬🇧',
      level: 'Средний',
      progress: 75,
      cardsTotal: 145,
      cardsStudied: 108,
      streak: 14,
      active: true
    },
    {
      code: 'es',
      name: 'Испанский',
      flag: '🇪🇸',
      level: 'Начинающий',
      progress: 45,
      cardsTotal: 67,
      cardsStudied: 30,
      streak: 7,
      active: true
    },
    {
      code: 'de',
      name: 'Немецкий',
      flag: '🇩🇪',
      level: 'Начинающий',
      progress: 30,
      cardsTotal: 42,
      cardsStudied: 13,
      streak: 3,
      active: false
    },
    {
      code: 'fr',
      name: 'Французский',
      flag: '🇫🇷',
      level: 'Не начат',
      progress: 0,
      cardsTotal: 0,
      cardsStudied: 0,
      streak: 0,
      active: false
    },
  ]);

  const availableLanguages = [
    { code: 'it', name: 'Итальянский', flag: '🇮🇹' },
    { code: 'pt', name: 'Португальский', flag: '🇵🇹' },
    { code: 'ja', name: 'Японский', flag: '🇯🇵' },
    { code: 'ko', name: 'Корейский', flag: '🇰🇷' },
    { code: 'zh', name: 'Китайский', flag: '🇨🇳' },
    { code: 'ar', name: 'Арабский', flag: '🇸🇦' },
  ];

  const toggleLanguage = (code: string) => {
    setLanguages(languages.map(lang => 
      lang.code === code ? { ...lang, active: !lang.active } : lang
    ));
  };

  const addLanguage = (language: { code: string, name: string, flag: string }) => {
    if (!languages.some(l => l.code === language.code)) {
      setLanguages([
        ...languages,
        {
          ...language,
          level: 'Не начат',
          progress: 0,
          cardsTotal: 0,
          cardsStudied: 0,
          streak: 0,
          active: true
        }
      ]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Языки изучения</h1>
        <p className="text-gray-600 mt-2">
          Управляйте языками, которые вы изучаете, и отслеживайте прогресс
        </p>
      </div>

      {/* Активные языки */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Активные языки
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {languages.filter(l => l.active).map(language => (
            <div key={language.code} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{language.flag}</span>
                  <div>
                    <h3 className="font-bold text-lg">{language.name}</h3>
                    <p className="text-sm text-gray-600">{language.level}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleLanguage(language.code)}
                  className="text-green-600 hover:text-green-700"
                >
                  <Check className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Общий прогресс</span>
                    <span>{language.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${language.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-bold text-lg">{language.cardsStudied}</div>
                    <div className="text-xs text-gray-600">Изучено</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{language.streak}</div>
                    <div className="text-xs text-gray-600">Дней подряд</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{language.cardsTotal}</div>
                    <div className="text-xs text-gray-600">Всего карт</div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link 
                    to={`/study?language=${language.code}`}
                    className="flex-1 btn-primary text-sm"
                  >
                    Учить
                  </Link>
                  <Link 
                    to={`/decks?language=${language.code}`}
                    className="flex-1 btn-secondary text-sm"
                  >
                    Колоды
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Добавить новые языки */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-6">Добавить новые языки</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {availableLanguages.map(language => {
            const isAdded = languages.some(l => l.code === language.code);
            return (
              <button
                key={language.code}
                onClick={() => !isAdded && addLanguage(language)}
                disabled={isAdded}
                className={`p-4 border rounded-xl flex flex-col items-center justify-center transition-all ${
                  isAdded
                    ? 'border-green-300 bg-green-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                }`}
              >
                <span className="text-3xl mb-2">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                {isAdded && (
                  <span className="text-xs text-green-600 mt-1">Добавлен</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Статистика по языкам */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-6">Статистика по языкам</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Язык</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Уровень</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Прогресс</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Карточек</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Точность</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {languages.filter(l => l.active).map(language => (
                <tr key={language.code}>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{language.flag}</span>
                      <span className="font-medium">{language.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {language.level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-32">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{language.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-500"
                          style={{ width: `${language.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div>{language.cardsStudied} изучено</div>
                      <div className="text-gray-500">из {language.cardsTotal}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-green-500 mr-2" />
                      <span className="font-medium">85%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <Link 
                        to={`/study?language=${language.code}`}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      >
                        Учить
                      </Link>
                      <Link 
                        to={`/decks/new?language=${language.code}`}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                      >
                        Добавить
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LanguagesPage;