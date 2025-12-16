// AppRoutes.tsx - ВЕРНУТЬ СТАРЫЙ ВАРИАНТ
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import DecksPage from '../pages/DecksPage';  
import DecksManagerPage from '../pages/DecksManagerPage';  
import StudyPage from '../pages/StudyPage';
import StatsPage from '../pages/StatsPage';
import ProfilePage from '../pages/ProfilePage';
import DeckDetailPage from '../pages/DeckDetailPage'; 
import CardEditorPage from '../pages/CardEditorPage';
import LanguagesPage from '../pages/LanguagesPage';
import Layout from '../components/layout/Layout';
import PrebuiltDecksPage from '../pages/PrebuiltDecksPage';
import PrebuiltDeckDetailPage from '../pages/PrebuiltDeckDetailPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Защищенные маршруты */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        {/* Этот элемент рендерится в Outlet Layout */}
        <Route index element={<DashboardPage />} />
        <Route path="decks" element={<DecksPage />} />  {/* ← старый роут */}
        <Route path="decks/new" element={<DeckDetailPage />} />
        <Route path="decks/:id" element={<DeckDetailPage />} />
        <Route path="decks/:id/cards" element={<CardEditorPage />} />
        <Route path="decks/:id/cards/new" element={<CardEditorPage />} />
        <Route path="study" element={<StudyPage />} />
        <Route path="study/:deckId" element={<StudyPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="languages" element={<LanguagesPage />} />
        <Route path="prebuilt-decks" element={<PrebuiltDecksPage />} />
        <Route path="/prebuilt-decks/:id" element={<PrebuiltDeckDetailPage />} />
      </Route>
      
      {/* Редирект на главную для несуществующих маршрутов */}
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
};

export default AppRoutes;