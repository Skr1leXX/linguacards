import { useEffect } from 'react';

export const useDarkMode = () => {
  useEffect(() => {
    // Всегда светлая тема
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  return { isDark: false, toggle: () => {} };
};