// api.ts
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    console.log('Data:', config.data);
    console.log('Headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('❌ Ошибка в запросе:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    console.log('Response data:', response.data);
    return response;
  },
  (error) => {
    console.error(`❌ ${error.response?.status || 'No status'} ${error.config?.url}`);
    console.error('Error response:', error.response?.data);
    console.error('Error message:', error.message);

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Ошибка сервера';

    return Promise.reject(new Error(errorMessage));
  }
);

export interface PrebuiltDeckFilters {
  category?: string;
  language?: string;
  difficulty?: string;
  search?: string;
}

export interface PrebuiltDeckData {
  decks: any[];
  categories: Array<{ id: string; name: string; deck_count: number }>;
  languages: Array<{ code: string; name: string; count: number }>;
  difficulties: Array<{ id: string; name: string; count: number }>;
  total: number;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status?: number;
}

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

export const deckAPI = {
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

export const statsAPI = {
  getOverview: () => api.get('/stats/overview'),
  getDailyStats: (days: number = 7) =>
    api.get('/stats/daily', { params: { days } }),
  getLanguageStats: () => api.get('/stats/languages'),
  getDeckStats: (deckId: number) => api.get(`/stats/deck/${deckId}`),
  // ── Heatmap — активность за 365 дней ──────────────────────────────────────
  getHeatmap: () => api.get('/stats/heatmap'),
};

export const studyAPI = {
  getSessionCards: (deckId?: number, limit?: number) =>
    api.get('/study/session', { params: { deckId, limit } }),

  getStats: (period?: string) => {
    switch (period) {
      case 'day':    return statsAPI.getDailyStats(1);
      case 'week':   return statsAPI.getDailyStats(7);
      case 'month':  return statsAPI.getDailyStats(30);
      case 'languages': return statsAPI.getLanguageStats();
      default:       return statsAPI.getOverview();
    }
  },

  importCards: (deckId: number, cards: any[], format: string = 'json') =>
    api.post(`/study/import/${deckId}`, { cards, format }),

  exportCards: (deckId: number, format: string = 'json') =>
    api.get(`/study/export/${deckId}`, {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json',
    }),

  getPrebuiltDecks: (filters?: PrebuiltDeckFilters) =>
    api.get<ApiResponse<PrebuiltDeckData>>('/study/prebuilt-decks', { params: filters }),

  getPrebuiltDeckCards: (deckId: number) =>
    api.get(`/study/prebuilt-decks/${deckId}/cards`),

  addPrebuiltDeck: (deckId: number, data?: { custom_name?: string }) =>
    api.post(`/study/prebuilt-decks/${deckId}/add`, data),
};

export default api;