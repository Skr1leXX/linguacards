import { useState, useEffect } from 'react';
import { X, Upload, Download, FileText, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { deckAPI, studyAPI } from '../services/api';
import type { Deck, ImportCardData } from '../types';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck?: Deck;
  onImportSuccess?: () => void; 
}

const ImportExportModal = ({ isOpen, onClose, deck, onImportSuccess }: ImportExportModalProps) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importText, setImportText] = useState('');
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  // Сброс состояния при открытии/закрытии
  useEffect(() => {
    if (!isOpen) {
      setResult(null);
      setImportText('');
    }
  }, [isOpen]);

  const handleImport = async () => {
    if (!deck || !importText.trim()) return;
    
    setLoading(true);
    setResult(null);

    try {
      let cards: ImportCardData[] = [];
      
      if (importFormat === 'json') {
        cards = JSON.parse(importText);
      } else {
        // Парсинг CSV
        const lines = importText.trim().split('\n');
        if (lines.length === 0) {
          throw new Error('CSV файл пустой');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue; // Пропускаем пустые строки
          
          // Правильный парсинг CSV с учетом кавычек
          const values: string[] = [];
          let inQuotes = false;
          let currentValue = '';
          
          for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue.trim().replace(/^"|"$/g, ''));
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim().replace(/^"|"$/g, ''));
          
          const card: ImportCardData = {
            front_text: values[0] || '',
            back_text: values[1] || '',
            example: values[2] || undefined
          };
          cards.push(card);
        }
      }

      if (cards.length === 0) {
        throw new Error('Не найдено ни одной карточки для импорта');
      }

      const response = await studyAPI.importCards(deck.id, cards, importFormat);
      
      setResult({
        success: true,
        message: response.data.message,
        details: `Импортировано: ${response.data.imported_count}, Ошибок: ${response.data.error_count}`
      });
      
      setImportText('');
      
      // Вызываем коллбэк при успешном импорте
      if (onImportSuccess && response.data.imported_count > 0) {
        setTimeout(() => {
          onImportSuccess();
        }, 1000);
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Ошибка импорта',
        details: error.message || 'Неверный формат данных'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!deck) return;
    
    setLoading(true);
    setResult(null);

    try {
      // Используем правильный content type для разных форматов
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: exportFormat === 'csv' ? 'blob' as const : 'json' as const
      };

      let response;
      
      if (exportFormat === 'csv') {
        response = await studyAPI.exportCards(deck.id, exportFormat);
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${deck.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        response = await studyAPI.exportCards(deck.id, exportFormat);
        const dataStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${deck.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      
      setResult({
        success: true,
        message: 'Экспорт завершен успешно',
        details: 'Файл скачан на ваше устройство'
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Ошибка экспорта',
        details: error.message || 'Не удалось выполнить экспорт'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
      
      // Определяем формат по расширению файла
      if (file.name.toLowerCase().endsWith('.csv')) {
        setImportFormat('csv');
      } else if (file.name.toLowerCase().endsWith('.json')) {
        setImportFormat('json');
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Сброс input
  };

  const sampleJSON = `[
  {
    "front_text": "Hello",
    "back_text": "Привет",
    "example": "Hello, how are you?",
    "tags": ["приветствие", "базовое"]
  },
  {
    "front_text": "Goodbye",
    "back_text": "До свидания",
    "example": "Goodbye, see you tomorrow!",
    "tags": ["прощание"]
  }
]`;

  const sampleCSV = `front_text,back_text,example,tags
"Hello","Привет","Hello, how are you?","приветствие;базовое"
"Goodbye","До свидания","Goodbye, see you tomorrow!","прощание"`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">
              {deck ? `${deck.name} - ` : ''}
              {activeTab === 'import' ? 'Импорт карточек' : 'Экспорт карточек'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {activeTab === 'import' 
                ? 'Импортируйте карточки из файла или текста' 
                : 'Экспортируйте карточки для резервного копирования'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Табы */}
        <div className="border-b">
          <div className="flex">
            <button
              className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'import' ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('import')}
              disabled={loading}
            >
              <div className="flex items-center justify-center gap-2">
                <Upload className="h-4 w-4" />
                Импорт
              </div>
            </button>
            <button
              className={`flex-1 py-3 text-center font-medium transition-colors ${activeTab === 'export' ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('export')}
              disabled={loading}
            >
              <div className="flex items-center justify-center gap-2">
                <Download className="h-4 w-4" />
                Экспорт
              </div>
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'import' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Формат импорта
                </label>
                <div className="flex space-x-4">
                  <button
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${importFormat === 'json' ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:border-gray-400'}`}
                    onClick={() => setImportFormat('json')}
                    disabled={loading}
                  >
                    <FileJson className="h-4 w-4" />
                    <span>JSON</span>
                  </button>
                  <button
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${importFormat === 'csv' ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:border-gray-400'}`}
                    onClick={() => setImportFormat('csv')}
                    disabled={loading}
                  >
                    <FileText className="h-4 w-4" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Загрузить файл
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-1">Перетащите файл сюда или кликните для выбора</p>
                    <p className="text-sm text-gray-500">Поддерживаемые форматы: .json, .csv</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Или вставьте данные вручную
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={importFormat === 'json' ? sampleJSON : sampleCSV}
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
                  spellCheck={false}
                  disabled={loading}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">
                    Формат: {importFormat.toUpperCase()}
                  </p>
                  <button
                    type="button"
                    onClick={() => setImportText(importFormat === 'json' ? sampleJSON : sampleCSV)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    disabled={loading}
                  >
                    Загрузить пример
                  </button>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Формат данных:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>front_text</strong> - слово/фраза на иностранном языке (обязательно)</li>
                  <li>• <strong>back_text</strong> - перевод (обязательно)</li>
                  <li>• <strong>example</strong> - пример использования (опционально)</li>
                  <li>• <strong>tags</strong> - теги через точку с запятой или массив (опционально)</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Формат экспорта
                </label>
                <div className="flex space-x-4">
                  <button
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${exportFormat === 'json' ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:border-gray-400'}`}
                    onClick={() => setExportFormat('json')}
                    disabled={loading}
                  >
                    <FileJson className="h-4 w-4" />
                    <span>JSON</span>
                  </button>
                  <button
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${exportFormat === 'csv' ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:border-gray-400'}`}
                    onClick={() => setExportFormat('csv')}
                    disabled={loading}
                  >
                    <FileText className="h-4 w-4" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Что будет экспортировано:</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Название колоды: <strong>{deck?.name}</strong></li>
                  <li>• Язык: <strong>{deck?.language?.toUpperCase()}</strong></li>
                  <li>• Все карточки ({deck?.card_count || 0}) с переводом и примерами</li>
                  <li>• Дата экспорта</li>
                  <li>• Формат: <strong>{exportFormat.toUpperCase()}</strong></li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-900 mb-2">Использование экспортированных данных:</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• <strong>Резервное копирование</strong> ваших карточек</li>
                  <li>• <strong>Перенос</strong> в другие приложения для изучения языков</li>
                  <li>• <strong>Совместное использование</strong> с другими пользователями</li>
                  <li>• <strong>Импорт</strong> обратно в систему</li>
                </ul>
              </div>
            </div>
          )}

          {/* Результат операции */}
          {result && (
            <div className={`mt-4 p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} animate-fadeIn`}>
              <div className="flex items-start">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                )}
                <div className="flex-grow">
                  <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.message}
                  </p>
                  {result.details && (
                    <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result.details}
                    </p>
                  )}
                </div>
                {!loading && (
                  <button
                    onClick={() => setResult(null)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Футер с кнопками */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {activeTab === 'import' 
                ? `Карточек в колоде: ${deck?.card_count || 0}` 
                : `Экспорт: ${deck?.card_count || 0} карточек`
              }
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Отмена
              </button>
              <button
                onClick={activeTab === 'import' ? handleImport : handleExport}
                disabled={loading || (activeTab === 'import' && !importText.trim())}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Обработка...
                  </>
                ) : activeTab === 'import' ? (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Импортировать
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Экспортировать
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Добавим CSS анимацию
const styles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
`;

// Добавляем стили в документ
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

export default ImportExportModal;