import { useState, useCallback } from 'react';
import { deckAPI } from '../services/api';
import type { Deck } from '../types';

export const useDecks = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDecks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deckAPI.getAll();
      setDecks(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке колод');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createDeck = useCallback(async (deckData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deckAPI.create(deckData);
      setDecks(prev => [response.data.deck, ...prev]);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании колоды');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDeck = useCallback(async (id: number, deckData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deckAPI.update(id, deckData);
      setDecks(prev => prev.map(deck => 
        deck.id === id ? response.data.deck : deck
      ));
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении колоды');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDeck = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      await deckAPI.delete(id);
      setDecks(prev => prev.filter(deck => deck.id !== id));
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении колоды');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    decks,
    loading,
    error,
    fetchDecks,
    createDeck,
    updateDeck,
    deleteDeck,
  };
};