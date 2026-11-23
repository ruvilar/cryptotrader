import { useState, useEffect } from 'react';
import { useAuthService } from '../lib/authService';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const authService = useAuthService();

  useEffect(() => {
    authService.getSession().then(({ isAuthenticated }) => {
      setIsAuthenticated(isAuthenticated);
      setIsLoading(false);
    });

    if (authService.onAuthStateChange) {
      const unsubscribe = authService.onAuthStateChange(setIsAuthenticated);
      return unsubscribe;
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await authService.signIn(email, password);
    if (!error) setIsAuthenticated(true);
    return { error };
  };

  const signOut = async () => {
    const { error } = await authService.signOut();
    if (!error) setIsAuthenticated(false);
    return { error };
  };

  return { isAuthenticated, isLoading, signIn, signOut };
}