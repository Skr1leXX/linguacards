import { useState } from 'react';
import { 
  Plus, Search, Filter, Grid, List, 
  Edit, Trash2, Download, Upload, 
  Globe, Lock, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DecksManagerPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  const decks = [
    {
      id: 1,
      name: 'Английские глаголы',
      language: 'en',
      description: '100 самых используемых английских глаголов',
      cardCount: 45,
      dueCards: 5,
      isPublic: false,
      lastStudied: '2024-01-15',
      progress: 75
    },
    {
      id: 2,
      name: 'Испанские существительные',
      language: 'es',
      description: 'Популярные существительные для начинающих',
      cardCount: 22,
      dueCards: 3,
      isPublic: true,
      lastStudied: '2024-01-14',
      progress: 45
    },
    {
      id: 3,
      name: 'Немецкие фразы',
      language: 'de',
      description: 'Полезные фразы для путешествий',
      cardCount: 15,
      dueCards: 4,
      isPublic: false,
      lastStudied: '2024-01-12',
      progress: 30
    },
    {
      id: 4,
      name: 'Французские прилагательные',
      language: 'fr',
      description: 'Описательные прилагательные',
      cardCount: 0,
      dueCards: 0,
      isPublic: false,
      lastStudied: null,
      progress: 0
    }
  ];

  const languages = [
    { code: 'all', name: 'Все языки' },
    { code: 'en', name: 'Английский' },
    { code: 'es', name: 'Испанский' },
    { code: 'de', name: 'Немецкий' },
    { code: 'fr', name: 'Французский' },
  ];

  const filteredDecks = decks.filter(deck => {
    const matchesSearch = deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deck.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = selectedLanguage === 'all' || deck.language === selectedLanguage;
    return matchesSearch && matchesLanguage;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Заголовок и действия */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Управление курсами</h1>
            <p className="text-gray-600 mt-2">
              Создавайте и организуйте карточки для изучения
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to="/decks/new" 
              className="btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Новый курс
            </Link>
          </div>
        </div>
      </div>

      {/* Панель управления */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск курсов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
            
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Список колод */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map(deck => (
            <div key={deck.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{deck.name}</h3>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className="flex items-center text-sm text-gray-600">
                      <Globe className="h-4 w-4 mr-1" />
                      {deck.language.toUpperCase()}
                    </span>
                    {deck.isPublic ? (
                      <span className="flex items-center text-sm text-green-600">
                        <Users className="h-4 w-4 mr-1" />
                        Публичная
                      </span>
                    ) : (
                      <span className="flex items-center text-sm text-gray-600">
                        <Lock className="h-4 w-4 mr-1" />
                        Приватная
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-500 hover:text-primary-600">
                    <Edit className="h-5 w-5" />
                  </button>
                  <button className="text-gray-500 hover:text-red-600">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">{deck.description}</p>
              
              <div className="space-y-4">
                {/* Прогресс */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Прогресс</span>
                    <span>{deck.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${deck.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">
                      Карточек: <span className="font-bold">{deck.cardCount}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      К повторению: <span className="font-bold text-primary-600">{deck.dueCards}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {deck.cardCount > 0 ? (
                      <Link 
                        to={`/study/${deck.id}`}
                        className="btn-primary text-sm px-4"
                      >
                        Учить
                      </Link>
                    ) : (
                      <Link 
                        to={`/decks/${deck.id}/cards`}
                        className="btn-secondary text-sm px-4"
                      >
                        Добавить карточки
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Карточка для создания новой колоды */}
          <Link 
            to="/decks/new"
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <div className="bg-primary-100 p-4 rounded-full mb-4">
              <Plus className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Создать новый курс</h3>
            <p className="text-gray-600 text-center">
              Начните собирать карточки для изучения нового языка
            </p>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Язык
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Карточек
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Прогресс
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDecks.map(deck => (
                <tr key={deck.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{deck.name}</div>
                      <div className="text-sm text-gray-500">{deck.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {deck.language.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{deck.cardCount}</div>
                    <div className="text-xs text-gray-500">{deck.dueCards} к повторению</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mr-3">
                        <div 
                          className="h-full bg-primary-500"
                          style={{ width: `${deck.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">{deck.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {deck.isPublic ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <Users className="h-4 w-4 mr-1" />
                        Публичная
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        <Lock className="h-4 w-4 mr-1" />
                        Приватная
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {deck.cardCount > 0 ? (
                        <Link 
                          to={`/study/${deck.id}`}
                          className="text-primary-600 hover:text-primary-900 font-medium text-sm"
                        >
                          Учить
                        </Link>
                      ) : (
                        <Link 
                          to={`/decks/${deck.id}/cards`}
                          className="text-gray-600 hover:text-gray-900 font-medium text-sm"
                        >
                          Добавить
                        </Link>
                      )}
                      <button className="text-gray-500 hover:text-primary-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-gray-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Инструменты */}
      <div className="mt-8 bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold mb-4">Инструменты для работы с курсами</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 bg-white border border-gray-300 rounded-lg hover:border-primary-400 hover:shadow-sm">
            <Upload className="h-5 w-5" />
            <span>Импорт из файла</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-white border border-gray-300 rounded-lg hover:border-primary-400 hover:shadow-sm">
            <Download className="h-5 w-5" />
            <span>Экспорт курса</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-white border border-gray-300 rounded-lg hover:border-primary-400 hover:shadow-sm">
            <Filter className="h-5 w-5" />
            <span>Фильтр и сортировка</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DecksManagerPage;