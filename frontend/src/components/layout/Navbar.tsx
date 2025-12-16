// Navbar.tsx - ТОЛЬКО ВИЗУАЛЬНЫЕ ИЗМЕНЕНИЯ
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, BarChart3, User, LogOut, 
  Globe, ChevronDown, Settings, Menu, X,
  Library, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLanguageChange = (languageCode: string) => {
    console.log('Выбран язык:', languageCode);
    setShowLanguageDropdown(false);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Логотип и мобильное меню */}
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-gray-700"
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            
            <Link to="/" className="flex items-center space-x-2 text-primary-600 font-bold text-xl">
              <GraduationCap className="h-8 w-8" />
              <span className="hidden sm:inline">Spaced Repetition</span>
              <span className="sm:hidden">SR</span>
            </Link>
          </div>

          {/* Навигация для десктопа */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && (
              <>
                <Link to="/" className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
                  <Home className="h-5 w-5" />
                  <span>Главная</span>
                </Link>
                <Link to="/decks" className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
                  <BookOpen className="h-5 w-5" />
                  <span>Мои курсы</span>  {/* ← ИЗМЕНИЛИ ТЕКСТ */}
                </Link>
                <Link to="/prebuilt-decks" className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
                  <Library className="h-5 w-5" />
                  <span>Библиотека курсов</span>  {/* ← ИЗМЕНИЛИ ТЕКСТ */}
                </Link>
                <Link to="/study" className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
                  <GraduationCap className="h-5 w-5" />
                  <span>Учить</span>
                </Link>
                <Link to="/stats" className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
                  <BarChart3 className="h-5 w-5" />
                  <span>Статистика</span>
                </Link>

                {/* Выбор языка */}
                <div className="relative">
                  <button
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    <Globe className="h-5 w-5" />
                    <span>Язык</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {showLanguageDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {languages.map(language => (
                        <button
                          key={language.code}
                          onClick={() => handleLanguageChange(language.code)}
                          className="flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-gray-100"
                        >
                          <span className="text-xl">{language.flag}</span>
                          <span>{language.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Правая часть */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium">{user?.username || user?.email}</p>
                    <p className="text-xs text-gray-500">Уровень: Начинающий</p>
                  </div>
                </div>
                
                <Link to="/profile" className="hidden md:flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
                  <Settings className="h-5 w-5" />
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden md:inline">Выйти</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Войти
                </Link>
                <Link to="/register" className="btn-primary">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Мобильное меню */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {isAuthenticated && (
              <div className="space-y-2">
                <Link 
                  to="/" 
                  className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Home className="h-5 w-5" />
                  <span>Главная</span>
                </Link>
                <Link 
                  to="/decks" 
                  className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Мои курсы</span>  {/* ← ИЗМЕНИЛИ ТЕКСТ */}
                </Link>
                <Link 
                  to="/prebuilt-decks" 
                  className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Library className="h-5 w-5" />
                  <span>Библиотека курсов</span>  {/* ← ИЗМЕНИЛИ ТЕКСТ */}
                </Link>
                <Link 
                  to="/study" 
                  className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <GraduationCap className="h-5 w-5" />
                  <span>Учить</span>
                </Link>
                <Link 
                  to="/stats" 
                  className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Статистика</span>
                </Link>
                <Link 
                  to="/profile" 
                  className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="h-5 w-5" />
                  <span>Профиль</span>
                </Link>
                
                {/* Языки в мобильном меню */}
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-500 mb-2">Язык интерфейса</p>
                  <div className="flex flex-wrap gap-2">
                    {languages.map(language => (
                      <button
                        key={language.code}
                        onClick={() => {
                          handleLanguageChange(language.code);
                          setShowMobileMenu(false);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <span className="text-xl">{language.flag}</span>
                        <span className="text-sm">{language.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;