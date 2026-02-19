import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Create Account
        </h1>
        <p className="text-gray-400">
          Join the LLM Quiz Game
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
