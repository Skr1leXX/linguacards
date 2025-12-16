import { useState, useCallback } from 'react';
import { cardAPI, studyAPI } from '../services/api';
import type { Card } from '../types';

export const useCards = (deckId?: number) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    if (!deckId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await cardAPI.getByDeck(deckId);
      setCards(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке карточек');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  const createCard = useCallback(async (cardData: any) => {
    if (!deckId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await cardAPI.create(deckId, cardData);
      setCards(prev => [response.data.card, ...prev]);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании карточки');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  const updateCard = useCallback(async (cardId: number, cardData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await cardAPI.update(cardId, cardData);
      setCards(prev => prev.map(card => 
        card.id === cardId ? response.data.card : card
      ));
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении карточки');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCard = useCallback(async (cardId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      await cardAPI.delete(cardId);
      setCards(prev => prev.filter(card => card.id !== cardId));
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении карточки');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const importCards = useCallback(async (cardsData: any[], format: string = 'json') => {
    if (!deckId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await studyAPI.importCards(deckId, cardsData, format);
      if (response.data.imported_count > 0) {
        await fetchCards(); // Обновляем список
      }
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Ошибка при импорте карточек');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [deckId, fetchCards]);

  const exportCards = useCallback(async (format: string = 'json') => {
    if (!deckId) return;
    
    try {
      const response = await studyAPI.exportCards(deckId, format);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Ошибка при экспорте карточек');
      throw err;
    }
  }, [deckId]);

  return {
    cards,
    loading,
    error,
    fetchCards,
    createCard,
    updateCard,
    deleteCard,
    importCards,
    exportCards,
  };
};