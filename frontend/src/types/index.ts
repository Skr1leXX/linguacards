export interface User {
  id: number;
  email: string;
  username?: string;
  created_at: string;
  last_login?: string;
  language_preference: string;
}

export interface Deck {
  id: number;
  user_id: number;
  name: string;
  language: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  card_count?: number;
  due_count?: number;
}

export interface Card {
  id: number;
  deck_id: number;
  front_text: string;
  back_text: string;
  example?: string;
  difficulty_level: number;
  next_review_date: string;
  created_at: string;
  last_reviewed?: string;
  review_count: number;
  correct_count: number;
  is_due?: boolean;
  progress?: number;
}

export interface StudySessionCard extends Card {
  isFlipped?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface StudyResult {
  card_id: number;
  result: boolean;
}

export interface StatsOverview {
  total_reviews: number;
  correct_reviews: number;
  accuracy: number;
  unique_cards: number;
  unique_decks: number;
  due_cards: number;
  streak_days: number;
}

export interface DailyStats {
  date: string;
  total: number;
  correct: number;
}

export interface LanguageStat {
  language: string;
  total_cards: number;
  due_cards: number;
  total_reviews: number;
  correct_reviews: number;
}

export interface StudyStats {
  overview: StatsOverview;
  daily_stats: DailyStats[];
  language_stats: LanguageStat[];
}

export interface SessionCards {
  total_cards: number;
  cards: Card[];
}

// ДОБАВЛЕННЫЕ ТИПЫ ДЛЯ ИМПОРТА/ЭКСПОРТА
export interface ImportCardData {
  front_text: string;
  back_text: string;
  example?: string;
  tags?: string[];
}

export interface ImportRequest {
  cards: ImportCardData[];
  format?: 'json' | 'csv';
}

export interface ImportResponse {
  message: string;
  imported_count: number;
  error_count: number;
  errors?: Array<{
    index: number;
    error: string;
    data: ImportCardData;
  }>;
}

export interface ExportResponse {
  deck: {
    name: string;
    language: string;
    export_date: string;
  };
  cards: ImportCardData[];
}

export interface PrebuiltDeck {
  id: number;
  name: string;
  language: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  card_count: number;
  tags: string[];
  is_free: boolean;
  created_at: string;
  author?: string;
  popularity?: number; 
}

export interface PrebuiltCard {
  id: number;
  deck_id: number;
  front_text: string;
  back_text: string;
  example?: string;
  tags?: string[];
  phonetic?: string;
  audio_url?: string;
}

export interface PrebuiltDeckCategory {
  id: string; 
  name: string;
  description?: string;
  deck_count: number; 
}

export interface PrebuiltDeckFilters {
  category?: string;
  language?: string;
  difficulty?: string;
  search?: string;
}

export interface PrebuiltDecksResponse {
  decks: PrebuiltDeck[];
  total: number;
  categories: PrebuiltDeckCategory[];
  languages: Array<{ code: string; name: string; count: number }>;
  difficulties: Array<{ id: string; name: string; count: number }>;
}

export interface AddPrebuiltDeckRequest {
  deck_id: number;
  custom_name?: string;
  language_preference?: string;
}

// ТИПЫ ДЛЯ ТЕГОВ И КАТЕГОРИЙ
export interface Tag {
  id: number;
  name: string;
  color?: string;
  card_count?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  deck_count?: number;
}

// ТИПЫ ДЛЯ ПАГИНАЦИИ
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ТИПЫ ДЛЯ ПОИСКА И ФИЛЬТРОВ
export interface SearchFilters {
  language?: string;
  difficulty?: string;
  category?: string;
  tags?: string[];
  search?: string;
  is_public?: boolean;
}

// ТИПЫ ДЛЯ УВЕДОМЛЕНИЙ И НАПОМИНАНИЙ
export interface Notification {
  id: number;
  user_id: number;
  type: 'review_due' | 'streak' | 'achievement' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface Reminder {
  id: number;
  user_id: number;
  enabled: boolean;
  time: string; // HH:MM
  days: number[]; // 0-6 (Sunday-Saturday)
  last_sent?: string;
}

// ТИПЫ ДЛЯ АНАЛИТИКИ И РЕКОМЕНДАЦИЙ
export interface LearningAnalytics {
  best_time: string;
  avg_session_duration: number;
  preferred_language: string;
  weak_points: string[];
  recommendations: string[];
}

export interface ProgressGoal {
  id: number;
  user_id: number;
  title: string;
  target: number;
  current: number;
  unit: 'cards' | 'reviews' | 'days' | 'accuracy';
  deadline?: string;
  is_completed: boolean;
  created_at: string;
}

// ТИПЫ ДЛЯ ПРОФИЛЯ И НАСТРОЕК
export interface UserProfile extends User {
  bio?: string;
  avatar_url?: string;
  daily_goal: number;
  notification_settings: {
    email_reviews: boolean;
    email_achievements: boolean;
    push_reviews: boolean;
    push_achievements: boolean;
  };
  study_settings: {
    cards_per_session: number;
    show_examples: boolean;
    show_phonetics: boolean;
    enable_speech: boolean;
    difficulty_adjustment: boolean;
  };
}

// ТИПЫ ДЛЯ ФАЙЛОВ И ВЛОЖЕНИЙ
export interface MediaFile {
  id: number;
  card_id: number;
  type: 'image' | 'audio' | 'video';
  url: string;
  filename: string;
  size: number;
  created_at: string;
}

// ТИПЫ ДЛЯ СОЦИАЛЬНЫХ ФУНКЦИЙ
export interface UserActivity {
  id: number;
  user_id: number;
  type: 'deck_created' | 'card_added' | 'achievement_unlocked' | 'streak_milestone';
  data: Record<string, any>;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: number;
  username: string;
  avatar_url?: string;
  score: number;
  streak: number;
  accuracy: number;
  rank: number;
}