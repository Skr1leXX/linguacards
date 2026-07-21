import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  // ШАГ 1 — валидация и отправка кода на email
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      setError(emailValidation.message!);
      setLoading(false);
      return;
    }

    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.valid) {
      setError(usernameValidation.message!);
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.message!);
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/send-code', {
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
      setSuccess(`Код отправлен на ${formData.email}`);
      setStep('verify');
      startResendCooldown();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось отправить код. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  // ШАГ 2 — подтверждение кода и создание аккаунта
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        code,
      });
      await login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Неверный или истёкший код');
    } finally {
      setLoading(false);
    }
  };

  // Повторная отправка кода
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/send-code', {
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
      setSuccess('Новый код отправлен');
      startResendCooldown();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не удалось отправить код');
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ─── ШАГ 2: Ввод кода ──────────────────────────────────────────────────────
  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <ShieldCheck className="h-12 w-12 text-primary-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Подтвердите email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Мы отправили 6-значный код на{' '}
              <span className="font-medium text-gray-800">{formData.email}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleVerify}>
            <div>
              <label htmlFor="code" className="label">
                Код подтверждения
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''));
                  setError('');
                  setSuccess('');
                }}
                className="input text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="btn-primary w-full flex justify-center py-3 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  'Подтвердить и создать аккаунт'
                )}
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => { setStep('form'); setError(''); setSuccess(''); setCode(''); }}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              className="flex items-center gap-1 text-primary-600 hover:text-primary-500 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <RefreshCw className="h-4 w-4" />
              {resendCooldown > 0 ? `Отправить повторно (${resendCooldown}с)` : 'Отправить повторно'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── ШАГ 1: Форма регистрации ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <UserPlus className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Создать аккаунт
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Войдите
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                <Mail className="h-4 w-4 inline mr-1" />
                Email адрес
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="username" className="label">
                <User className="h-4 w-4 inline mr-1" />
                Имя пользователя
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="input"
                placeholder="Ваше имя"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                <Lock className="h-4 w-4 inline mr-1" />
                Пароль (минимум 6 символов)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                <Lock className="h-4 w-4 inline mr-1" />
                Подтверждение пароля
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex justify-center py-3"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                'Получить код подтверждения'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;