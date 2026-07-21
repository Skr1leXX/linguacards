// frontend/src/utils/validation.ts
export const validateEmail = (email: string): { valid: boolean; message?: string } => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { valid: false, message: 'Email обязателен' };
  }
  
  if (!regex.test(email)) {
    return { valid: false, message: 'Введите корректный email' };
  }
  
  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password) {
    return { valid: false, message: 'Пароль обязателен' };
  }
  
  if (password.length < 6) {
    return { valid: false, message: 'Пароль должен содержать минимум 6 символов' };
  }
  
  return { valid: true };
};

export const validateUsername = (username: string): { valid: boolean; message?: string } => {
  if (!username) {
    return { valid: false, message: 'Имя пользователя обязательно' };
  }
  
  if (username.length < 2) {
    return { valid: false, message: 'Имя должно содержать минимум 2 символа' };
  }
  
  if (username.length > 50) {
    return { valid: false, message: 'Имя не должно превышать 50 символов' };
  }
  
  return { valid: true };
};

export const validateCard = (front: string, back: string): { valid: boolean; message?: string } => {
  if (!front.trim()) {
    return { valid: false, message: 'Передняя сторона карточки обязательна' };
  }
  
  if (!back.trim()) {
    return { valid: false, message: 'Задняя сторона карточки обязательна' };
  }
  
  return { valid: true };
};