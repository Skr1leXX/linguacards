import { useState, useCallback } from 'react';
import { cardAPI, studyAPI } from '../services/api';
import type { Card, StudyStats, SessionCards } from '../types';

export const useStudy = () => {
  const [sessionCards, setSessionCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionCards = useCallback(async (deckId?: number, limit: number = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await studyAPI.getSessionCards(deckId, limit);
      setSessionCards(response.data.cards);
      setCurrentCardIndex(0);
      return response.data as SessionCards;
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке карточек для изучения');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (period: string = 'week') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await studyAPI.getStats(period);
      setStats(response.data);
      return response.data as StudyStats;
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке статистики');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reviewCard = useCallback(async (cardId: number, result: boolean) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await cardAPI.review(cardId, result);
      
      // Обновляем карточку в сессии
      setSessionCards(prev => prev.map(card => 
        card.id === cardId ? response.data.card : card
      ));
      
      // Переходим к следующей карточке
      setCurrentCardIndex(prev => prev + 1);
      
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении результата');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const nextCard = useCallback(() => {
    setCurrentCardIndex(prev => prev + 1);
  }, []);

  const prevCard = useCallback(() => {
    setCurrentCardIndex(prev => Math.max(0, prev - 1));
  }, []);

  const getCurrentCard = useCallback(() => {
    return sessionCards[currentCardIndex] || null;
  }, [sessionCards, currentCardIndex]);

  const hasNextCard = useCallback(() => {
    return currentCardIndex < sessionCards.length - 1;
  }, [currentCardIndex, sessionCards.length]);

  const hasPrevCard = useCallback(() => {
    return currentCardIndex > 0;
  }, [currentCardIndex]);

  const resetSession = useCallback(() => {
    setSessionCards([]);
    setCurrentCardIndex(0);
  }, []);

  return {
    sessionCards,
    currentCardIndex,
    stats,
    loading,
    error,
    fetchSessionCards,
    fetchStats,
    reviewCard,
    nextCard,
    prevCard,
    getCurrentCard,
    hasNextCard,
    hasPrevCard,
    resetSession,
  };
};