'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginSchema } from '@/lib/utils/validation';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import PasswordInput from './PasswordInput';
import FieldError from './FieldError';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [formData, setFormData] = useState({
    email: '',
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
          setGeneralError(data.error || 'Login failed');
        }
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setGeneralError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {generalError && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
          {generalError}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={`w-full px-4 py-2 bg-gray-800 border rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white ${
            fieldErrors.email ? 'border-red-500' : 'border-gray-700'
          }`}
          required
        />
        <FieldError error={fieldErrors.email} />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          Password
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
        {loading ? 'Signing In...' : 'Sign In'}
      </button>

      <p className="text-center text-gray-400 text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-cyan-500 hover:text-cyan-400">
          Register
        </Link>
      </p>
    </form>
  );
}
