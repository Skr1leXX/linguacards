import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Globe, Key, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    username: '',
    language_preference: 'en',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        language_preference: user.language_preference || 'en',
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
    setProfileMessage(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
    setPasswordMessage(null);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const response = await api.put('/users/profile', profileForm);
      updateUser(response.data.user);
      setProfileMessage({
        type: 'success',
        text: 'Профиль успешно обновлен'
      });
    } catch (error: any) {
      setProfileMessage({
        type: 'error',
        text: error.response?.data?.error || 'Ошибка при обновлении профиля'
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'Пароли не совпадают'
      });
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: 'Пароль должен содержать минимум 6 символов'
      });
      setPasswordLoading(false);
      return;
    }

    try {
      await api.put('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setPasswordMessage({
        type: 'success',
        text: 'Пароль успешно изменен'
      });
      
      // Очищаем форму
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      setPasswordMessage({
        type: 'error',
        text: error.response?.data?.error || 'Ошибка при смене пароля'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>
        <p className="text-gray-600 mt-2">Управление вашими настройками</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая колонка - Основная информация */}
        <div className="lg:col-span-2 space-y-8">
          {/* Блок информации профиля */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary-600" />
              Основная информация
            </h2>
            
            {profileMessage && (
              <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
                profileMessage.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {profileMessage.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}
            
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Имя пользователя
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={profileForm.username}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Введите ваше имя"
                />
              </div>
              
              <div>
                <label htmlFor="language_preference" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  Предпочитаемый язык интерфейса
                </label>
                <select
                  id="language_preference"
                  name="language_preference"
                  value={profileForm.language_preference}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                </select>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Сохранение...
                    </div>
                  ) : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>

          {/* Блок смены пароля */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Key className="h-5 w-5 mr-2 text-primary-600" />
              Смена пароля
            </h2>
            
            {passwordMessage && (
              <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
                passwordMessage.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {passwordMessage.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}
            
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Текущий пароль
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Новый пароль
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Минимум 6 символов"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Подтверждение нового пароля
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Изменение...
                    </div>
                  ) : 'Сменить пароль'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Правая колонка - Информация об аккаунте */}
        <div className="space-y-8">
          {/* Информация об аккаунте */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-primary-600" />
              Информация об аккаунте
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-lg break-all">{user.email}</p>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Дата регистрации</p>
                <p className="font-medium">{formatDate(user.created_at)}</p>
              </div>
              
              {user.last_login && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Последний вход</p>
                  <p className="font-medium">{formatDate(user.last_login)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Статистика обучения */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary-600" />
              Статистика обучения
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Дней подряд</span>
                <span className="font-bold text-lg text-blue-600">0</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Всего изучено</span>
                <span className="font-bold text-lg text-green-600">0</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700">Точность</span>
                <span className="font-bold text-lg text-purple-600">0%</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-gray-700">К карточкам к повторению</span>
                <span className="font-bold text-lg text-yellow-600">0</span>
              </div>
            </div>
          </div>

          {/* Быстрые действия */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Быстрые действия</h2>
            <div className="space-y-3">
              <button 
                className="w-full text-left p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200"
                onClick={() => window.location.href = '/study'}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Начать изучение</span>
                  <div className="bg-primary-600 text-white text-xs px-2 py-1 rounded">0 карточек</div>
                </div>
              </button>
              
              <button 
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                onClick={() => window.location.href = '/decks'}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Управление курсами</span>
                  <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded">0 колод</div>
                </div>
              </button>
              
              <button 
                className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                onClick={() => window.location.href = '/stats'}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Просмотр статистики</span>
                  <span className="text-gray-500">→</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;