import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, ArrowLeft, Globe, Lock, Users, 
  Tag, Hash, FileText, Settings,
  Trash2, AlertCircle, Check, X,
  Download, Upload, Import, FileJson, FileSpreadsheet // ДОБАВЛЕНО
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { deckAPI } from '../services/api';
import type { Deck } from '../types';
import ImportExportModal from '../components/ImportExportModal'; // ДОБАВЛЕНО

const DeckDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewDeck = id === 'new';
  
  const [deck, setDeck] = useState<Partial<Deck>>({
    name: '',
    language: 'en',
    description: '',
    is_public: false,
  });
  
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false); // ДОБАВЛЕНО
  const [deckStats, setDeckStats] = useState<{ // ДОБАВЛЕНО
    total_cards: number;
    due_cards: number;
    last_studied?: string;
  } | null>(null);

  const languages = [
    { code: 'en', name: 'Английский', flag: '🇬🇧' },
    { code: 'es', name: 'Испанский', flag: '🇪🇸' },
    { code: 'de', name: 'Немецкий', flag: '🇩🇪' },
    { code: 'fr', name: 'Французский', flag: '🇫🇷' },
    { code: 'it', name: 'Итальянский', flag: '🇮🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ];

  useEffect(() => {
    if (!isNewDeck && id) {
      fetchDeck();
      fetchDeckStats(); // ДОБАВЛЕНО
    }
  }, [id, isNewDeck]);

  const fetchDeck = async () => {
    if (!id || isNewDeck) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await deckAPI.getById(parseInt(id));
      setDeck(response.data);
      // TODO: Загрузка тегов когда будет API для тегов
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке курса');
    } finally {
      setLoading(false);
    }
  };

  // ДОБАВЛЕНО: Функция для получения статистики колоды
  const fetchDeckStats = async () => {
    if (!id || isNewDeck) return;
    
    try {
      // Временная заглушка - в реальном приложении нужно добавить API для статистики колоды
      const response = await deckAPI.getById(parseInt(id));
      const deckData = response.data;
      
      setDeckStats({
        total_cards: deckData.card_count || 0,
        due_cards: deckData.due_count || 0,
        last_studied: deckData.last_studied
      });
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
    }
  };

  const handleSave = async () => {
    if (!deck.name?.trim()) {
      setError('Название курса обязательно');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (isNewDeck) {
        const response = await deckAPI.create(deck);
        setSuccess('Курс успешно создан!');
        setTimeout(() => {
          navigate(`/decks/${response.data.deck.id}`);
        }, 1500);
      } else if (id) {
        const response = await deckAPI.update(parseInt(id), deck);
        setSuccess('Колода успешно обновлена!');
        setDeck(response.data.deck);
        fetchDeckStats(); // Обновляем статистику после сохранения
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении колоды');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNewDeck) return;
    
    setSaving(true);
    
    try {
      await deckAPI.delete(parseInt(id));
      navigate('/decks');
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении курса');
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  // ДОБАВЛЕНО: Обработка успешного импорта
  const handleImportSuccess = () => {
    setSuccess('Карточки успешно импортированы!');
    fetchDeckStats(); // Обновляем статистику после импорта
    setTimeout(() => setSuccess(null), 3000);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // ДОБАВЛЕНО: Функция для экспорта напрямую (без модального окна)
  const handleQuickExport = async () => {
    if (!id || isNewDeck) return;
    
    try {
      const response = await deckAPI.export(parseInt(id), 'json');
      
      // Создаем и скачиваем файл
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deck.name?.replace(/\s+/g, '_') || 'deck'}_export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Курс успешно экспортирован!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError('Ошибка при экспорте курса: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка курса...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок и действия */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/decks" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isNewDeck ? 'Создание нового курса' : `Редактирование: ${deck.name}`}
              </h1>
              <p className="text-gray-600 mt-2">
                {isNewDeck 
                  ? 'Заполните информацию о новом курсе карточек'
                  : 'Измените настройки и информацию о курсе'
                }
              </p>
            </div>
          </div>
          
          {!isNewDeck && (
            <div className="flex items-center space-x-3">
              {/* ДОБАВЛЕНО: Кнопки быстрого доступа */}
              <button
                onClick={handleQuickExport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                title="Экспортировать курс"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Экспорт</span>
              </button>
              
              <button
                onClick={() => setShowImportExportModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                title="Импорт карточек"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Импорт</span>
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 flex items-center px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Удалить</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Сообщения об ошибках/успехе */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <Check className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Основная форма */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary-600" />
              Основная информация
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название колоды *
                </label>
                <input
                  type="text"
                  value={deck.name || ''}
                  onChange={(e) => setDeck({ ...deck, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Например: Английские глаголы"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Язык изучения *
                </label>
                <select
                  value={deck.language || 'en'}
                  onChange={(e) => setDeck({ ...deck, language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={deck.description || ''}
                  onChange={(e) => setDeck({ ...deck, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors min-h-[120px]"
                  placeholder="Опишите, что содержит этот курс..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Теги */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Tag className="h-5 w-5 mr-2 text-primary-600" />
              Теги и категории
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Добавить тег
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Например: глаголы, путешествия, бизнес"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Добавить
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Текущие теги
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.length === 0 ? (
                    <p className="text-gray-500">Теги еще не добавлены</p>
                  ) : (
                    tags.map(tag => (
                      <div
                        key={tag}
                        className="inline-flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                      >
                        <Hash className="h-3 w-3 mr-1" />
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-gray-500 hover:text-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Настройки и действия */}
        <div className="space-y-6">
          {/* Статистика колоды (ДОБАВЛЕНО) */}
          {!isNewDeck && deckStats && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2 text-blue-600" />
                Статистика
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-blue-800">Всего карточек</p>
                    <p className="text-2xl font-bold text-blue-900">{deckStats.total_cards}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="text-sm text-orange-800">К повторению</p>
                    <p className="text-2xl font-bold text-orange-900">{deckStats.due_cards}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>
                
                {deckStats.last_studied && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-green-800">Последнее изучение</p>
                      <p className="text-lg font-bold text-green-900">
                        {new Date(deckStats.last_studied).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <Check className="h-8 w-8 text-green-500" />
                  </div>
                )}
                
                {/* ДОБАВЛЕНО: Быстрые действия */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowImportExportModal(true)}
                      className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Import className="h-5 w-5 text-blue-600 mb-1" />
                      <span className="text-sm font-medium">Импорт</span>
                    </button>
                    
                    <button
                      onClick={handleQuickExport}
                      className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FileJson className="h-5 w-5 text-green-600 mb-1" />
                      <span className="text-sm font-medium">Экспорт</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Настройки */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-primary-600" />
              Настройки
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    {deck.is_public ? (
                      <Users className="h-5 w-5 mr-3 text-green-600" />
                    ) : (
                      <Lock className="h-5 w-5 mr-3 text-gray-600" />
                    )}
                    <div>
                      <span className="font-medium">Публичный курс</span>
                      <p className="text-sm text-gray-600">
                        {deck.is_public 
                          ? 'Доступна другим пользователям' 
                          : 'Только для вас'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={deck.is_public || false}
                      onChange={(e) => setDeck({ ...deck, is_public: e.target.checked })}
                      className="sr-only"
                    />
                    <div 
                      className={`block w-14 h-8 rounded-full ${deck.is_public ? 'bg-green-500' : 'bg-gray-300'}`}
                      onClick={() => setDeck({ ...deck, is_public: !deck.is_public })}
                    ></div>
                    <div 
                      className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${deck.is_public ? 'transform translate-x-6' : ''}`}
                      onClick={() => setDeck({ ...deck, is_public: !deck.is_public })}
                    ></div>
                  </div>
                </label>
              </div>
              
              {!isNewDeck && deck.created_at && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-medium mb-2">Информация о курсе</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Создан:</span>
                      <span>{new Date(deck.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                    {deck.card_count !== undefined && (
                      <div className="flex justify-between">
                        <span>Карточек:</span>
                        <span>{deck.card_count}</span>
                      </div>
                    )}
                    {deck.due_count !== undefined && (
                      <div className="flex justify-between">
                        <span>К повторению:</span>
                        <span className="text-primary-600">{deck.due_count}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <button
                onClick={handleSave}
                disabled={saving || !deck.name?.trim()}
                className="w-full btn-primary flex items-center justify-center py-3"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    {isNewDeck ? 'Создать курс' : 'Сохранить изменения'}
                  </>
                )}
              </button>
              
              {!isNewDeck && (
                <>
                  <Link
                    to={`/decks/${id}/cards`}
                    className="block w-full text-center px-4 py-3 bg-primary-50 text-primary-700 rounded-lg font-medium hover:bg-primary-100 transition-colors"
                  >
                    Перейти к карточкам
                  </Link>
                  
                  <button
                    onClick={() => setShowImportExportModal(true)}
                    className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-primary-300 text-primary-700 rounded-lg font-medium hover:bg-primary-50 transition-colors"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Импорт карточек
                  </button>
                  
                  <button
                    onClick={handleQuickExport}
                    className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-green-300 text-green-700 rounded-lg font-medium hover:bg-green-50 transition-colors"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Экспорт курса
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно подтверждения удаления */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Удалить колоду?</h3>
                <p className="text-gray-600 mt-1">Это действие нельзя отменить. Все карточки в курсе также будут удалены.</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={saving}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Удаление...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить курс
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ДОБАВЛЕНО: Модальное окно импорта/экспорта */}
      {!isNewDeck && id && (
        <ImportExportModal
          isOpen={showImportExportModal}
          onClose={() => setShowImportExportModal(false)}
          deck={deck as Deck}
          onImportSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
};

export default DeckDetailPage;