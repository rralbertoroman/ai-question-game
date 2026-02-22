'use client';

import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from '@/components/icons';

interface Props {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
}

export default function PasswordInput({ id, value, onChange, placeholder, required, error }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-2 pr-12 bg-gray-800 border rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white ${
          error ? 'border-red-500' : 'border-gray-700'
        }`}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  );
}
