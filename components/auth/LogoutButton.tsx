'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/toast/useToast';

export default function LogoutButton() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      addToast('error', 'Error al cerrar sesión. Por favor, inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
    >
      {loading ? 'Cerrando sesión...' : 'Cerrar sesión'}
    </button>
  );
}
