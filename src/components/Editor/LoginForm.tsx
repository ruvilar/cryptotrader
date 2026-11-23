import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<{ error: any }>;
  onClose: () => void;
}

export default function LoginForm({ onLogin, onClose }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error: loginError } = await onLogin(email, password);
    
    if (loginError) {
      setError('Credenciales incorrectas');
      setIsLoading(false);
    } else {
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email" className="text-white">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white/10 text-white border-gray-600"
          placeholder="admin@tudominio.com"
        />
      </div>
      
      <div>
        <Label htmlFor="password" className="text-white">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-white/10 text-white border-gray-600"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm">❌ {error}</p>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-500"
      >
        {isLoading ? 'Verificando...' : '🔐 Iniciar Sesión'}
      </Button>
    </form>
  );
}