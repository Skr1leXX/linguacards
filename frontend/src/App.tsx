import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { useDarkMode } from './hooks/useDarkMode';
import { ToastProvider } from './context/ToastContext';

function App() {
  const { isDark } = useDarkMode();

  return (
    <ToastProvider>
      <Router>
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <AppRoutes />
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;