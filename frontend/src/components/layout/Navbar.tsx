import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, BarChart3, LogOut,
  Library, GraduationCap, Plus,
  User, Settings, ChevronDown, Menu, X, Moon, Sun
} from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Закрываем дропдаун при клике вне него
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Закрываем мобильное меню при навигации
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path
      ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/30'
      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800';

  const navLinks = [
    { to: '/',              icon: Home,          label: 'Главная' },
    { to: '/decks',         icon: BookOpen,       label: 'Колоды' },
    { to: '/prebuilt-decks',icon: Library,        label: 'Библиотека' },
    { to: '/study',         icon: GraduationCap,  label: 'Учить' },
    { to: '/stats',         icon: BarChart3,       label: 'Статистика' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Логотип */}
          <Link to="/" className="flex items-center gap-2 text-primary-600 font-bold text-lg shrink-0">
            <GraduationCap className="h-7 w-7" />
            <span className="hidden sm:inline">LinguaCards</span>
          </Link>

          {/* Навигация — десктоп */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive(to)}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Правая часть */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Кнопка создать */}
                <Link
                  to="/decks/new"
                  className="hidden md:flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Создать
                </Link>

                {/* Тёмная тема */}
                <button
                  onClick={toggleDark}
                  title={isDark ? 'Светлая тема' : 'Тёмная тема'}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {/* Аватар + дропдаун */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-700">
                      {(user?.username || user?.email || '?')[0].toUpperCase()}
                    </div>
                    <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user?.username || user?.email}
                    </span>
                    <ChevronDown className={`hidden lg:block h-3.5 w-3.5 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.username || user?.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Settings className="h-4 w-4 text-gray-400" />
                        Настройки профиля
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Выйти
                      </button>
                    </div>
                  )}
                </div>

                {/* Бургер для мобайла */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm px-4 py-1.5">Войти</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-1.5">Регистрация</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Мобильное меню */}
      {showMobileMenu && isAuthenticated && (
        <div className="md:hidden border-t border-gray-200 bg-white py-2 px-4 space-y-1">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(to)}`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
          <Link
            to="/decks/new"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary-600 text-white"
          >
            <Plus className="h-5 w-5" />
            Создать колоду
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <User className="h-5 w-5" />
            Профиль
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Выйти
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;