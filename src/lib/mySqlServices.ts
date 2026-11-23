/**
 * Servicio UNIFICADO que implementa todas las interfaces del editor para MySQL/PHP.
 * Combina los servicios de Content, Media, Link y Menu.
 */

import { api } from './mySqlClient';
import type { Category } from '@/components/Editor/lib/contentService';

// Imports de interfaces del editor
import type { ContentService, ListParams, Paginated, UploadResult } from '@/components/Editor/lib/contentService';
import type { MediaService } from '@/components/Editor/lib/mediaService';
import type { LinkService } from '@/components/Editor/lib/linkService';
import type { MenuService } from '@/components/Editor/lib/menuService';
import type { AuthService } from '@/components/Editor/lib/authService';

// Imports de tipos
import type {
  ContentItem,
  CreateContentInput,
  ContentListItem,
} from "@/components/Editor/types/content.types";
import type {
  MediaItem,
  MediaSummary,
  MediaFilter,
  MediaUploadOptions,
  MediaUploadResult,
  MediaStats,
  MediaUsage,
} from '@/components/Editor/types/media.types';
import type { Link, ServiceResponse } from '@/components/Editor/types/link.types';
import type { MenuItem } from '@/components/Editor/types/menu.types';

// ===========================
// UTILIDADES
// ===========================

type ApiRow = Record<string, any>;

/**
 * Mapeo de snake_case (API PHP) a camelCase (Editor)
 */
function fromApi(row: ApiRow): any {
  if (!row) return row;
  const { content_type, ...rest } = row;
  return { ...rest, contentType: content_type };
}

/**
 * Mapeo de camelCase (Editor) a snake_case (API PHP)
 */
