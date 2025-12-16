// api.ts - ВЕРНУТЬ СТАРЫЙ ВАРИАНТ
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Улучшенная обработка ошибок
    const errorMessage = error.response?.data?.error || 
                       error.response?.data?.message || 
                       error.message || 
                       'Ошибка сервера';
    
    return Promise.reject(new Error(errorMessage));
  }
);

// Типы для фильтров готовых колод
export interface PrebuiltDeckFilters {
  category?: string;
  language?: string;
  difficulty?: string;
  search?: string;
}

// Типы для ответов API готовых колод
export interface PrebuiltDeckData {
  decks: any[];
  categories: Array<{ id: string; name: string; deck_count: number }>;
  languages: Array<{ code: string; name: string; count: number }>;
  difficulties: Array<{ id: string; name: string; count: number }>;
  total: number;
}

// Общий тип ответа API
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status?: number;
}

// API функции - ВЕРНУТЬ deckAPI как было
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (email: string, username: string, password: string) => 
    api.post('/auth/register', { email, username, password }),
  
  getProfile: () => api.get('/auth/profile'),
};

export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (currentPassword: string, newPassword: string) => 
    api.put('/users/change-password', { currentPassword, newPassword }),
};

export const deckAPI = {  // ← ВЕРНУЛИ deckAPI
  getAll: () => api.get('/decks'),
  getById: (id: number) => api.get(`/decks/${id}`),
  create: (data: any) => api.post('/decks', data),
  update: (id: number, data: any) => api.put(`/decks/${id}`, data),
  delete: (id: number) => api.delete(`/decks/${id}`),
  export: (id: number, format: string = 'json') => 
    api.get(`/decks/${id}/export`, { params: { format } }),
};

export const cardAPI = {
  getByDeck: (deckId: number) => api.get(`/cards/deck/${deckId}`),
  getById: (id: number) => api.get(`/cards/${id}`),
  create: (deckId: number, data: any) => api.post(`/cards/deck/${deckId}`, data),
  update: (id: number, data: any) => api.put(`/cards/${id}`, data),
  delete: (id: number) => api.delete(`/cards/${id}`),
  review: (id: number, result: boolean) => api.post(`/cards/${id}/review`, { result }),
};

export const studyAPI = {
  getSessionCards: (deckId?: number, limit?: number) => 
    api.get('/study/session', { params: { deckId, limit } }),
  
  getStats: (period?: string) => 
    api.get('/study/stats', { params: { period } }),
  
  importCards: (deckId: number, cards: any[], format: string = 'json') => 
    api.post(`/study/import/${deckId}`, { cards, format }),
  
  exportCards: (deckId: number, format: string = 'json') => 
    api.get(`/study/export/${deckId}`, { 
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json'
    }),
  
  getPrebuiltDecks: (filters?: PrebuiltDeckFilters) => 
    api.get<ApiResponse<PrebuiltDeckData>>('/study/prebuilt-decks', { params: filters }),
  
  getPrebuiltDeckCards: (deckId: number) => 
    api.get(`/study/prebuilt-decks/${deckId}/cards`),
  
  addPrebuiltDeck: (deckId: number, data?: { custom_name?: string }) => 
    api.post(`/study/prebuilt-decks/${deckId}/add`, data),
};

export default api;