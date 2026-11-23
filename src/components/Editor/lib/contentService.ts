import React, { createContext, useContext } from "react";
import type { ContentItem, CreateContentInput, ContentListItem, ContentStatus } from "../types/content.types";

export type Category = {
  id: string;
  name: string;
  slug: string;
  path: string;
  sort_order?: number;
  is_active?: boolean;
};

export type ListParams = {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: ContentStatus;
  category?: string;
  tag?: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export interface UploadResult {
  url: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

export interface ContentService {
  listCategories(): Promise<Category[]>;
  listContent(params?: ListParams): Promise<Paginated<ContentListItem>>;
  getContentById(id: string): Promise<ContentItem | null>;
  getContentBySlug(slug: string): Promise<ContentItem | null>;
  upsertContent(input: CreateContentInput): Promise<ContentItem>;
  deleteContent(id: string): Promise<void>;
  publishContent(id: string, publish: boolean): Promise<ContentItem>;
  isSlugAvailable(slug: string, excludeId?: string): Promise<boolean>;
  uploadAsset(file: File | Blob): Promise<UploadResult>;
}

// Contexto e inyección
const ContentServiceContext = createContext<ContentService | null>(null);

export function useContentService(): ContentService {
  const ctx = useContext(ContentServiceContext);
  if (!ctx) throw new Error("ContentService no está disponible. Envuelve con ContentServiceProvider.");
  return ctx;
}

type ProviderProps = {
  service: ContentService;
  children: React.ReactNode;
};

export function ContentServiceProvider({ service, children }: ProviderProps) {
  return React.createElement(ContentServiceContext.Provider, { value: service, children });
}