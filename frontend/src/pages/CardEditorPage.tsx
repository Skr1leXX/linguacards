import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, ArrowLeft, Plus, Trash2, Copy, 
  Volume2, Image, Link, Hash,
  ChevronLeft, ChevronRight, Check,
  Upload, Download, AlertCircle, X,
  Eye, EyeOff
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useCards } from '../hooks/useCards';
import type { Card } from '../types';

const CardEditorPage = () => {
  const { id: deckId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [editingCard, setEditingCard] = useState<Partial<Card>>({
    front_text: '',
    back_text: '',
    example: '',
  });
  const [isEditing, setIsEditing] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFormat, setImportFormat] = useState('csv');
  
  const { 
    cards: loadedCards, 
    loading, 
    fetchCards, 
    createCard, 
    updateCard, 
    deleteCard,
    importCards,
    exportCards 
  } = useCards(deckId ? parseInt(deckId) : undefined);

  useEffect(() => {
    if (deckId) {
      fetchCards();
    }
  }, [deckId, fetchCards]);

  useEffect(() => {
    if (loadedCards.length > 0) {
      setCards(loadedCards);
      if (currentCardIndex >= loadedCards.length) {
        setCurrentCardIndex(Math.max(0, loadedCards.length - 1));
      }
    }
  }, [loadedCards]);

  useEffect(() => {
    if (cards.length > 0 && currentCardIndex < cards.length) {
      setEditingCard(cards[currentCardIndex]);
    } else {
      setEditingCard({
        front_text: '',
        back_text: '',
        example: '',
      });
    }
  }, [currentCardIndex, cards]);

  const handleCardChange = (field: keyof Card, value: string) => {
    setEditingCard(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCard = async () => {
    if (!editingCard.front_text?.trim() || !editingCard.back_text?.trim()) {
      setError('Передний и обратный текст обязательны');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingCard.id) {
        // Обновление существующей карточки
        await updateCard(editingCard.id, editingCard);
        setSuccess('Карточка обновлена');
      } else {
        // Создание новой карточки
        await createCard(editingCard);
        setSuccess('Карточка создана');
        setCurrentCardIndex(0); // Перейти к первой карточке
      }
      
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении карточки');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    setDeleting(cardId);
    
    try {
      await deleteCard(cardId);
      if (cards.length === 1) {
        // Если удалили последнюю карточку
        setEditingCard({
          front_text: '',
          back_text: '',
          example: '',
        });
      }
      setSuccess('Карточка удалена');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении карточки');
    } finally {
      setDeleting(null);
    }
  };

  const addNewCard = () => {
    setEditingCard({
      front_text: '',
      back_text: '',
      example: '',
    });
    setIsEditing(true);
  };

  const duplicateCard = () => {
    if (!editingCard.front_text || !editingCard.back_text) return;
    
    const duplicatedCard = {
      ...editingCard,
      id: undefined, // Убираем ID для создания новой карточки
    };
    
    setEditingCard(duplicatedCard);
    setSuccess('Карточка скопирована для редактирования');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleImport = async () => {
    if (!importText.trim()) {
      setError('Введите данные для импорта');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let cardsData = [];
      
      if (importFormat === 'csv') {
        // Парсинг CSV
        const lines = importText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        cardsData = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const card: any = {};
          
          headers.forEach((header, index) => {
            if (header === 'front' || header === 'front_text') {
              card.front_text = values[index] || '';
            } else if (header === 'back' || header === 'back_text') {
              card.back_text = values[index] || '';
            } else if (header === 'example') {
              card.example = values[index] || '';
            }
          });
          
          return card;
        }).filter(card => card.front_text && card.back_text);
      } else {
        // JSON формат
        try {
          cardsData = JSON.parse(importText);
          if (!Array.isArray(cardsData)) {
            throw new Error('Данные должны быть массивом карточек');
          }
        } catch (parseError) {
          setError('Неверный формат JSON');
          setSaving(false);
          return;
        }
      }

      if (cardsData.length === 0) {
        setError('Не найдено карточек для импорта');
        setSaving(false);
        return;
      }

      const result = await importCards(cardsData, importFormat);
      setSuccess(`Импортировано ${result.imported_count} карточек`);
      setShowImportModal(false);
      setImportText('');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Ошибка при импорте карточек');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!deckId || cards.length === 0) return;

    try {
      const data = await exportCards('csv');
      
      // Создаем и скачиваем файл
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deck_${deckId}_export.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('Карточки экспортированы в CSV файл');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Ошибка при экспорте карточек');
    }
  };

  if (loading && cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка карточек...</p>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок и навигация */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <RouterLink to={`/decks/${deckId}`} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-6 w-6" />
            </RouterLink>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Редактор карточек</h1>
              <p className="text-gray-600 mt-2">
                {cards.length > 0 
                  ? `${cards.length} карточек в курсе` 
                  : 'Создание карточек для изучения'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="btn-secondary flex items-center"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-5 w-5 mr-2" />
                  Редактировать
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5 mr-2" />
                  Предпросмотр
                </>
              )}
            </button>
          </div>
        </div>

        {/* Навигация по карточкам */}
        {cards.length > 0 && (
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
                  disabled={currentCardIndex === 0}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="font-medium">
                  Карточка {currentCardIndex + 1} из {cards.length}
                </span>
                <button
                  onClick={() => setCurrentCardIndex(Math.min(cards.length - 1, currentCardIndex + 1))}
                  disabled={currentCardIndex === cards.length - 1}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              
              <button
                onClick={addNewCard}
                className="btn-secondary flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Новая карточка
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={duplicateCard}
                disabled={!editingCard.front_text}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                <Copy className="h-4 w-4 mr-1" />
                Дублировать
              </button>
              
              {editingCard.id && (
                <button
                  onClick={() => editingCard.id && handleDeleteCard(editingCard.id)}
                  disabled={deleting === editingCard.id}
                  className="flex items-center text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {deleting === editingCard.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                      Удаление...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Удалить
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Редактор карточек */}
        {!showPreview ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-6">
                {editingCard.id ? 'Редактирование карточки' : 'Создание новой карточки'}
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Передняя сторона (вопрос) *
                  </label>
                  <div className="relative">
                    <textarea
                      value={editingCard.front_text || ''}
                      onChange={(e) => handleCardChange('front_text', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors min-h-[100px]"
                      placeholder="Введите слово, фразу или вопрос..."
                      rows={3}
                    />
                    <div className="absolute right-3 top-3 flex space-x-2">
                      <button className="text-gray-400 hover:text-gray-600" title="Добавить аудио">
                        <Volume2 className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600" title="Добавить изображение">
                        <Image className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Обратная сторона (ответ) *
                  </label>
                  <div className="relative">
                    <textarea
                      value={editingCard.back_text || ''}
                      onChange={(e) => handleCardChange('back_text', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors min-h-[100px]"
                      placeholder="Введите перевод или ответ..."
                      rows={3}
                    />
                    <div className="absolute right-3 top-3 flex space-x-2">
                      <button className="text-gray-400 hover:text-gray-600" title="Добавить аудио">
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Link className="h-4 w-4 inline mr-1" />
                    Пример использования (опционально)
                  </label>
                  <textarea
                    value={editingCard.example || ''}
                    onChange={(e) => handleCardChange('example', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors min-h-[80px]"
                    placeholder="Введите пример предложения с этим словом..."
                    rows={2}
                  />
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveCard}
                    disabled={saving || !editingCard.front_text?.trim() || !editingCard.back_text?.trim()}
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
                        {editingCard.id ? 'Сохранить изменения' : 'Создать карточку'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Список всех карточек */}
            {cards.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold mb-4">Все карточки ({cards.length})</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {cards.map((card, index) => (
                    <div
                      key={card.id}
                      onClick={() => {
                        setCurrentCardIndex(index);
                        setIsEditing(true);
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        index === currentCardIndex
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="font-medium mr-2">{index + 1}.</span>
                            <span className="font-bold text-gray-900">{card.front_text}</span>
                            <span className="mx-2 text-gray-400">→</span>
                            <span className="font-bold text-gray-900">{card.back_text}</span>
                          </div>
                          {card.example && (
                            <p className="text-sm text-gray-600 italic">"{card.example}"</p>
                          )}
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <span className="mr-3">Уровень: {card.difficulty_level + 1}/5</span>
                            <span>Повторений: {card.review_count}</span>
                          </div>
                        </div>
                        {index === currentCardIndex && (
                          <Check className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Предпросмотр карточки */
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="text-center">
              <div className="mb-6">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
                  Предпросмотр карточки
                </span>
                <div className="text-3xl font-bold text-gray-900 mb-4 p-6 bg-gray-50 rounded-lg min-h-[150px] flex items-center justify-center">
                  {editingCard.front_text || '(вопрос)'}
                </div>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Нажмите, чтобы увидеть ответ →
                </button>
              </div>
              
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 mb-2">Ответ:</h4>
                  <div className="text-2xl font-bold text-gray-900 mb-4 p-4 bg-green-50 rounded-lg min-h-[100px] flex items-center justify-center">
                    {editingCard.back_text || '(ответ)'}
                  </div>
                  
                  {editingCard.example && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Пример:</h4>
                      <p className="text-gray-700 italic p-3 bg-blue-50 rounded-lg">
                        "{editingCard.example}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Инструменты и действия */}
        <div className="space-y-6">
          {/* Инструменты импорта/экспорта */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold mb-4">Импорт/Экспорт</h3>
            <div className="space-y-4">
              <button
                onClick={() => setShowImportModal(true)}
                className="w-full btn-secondary flex items-center justify-center"
              >
                <Upload className="h-5 w-5 mr-2" />
                Импорт карточек
              </button>
              
              <button
                onClick={handleExport}
                disabled={cards.length === 0}
                className="w-full btn-secondary flex items-center justify-center disabled:opacity-50"
              >
                <Download className="h-5 w-5 mr-2" />
                Экспорт в CSV
              </button>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Формат CSV для импорта:</p>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
front,back,example\n
"to run","бегать","I run every morning."\n
"to eat","есть","We eat dinner at 7 PM."
                </pre>
              </div>
            </div>
          </div>

          {/* Советы по созданию карточек */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h3 className="font-bold text-blue-900 mb-4">💡 Советы по созданию карточек</h3>
            <ul className="space-y-3 text-blue-800">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Используйте конкретные примеры из реальной жизни</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Добавляйте контекст: не просто слова, а целые фразы</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Создавайте карточки постепенно, по 5-10 за раз</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Используйте систему интервального повторения для эффективного запоминания</span>
              </li>
            </ul>
          </div>

          {/* Быстрые действия */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold mb-4">Быстрые действия</h3>
            <div className="space-y-3">
              <RouterLink
                to={`/study?deckId=${deckId}`}
                className="block text-center px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Начать изучение этого курса
              </RouterLink>
              
              <button
                onClick={addNewCard}
                className="w-full text-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Добавить еще одну карточку
              </button>
              
              <RouterLink
                to={`/decks/${deckId}`}
                className="block text-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Вернуться к настройкам курса
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно импорта */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Импорт карточек</h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportText('');
                    setError(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">Вставьте данные карточек в формате CSV или JSON</p>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Формат данных
                </label>
                <select
                  value={importFormat}
                  onChange={(e) => setImportFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="csv">CSV (через запятую)</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Данные для импорта
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors min-h-[200px] font-mono text-sm"
                  placeholder={importFormat === 'csv' 
                    ? 'front,back,example\n"hello","привет","Hello world!"\n"goodbye","до свидания","Goodbye my friend"'
                    : '[\n  {"front_text": "hello", "back_text": "привет", "example": "Hello world!"},\n  {"front_text": "goodbye", "back_text": "до свидания", "example": "Goodbye my friend"}\n]'
                  }
                />
              </div>
              
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportText('');
                    setError(null);
                  }}
                  disabled={saving}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                >
                  Отмена
                </button>
                <button
                  onClick={handleImport}
                  disabled={saving || !importText.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Импорт...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Импортировать карточки
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardEditorPage;