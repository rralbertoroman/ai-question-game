'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerSchema } from '@/lib/utils/validation';
import { useFieldErrors } from '@/hooks/useFieldErrors';
import PasswordInput from './PasswordInput';
import FieldError from './FieldError';
import PasswordRequirements from './PasswordRequirements';
import InlineError from '@/components/error/InlineError';
import { useToast } from '@/components/toast/useToast';

export default function RegisterForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const { fieldErrors, setFromZodIssues, setFieldError, clearFieldError, clearErrors } = useFieldErrors();

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
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      setFromZodIssues(result.error.issues);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setFromZodIssues(data.details);
        } else if (data.error === 'Username already taken') {
          setFieldError('username', 'Username already taken');
        } else if (data.error === 'Email already registered') {
          setFieldError('email', 'Email already registered');
        } else {
          setGeneralError(data.error || 'Registration failed');
        }
        return;
      }

      // Show success message if first user
      if (data.message?.includes('Admin')) {
        addToast('success', 'You are the first user and have been granted admin privileges!');
      }

      router.push('/');
      router.refresh();
    } catch {
      setGeneralError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InlineError message={generalError} onDismiss={() => setGeneralError('')} />

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
          Username
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
        <PasswordRequirements
          requirements={[
            { label: 'At least 8 characters', met: formData.password.length >= 8 },
          ]}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
          Confirm Password
        </label>
        <PasswordInput
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          required
          error={!!fieldErrors.confirmPassword}
        />
        <FieldError error={fieldErrors.confirmPassword} />
        {formData.confirmPassword.length > 0 && (
          <PasswordRequirements
            requirements={[
              {
                label: 'Passwords match',
                met: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0,
              },
            ]}
          />
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded transition-colors cursor-pointer"
      >
        {loading ? 'Creating Account...' : 'Register'}
      </button>

      <p className="text-center text-gray-400 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-cyan-500 hover:text-cyan-400">
          Sign in
        </Link>
      </p>
    </form>
  );
}
