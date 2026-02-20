import RegisterForm from '@/components/auth/RegisterForm';
import { BrainIcon } from '@/components/icons';

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div className="text-center mb-8">
        <BrainIcon size={48} className="mx-auto mb-4 text-cyan-400 animate-glow-pulse" />
        <h1 className="text-4xl font-bold text-white mb-2">
          Create Account
        </h1>
        <p className="text-gradient-animated font-semibold text-lg mb-1">
          Avangenio AI Challenge
        </p>
        <p className="text-gray-400">
          Join the Avangenio AI Challenge
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