function toApi(input: any): ApiRow {
  const { contentType, ...rest } = input;
  return { ...rest, content_type: contentType };
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ===========================
// CLASE UNIFICADA
// ===========================

export class MySqlServices implements ContentService, MediaService, LinkService, MenuService, AuthService {
  
  // ==========================================
  // CONTENT SERVICE
  // ==========================================

  async listCategories(): Promise<Category[]> {
    const { data } = await api.get("/categories");
    return data || [];
  }

  async listContent(params: ListParams = {}): Promise<Paginated<ContentListItem>> {
    const { data } = await api.get("/content", { params });
    return data as Paginated<ContentListItem>;
  }

  async getContentById(id: string): Promise<ContentItem | null> {
    const { data } = await api.get(`/content/${id}`);
    return data ? fromApi(data) : null;
  }

  async getContentBySlug(slug: string): Promise<ContentItem | null> {
    const { data } = await api.get(`/content/slug/${encodeURIComponent(slug)}`);
    return data ? fromApi(data) : null;
  }

  async upsertContent(input: CreateContentInput): Promise<ContentItem> {
    if (input.id) {
      const { data } = await api.put(`/content/${input.id}`, toApi(input));
      return fromApi(data);
    } else {
      const { data } = await api.post("/content", toApi(input));
      return fromApi(data);
    }
  }

  async deleteContent(id: string): Promise<void> {
    await api.delete(`/content/${id}`);
  }

  async publishContent(id: string, publish: boolean): Promise<ContentItem> {
    const { data } = await api.post(`/content/${id}/publish`, { publish });
    return fromApi(data);
  }

  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const { data } = await api.get("/content/slug-available", { params: { slug, excludeId } });
    return Boolean(data?.available);
  }

  async uploadAsset(file: File | Blob): Promise<UploadResult> {
    const form = new FormData();
    const isFile = typeof (file as File).name === "string";
    form.append("file", file, isFile ? (file as File).name : "upload.bin");

    const { data } = await api.post("/upload", form);
    return data as UploadResult;
  }

  // ==========================================
  // MEDIA SERVICE
  // ==========================================

  async listMedia(params: {
    page?: number;
    pageSize?: number;
    filter?: MediaFilter;
  } = {}): Promise<{
    items: MediaSummary[];
    page: number;
    pageSize: number;
    total: number;
  }> {
    const { data } = await api.get("/media", { params });
    return data;
  }

  async getMediaById(id: string): Promise<MediaItem | null> {
    const { data } = await api.get(`/media/${id}`);
    return data || null;
  }

  async uploadMedia(file: File, options?: MediaUploadOptions): Promise<MediaUploadResult> {
    try {
      const form = new FormData();
      form.append("file", file);
      if (options?.folder) form.append("folder", options.folder);
      if (options?.title) form.append("title", options.title);
      if (options?.altText) form.append("alt_text", options.altText);
      if (options?.caption) form.append("caption", options.caption);

      const { data } = await api.post("/media/upload", form);
      return { success: true, media: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateMedia(id: string, updates: Partial<MediaItem>): Promise<MediaItem> {
    const { data } = await api.put(`/media/${id}`, updates);
    return data;
  }

  async deleteMedia(id: string, hardDelete: boolean = false): Promise<void> {
    await api.delete(`/media/${id}?hardDelete=${hardDelete}`);
  }

  async searchMedia(searchTerm: string): Promise<MediaSummary[]> {
    const { data } = await api.get("/media/search", { params: { q: searchTerm } });
    return data?.items || [];
  }

  async getMediaStats(): Promise<MediaStats> {
    const { data } = await api.get("/media/stats");
    return data;
  }

  async getMediaUsage(mediaId: string): Promise<MediaUsage> {
    const { data } = await api.get(`/media/${mediaId}/usage`);
    return data;
  }

  // ==========================================
  // LINK SERVICE
  // ==========================================

  async getLinks(): Promise<ServiceResponse<Link[]>> {
    try {
      const { data } = await api.get("/links");
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async getLinkById(id: string): Promise<ServiceResponse<Link>> {
    try {
      const { data } = await api.get(`/links/${id}`);
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async createLink(link: Link): Promise<ServiceResponse<Link>> {
    try {
      const { data } = await api.post("/links", link);
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async updateLink(id: string, updates: Partial<Link>): Promise<ServiceResponse<Link>> {
    try {
      const { data } = await api.put(`/links/${id}`, updates);
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async updateLinksOrder(links: Link[]): Promise<ServiceResponse<boolean>> {
    try {
      await api.post("/links/reorder", { links });
      return { data: true, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async deleteLink(id: string): Promise<ServiceResponse<boolean>> {
    try {
      await api.delete(`/links/${id}`);
      return { data: true, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async validateLink(url: string): Promise<ServiceResponse<{ isValid: boolean; error?: string }>> {
    // Validación simple de URL (puedes mejorar la expresión si lo deseas)
    const isValid = /^https?:\/\/.+\..+/.test(url);
    return {
      data: { isValid, error: isValid ? undefined : "URL inválida" },
      error: null
    };
  }

  async getRedirects(): Promise<ServiceResponse<Link[]>> {
    try {
      const { data } = await api.get("/redirects");
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async createRedirect(redirect: Link): Promise<ServiceResponse<Link>> {
    try {
      const { data } = await api.post("/redirects", redirect);
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async updateRedirect(id: string, updates: Partial<Link>): Promise<ServiceResponse<Link>> {
    try {
      const { data } = await api.put(`/redirects/${id}`, updates);
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async deleteRedirect(id: string): Promise<ServiceResponse<boolean>> {
    try {
      await api.delete(`/redirects/${id}`);
      return { data: true, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  // ==========================================
  // MENU SERVICE
  // ==========================================

  async getMenus(menu_group: string = "main"): Promise<{ data: MenuItem[] | null; error: any }> {
    try {
      const { data } = await api.get(`/menus/${menu_group}`);
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async createMenuItem(item: MenuItem): Promise<{ data: MenuItem | null; error: any }> {
    try {
      const { data } = await api.post("/menus", item);
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<{ data: MenuItem | null; error: any }> {
    try {
      const { data } = await api.put(`/menus/${id}`, updates);
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async updateMenuOrder(menus: MenuItem[]): Promise<{ data: boolean | null; error: any }> {
    try {
      await api.post("/menus/reorder", { menus });
      return { data: true, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async deleteMenuItem(id: string): Promise<{ data: boolean | null; error: any }> {
    try {
      await api.delete(`/menus/${id}`);
      return { data: true, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async deleteAllMenus(): Promise<{ data: boolean | null; error: any }> {
    try {
      await api.delete("/menus");
      return { data: true, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async syncWithCategories(menu_group: string = "main"): Promise<{ added: number; updated: number; error: any }> {
    try {
      const { data } = await api.post(`/menus/sync-categories`, { menu_group });
      return { added: data.added || 0, updated: data.updated || 0, error: null };
    } catch (error: any) {
      return { added: 0, updated: 0, error };
    }
  }

  async getSession(): Promise<{ isAuthenticated: boolean }> {
    try {
      const { data } = await api.get("/auth/session");
      return { isAuthenticated: Boolean(data?.authenticated) };
    } catch {
      return { isAuthenticated: false };
    }
  }
  
  async signIn(email: string, password: string): Promise<{ error: any }> {
    try {
      await api.post("/auth/login", { email, password });
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }
  
  async signOut(): Promise<{ error: any }> {
    try {
      await api.post("/auth/logout", {});
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }
  
  onAuthStateChange(_callback: (isAuthenticated: boolean) => void): () => void {
    return () => {};
  }
}

// ===========================
// EXPORTAR SINGLETON
// ===========================

export const mySqlServices = new MySqlServices();