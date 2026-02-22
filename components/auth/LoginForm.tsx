'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginSchema } from '@/lib/utils/validation';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import PasswordInput from './PasswordInput';
import FieldError from './FieldError';
import InlineError from '@/components/error/InlineError';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const { fieldErrors, setFromZodIssues, clearFieldError, clearErrors } = useFieldErrors();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    clearErrors();
    setLoading(true);

    // Client-side validation
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      setFromZodIssues(result.error.issues);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setFromZodIssues(data.details);
        } else {
          setGeneralError(data.error || 'Error al iniciar sesión');
        }
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setGeneralError('Error de red. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InlineError message={generalError} onDismiss={() => setGeneralError('')} />

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
          Nombre de usuario
        </label>
        <input
          id="username"
          type="text"
          value={formData.username}
          onChange={(e) => handleChange('username', e.target.value)}
          className={`w-full px-4 py-2 bg-gray-800 border rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white ${
            fieldErrors.username ? 'border-red-500' : 'border-gray-700'
          }`}
          required
        />
        <FieldError error={fieldErrors.username} />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          Contraseña
        </label>
        <PasswordInput
          id="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          required
          error={!!fieldErrors.password}
        />
        <FieldError error={fieldErrors.password} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded transition-colors cursor-pointer"
      >
        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>

      <p className="text-center text-gray-400 text-sm">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-cyan-500 hover:text-cyan-400">
          Registrarse
        </Link>
      </p>
    </form>
  );
}
