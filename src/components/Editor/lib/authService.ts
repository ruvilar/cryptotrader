import React, { createContext, useContext } from "react";

export interface AuthService {
  getSession(): Promise<{ isAuthenticated: boolean }>;
  signIn(email: string, password: string): Promise<{ error: any }>;
  signOut(): Promise<{ error: any }>;
  onAuthStateChange?(callback: (isAuthenticated: boolean) => void): () => void;
}

const AuthServiceContext = createContext<AuthService | null>(null);

export function useAuthService(): AuthService {
  const ctx = useContext(AuthServiceContext);
  if (!ctx) throw new Error("AuthService no disponible.");
  return ctx;
}

export function AuthServiceProvider({ service, children }: { service: AuthService; children: React.ReactNode }) {
  return React.createElement(AuthServiceContext.Provider, { value: service, children });
}