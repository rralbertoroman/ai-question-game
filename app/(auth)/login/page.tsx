import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-400">
          Sign in to your account
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
