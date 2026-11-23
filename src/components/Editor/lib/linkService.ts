import React, { createContext, useContext } from "react";
import type { Link, ServiceResponse } from "../types/link.types";

// ===========================
// CONSTANTES (Reutilizables)
// ===========================

export const DEFAULT_LINK_TYPE = "external";
export const DEFAULT_REDIRECT_TYPE = "301";
export const DEFAULT_SORT_ORDER = 0;
export const DEFAULT_IS_ACTIVE = true;

// ===========================
// INTERFAZ ABSTRACTA
// ===========================

export interface LinkService {
  // Enlaces personalizados
  getLinks(): Promise<ServiceResponse<Link[]>>;
  getLinkById(id: string): Promise<ServiceResponse<Link>>;
  createLink(link: Link): Promise<ServiceResponse<Link>>;
  updateLink(id: string, updates: Partial<Link>): Promise<ServiceResponse<Link>>;
  updateLinksOrder(links: Link[]): Promise<ServiceResponse<boolean>>;
  deleteLink(id: string): Promise<ServiceResponse<boolean>>;
  validateLink(url: string): Promise<ServiceResponse<{ isValid: boolean; error?: string }>>;

  // Redirecciones
  getRedirects(): Promise<ServiceResponse<Link[]>>;
  createRedirect(redirect: Link): Promise<ServiceResponse<Link>>;
  updateRedirect(id: string, updates: Partial<Link>): Promise<ServiceResponse<Link>>;
  deleteRedirect(id: string): Promise<ServiceResponse<boolean>>;
}

// ===========================
// CONTEXT E INYECCIÓN
// ===========================

const LinkServiceContext = createContext<LinkService | null>(null);

/**
 * Hook para obtener el servicio de enlaces inyectado
 */
export function useLinkService(): LinkService {
  const ctx = useContext(LinkServiceContext);
  if (!ctx) {
    throw new Error("LinkService no está disponible. Envuelve con LinkServiceProvider.");
  }
  return ctx;
}

/**
 * Provider para inyectar la implementación del servicio
 */
type ProviderProps = {
  service: LinkService;
  children: React.ReactNode;
};

export function LinkServiceProvider({ service, children }: ProviderProps) {
  return React.createElement(LinkServiceContext.Provider, { value: service, children });
}