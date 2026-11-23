/**
 * Servicio UNIFICADO que implementa todas las interfaces del editor para Supabase.
 * Combina los servicios de Content, Media, Link y Menu.
 */

import { supabase } from './supabaseClient';
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, ContentService, ListParams, Paginated, UploadResult } from '@/components/Editor/lib/contentService';
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
  MediaType,
  MediaFolder
} from '@/components/Editor/types/media.types';
import type { Link, ServiceResponse } from '@/components/Editor/types/link.types';
import type { MenuItem } from '@/components/Editor/types/menu.types';

// ===========================
// CONSTANTES
// ===========================

const CONTENTS_TABLE = "content";
const MEDIA_TABLE = "media";
const LINKS_TABLE = "links";
const MENUS_TABLE = "menus";
const CATEGORIES_TABLE = "categories";
const ASSETS_BUCKET = "content-images";

// ===========================
// UTILIDADES
// ===========================

function detectMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith('image/')) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

// ===========================
// CLASE UNIFICADA
// ===========================

export class SupabaseServices implements ContentService, MediaService, LinkService, MenuService, AuthService {
  constructor(private supabase: SupabaseClient) {}

  // ==========================================
  // CONTENT SERVICE
  // ==========================================

  async listCategories(): Promise<Category[]> {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, path, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return data || [];
  }

  async listContent(params: ListParams = {}): Promise<Paginated<ContentListItem>> {
    const { page = 1, pageSize = 10, query, status, includeDeleted = false } = params as any;
  
    let q = this.supabase
      .from(CONTENTS_TABLE)
      .select("*", { count: "exact" })
      .order("updated_at", { ascending: false });
  
    // Si no se piden eliminados, excluirlos; si se piden, traer SOLO los eliminados
    if (includeDeleted) {
      q = q.eq("is_deleted", true);
    } else {
      q = q.eq("is_deleted", false);
    }
  
    if (query) q = q.ilike("title", `%${query}%`);
    if (status) q = q.eq("status", status);
  
    const from = (page - 1) * pageSize;
    const to = page * pageSize - 1;
    const { data, error, count } = await q.range(from, to);
    if (error) throw error;
  
    const items = (data ?? []) as ContentListItem[];
    return { items, page, pageSize, total: count ?? items.length };
  }

  async getContentById(id: string): Promise<ContentItem | null> {
    const { data, error } = await this.supabase
      .from(CONTENTS_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    const { content_type, ...rest } = data;
    return { ...rest, contentType: content_type } as unknown as ContentItem;
  }

  async getContentBySlug(slug: string): Promise<ContentItem | null> {
    const { data, error } = await this.supabase
      .from(CONTENTS_TABLE)
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    const { content_type, ...rest } = data;
    return { ...rest, contentType: content_type } as unknown as ContentItem;
  }

  async upsertContent(input: CreateContentInput): Promise<ContentItem> {
    const { contentType, ...rest } = input as any;
    const payload = { 
      ...rest, 
      content_type: contentType,
      updated_at: new Date().toISOString() 
    };

    const { data, error } = await this.supabase
      .from(CONTENTS_TABLE)
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;
    const { content_type: ct, ...restData } = data;
    return { ...restData, contentType: ct } as unknown as ContentItem;
  }

  async deleteContent(id: string): Promise<void> {
    const { error } = await this.supabase.from(CONTENTS_TABLE).delete().eq("id", id);
    if (error) throw error;
  }

  async publishContent(id: string, publish: boolean): Promise<ContentItem> {
    const { data, error } = await this.supabase
      .from(CONTENTS_TABLE)
      .update({
        status: publish ? "published" : "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    const { content_type, ...rest } = data;
    return { ...rest, contentType: content_type } as unknown as ContentItem;
  }

  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    let q = this.supabase.from(CONTENTS_TABLE).select("id").eq("slug", slug);
    if (excludeId) q = q.neq("id", excludeId);
    const { data, error } = await q;
    if (error) throw error;
    return (data?.length ?? 0) === 0;
  }

  async uploadAsset(file: File | Blob): Promise<UploadResult> {
    const isFile = typeof (file as File).name === "string";
    const baseName = isFile ? (file as File).name : "blob";
    const ext = isFile && baseName.includes(".") ? baseName.split(".").pop() : "bin";
    const filePath = `${crypto.randomUUID()}.${ext}`;

    const { data, error } = await this.supabase.storage
      .from(ASSETS_BUCKET)
      .upload(filePath, file, {
        upsert: false,
        contentType: (file as any).type || undefined,
      });

    if (error) throw error;

    const { data: pub } = this.supabase.storage.from(ASSETS_BUCKET).getPublicUrl(data.path);
    return { url: pub.publicUrl };
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
    const { page = 1, pageSize = 20, filter = {} } = params;

    let query = this.supabase
      .from(MEDIA_TABLE)
      .select('id, filename, original_filename, public_url, media_type, file_size, mime_type, created_at', { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (filter.mediaType) query = query.eq('media_type', filter.mediaType);
    if (filter.folder) query = query.eq('folder', filter.folder);
    if (filter.searchTerm) {
      query = query.or(`original_filename.ilike.%${filter.searchTerm}%,title.ilike.%${filter.searchTerm}%`);
    }

    const from = (page - 1) * pageSize;
    const to = page * pageSize - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    const items: MediaSummary[] = (data ?? []).map((row: any) => ({
      id: row.id,
      filename: row.filename,
      originalFilename: row.original_filename,
      publicUrl: row.public_url,
      mediaType: row.media_type,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      createdAt: row.created_at,
      thumbnail: row.media_type === 'image' ? row.public_url : undefined
    }));

    return { items, page, pageSize, total: count ?? items.length };
  }

  async getMediaById(id: string): Promise<MediaItem | null> {
    const { data, error } = await this.supabase
      .from(MEDIA_TABLE)
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    return data as MediaItem | null;
  }

  async uploadMedia(file: File, options?: MediaUploadOptions): Promise<MediaUploadResult> {
    try {
      const mediaType = options?.mediaType || detectMediaType(file.type);
      const folder = options?.folder || (mediaType === 'image' ? 'common_image' : mediaType + 's');

      const fileExt = file.name.split('.').pop() || 'bin';
      const filename = `${folder}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(ASSETS_BUCKET)
        .upload(filename, file, { upsert: false, contentType: file.type });

      if (uploadError) return { success: false, error: uploadError.message };

      const { data: urlData } = this.supabase.storage.from(ASSETS_BUCKET).getPublicUrl(filename);

      let dimensions = null;
      if (mediaType === 'image') {
        dimensions = await getImageDimensions(file);
      }

      const { data: { user } } = await this.supabase.auth.getUser();

      const mediaData: Partial<MediaItem> = {
        filename,
        original_filename: file.name,
        file_path: uploadData.path,
        public_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        media_type: mediaType,
        storage_bucket: ASSETS_BUCKET,
        folder: folder as MediaFolder,
        title: options?.title || file.name,
        alt_text: options?.altText,
        caption: options?.caption,
        width: dimensions?.width,
        height: dimensions?.height,
        created_by: user?.id,
        is_deleted: false
      };

      const { data: insertedData, error: insertError } = await this.supabase
        .from(MEDIA_TABLE)
        .insert(mediaData)
        .select()
        .single();

      if (insertError) {
        await this.supabase.storage.from(ASSETS_BUCKET).remove([filename]);
        return { success: false, error: insertError.message };
      }

      return { success: true, media: insertedData as MediaItem };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  async updateMedia(id: string, updates: Partial<MediaItem>): Promise<MediaItem> {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await this.supabase
      .from(MEDIA_TABLE)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MediaItem;
  }

  async deleteMedia(id: string, hardDelete: boolean = false): Promise<void> {
    const media = await this.getMediaById(id);
    if (!media) throw new Error('Medio no encontrado');

    if (hardDelete) {
      const { error: storageError } = await this.supabase.storage
        .from(ASSETS_BUCKET)
        .remove([media.file_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await this.supabase
        .from(MEDIA_TABLE)
        .delete()
        .eq('id', id);
      if (dbError) throw dbError;
    } else {
      await this.updateMedia(id, { is_deleted: true });
    }
  }

  async searchMedia(searchTerm: string): Promise<MediaSummary[]> {
    const { data, error } = await this.supabase
      .from(MEDIA_TABLE)
      .select('id, filename, original_filename, public_url, media_type, file_size, mime_type, created_at')
      .eq('is_deleted', false)
      .or(`original_filename.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      filename: row.filename,
      originalFilename: row.original_filename,
      publicUrl: row.public_url,
      mediaType: row.media_type,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      createdAt: row.created_at,
      thumbnail: row.media_type === 'image' ? row.public_url : undefined
    }));
  }

  async getMediaStats(): Promise<MediaStats> {
    const { data, error } = await this.supabase
      .from(MEDIA_TABLE)
      .select('*')
      .eq('is_deleted', false);

    if (error) throw error;

    const totalFiles = data?.length || 0;
    const totalSize = data?.reduce((sum, item) => sum + (item.file_size || 0), 0) || 0;
    
    const byType: Record<string, number> = {};
    const byFolder: Record<string, number> = {};
    
    data?.forEach(item => {
      byType[item.media_type] = (byType[item.media_type] || 0) + 1;
      if (item.folder) byFolder[item.folder] = (byFolder[item.folder] || 0) + 1;
    });

    const recentUploads: MediaSummary[] = (data || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(item => ({
        id: item.id,
        filename: item.filename,
        originalFilename: item.original_filename,
        publicUrl: item.public_url,
        mediaType: item.media_type,
        fileSize: item.file_size,
        mimeType: item.mime_type,
        createdAt: item.created_at,
        thumbnail: item.media_type === 'image' ? item.public_url : undefined
      }));

    return {
      totalFiles,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      byType: byType as any,
      byFolder: byFolder as any,
      recentUploads
    };
  }

  async getMediaUsage(mediaId: string): Promise<MediaUsage> {
    const media = await this.getMediaById(mediaId);
    if (!media) throw new Error('Medio no encontrado');

    const usedIn: MediaUsage['usedIn'] = [];

    const { data: contents, error } = await this.supabase
      .from(CONTENTS_TABLE)
      .select('id, title, type, featured_image, og_image, twitter_image')
      .or(`featured_image.eq.${media.public_url},og_image.eq.${media.public_url},twitter_image.eq.${media.public_url}`);

    if (error) throw error;

    contents?.forEach(content => {
      if (content.featured_image === media.public_url) {
        usedIn.push({
          contentId: content.id,
          contentTitle: content.title,
          contentType: content.type,
          field: 'featured_image'
        });
      }
      if (content.og_image === media.public_url) {
        usedIn.push({
          contentId: content.id,
          contentTitle: content.title,
          contentType: content.type,
          field: 'og_image'
        });
      }
      if (content.twitter_image === media.public_url) {
        usedIn.push({
          contentId: content.id,
          contentTitle: content.title,
          contentType: content.type,
          field: 'twitter_image'
        });
      }
    });

    return { mediaId, usedIn, totalReferences: usedIn.length };
  }

  // ==========================================
  // LINK SERVICE
  // ==========================================

  async getLinks(): Promise<ServiceResponse<Link[]>> {
    try {
      const { data, error } = await this.supabase
        .from(LINKS_TABLE)
        .select("*")
        .eq("type", "link")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async getLinkById(id: string): Promise<ServiceResponse<Link>> {
    try {
      const { data, error } = await this.supabase
        .from(LINKS_TABLE)
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async createLink(link: Link): Promise<ServiceResponse<Link>> {
    try {
      const { data, error } = await this.supabase
        .from(LINKS_TABLE)
        .insert([{
          type: "link",
          title: link.title?.trim(),
          url: link.url,
          description: link.description?.trim() || null,
          link_type: link.link_type || "external",
          is_active: link.is_active ?? true,
          sort_order: link.sort_order ?? 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async updateLink(id: string, updates: Partial<Link>): Promise<ServiceResponse<Link>> {
    try {
      const allowedFields = {
        ...(updates.title !== undefined && { title: updates.title?.trim() || null }),
        ...(updates.url !== undefined && { url: updates.url }),
        ...(updates.description !== undefined && { description: updates.description?.trim() || null }),
        ...(updates.link_type && { link_type: updates.link_type }),
        ...(updates.is_active !== undefined && { is_active: updates.is_active }),
        ...(updates.sort_order !== undefined && { sort_order: updates.sort_order }),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from(LINKS_TABLE)
        .update(allowedFields)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async updateLinksOrder(links: Link[]): Promise<ServiceResponse<boolean>> {
    try {
      const updates = links.map((link, index) => ({
        id: link.id,
        sort_order: index,
        title: link.title,
        type: "link",
      }));

      const { error } = await this.supabase
        .from(LINKS_TABLE)
        .upsert(updates, { onConflict: "id" });

      if (error) throw error;
      return { data: true, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async deleteLink(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from(LINKS_TABLE)
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async validateLink(url: string): Promise<ServiceResponse<{ isValid: boolean; error?: string }>> {
    try {
      // Validación simple: URL válida y comienza con http(s)
      const isValid = /^https?:\/\/.+\..+/.test(url);
      return { data: { isValid, error: isValid ? undefined : "URL inválida" }, error: null };
    } catch (error) {
      return { data: { isValid: false, error: "Error de validación" }, error };
    }
  }

  async getRedirects(): Promise<ServiceResponse<Link[]>> {
    try {
      const { data, error } = await this.supabase
        .from(LINKS_TABLE)
        .select("*")
        .eq("type", "redirect")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async createRedirect(redirect: Link): Promise<ServiceResponse<Link>> {
    try {
      const { data, error } = await this.supabase
        .from(LINKS_TABLE)
        .insert([{
          type: "redirect",
          url: redirect.url.trim(),
          target_url: redirect.target_url?.trim(),
          redirect_type: redirect.redirect_type || "301",
          is_active: redirect.is_active ?? true,
          hits: 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async updateRedirect(id: string, updates: Partial<Link>): Promise<ServiceResponse<Link>> {
    try {
      const allowedFields = {
        ...(updates.url && { url: updates.url.trim() }),
        ...(updates.target_url && { target_url: updates.target_url.trim() }),
        ...(updates.redirect_type && { redirect_type: updates.redirect_type }),
        ...(updates.is_active !== undefined && { is_active: updates.is_active }),
        ...(updates.hits !== undefined && { hits: updates.hits }),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from(LINKS_TABLE)
        .update(allowedFields)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async deleteRedirect(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from(LINKS_TABLE)
        .delete()
        .eq("id", id);

      if (error) throw error;
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
      const { data, error } = await this.supabase
        .from(MENUS_TABLE)
        .select("*")
        .eq("menu_group", menu_group)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async createMenuItem(item: MenuItem): Promise<{ data: MenuItem | null; error: any }> {
    try {
      const { data, error } = await this.supabase
        .from(MENUS_TABLE)
        .insert({
          parent_id: item.parent_id || null,
          menu_group: item.menu_group || "main",
          title: item.title.trim(),
          url: item.url || "/",
          icon: item.icon || null,
          is_active: item.is_active ?? true,
          sort_order: item.sort_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<{ data: MenuItem | null; error: any }> {
    try {
      const allowedFields = {
        ...(updates.title && { title: updates.title }),
        ...(updates.url !== undefined && { url: updates.url }),
        ...(updates.icon !== undefined && { icon: updates.icon }),
        ...(updates.parent_id !== undefined && { parent_id: updates.parent_id }),
        ...(updates.menu_group && { menu_group: updates.menu_group }),
        ...(updates.is_active !== undefined && { is_active: updates.is_active }),
        ...(updates.sort_order !== undefined && { sort_order: updates.sort_order }),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from(MENUS_TABLE)
        .update(allowedFields)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async updateMenuOrder(menus: MenuItem[]): Promise<{ data: boolean | null; error: any }> {
    try {
      const updates = menus.map((item, index) => ({
        id: item.id,
        sort_order: index,
        parent_id: item.parent_id || null,
        title: item.title,
        menu_group: item.menu_group || "main",
      }));

      const { error } = await this.supabase.from(MENUS_TABLE).upsert(updates, { onConflict: "id" });

      if (error) throw error;
      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async deleteMenuItem(id: string): Promise<{ data: boolean | null; error: any }> {
    try {
      const { error } = await this.supabase.from(MENUS_TABLE).delete().eq("id", id);
      if (error) throw error;
      return { data: true, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async deleteAllMenus(): Promise<{ data: boolean | null; error: any }> {
    try {
      const { error } = await this.supabase.from(MENUS_TABLE).delete();
      if (error) throw error;
      return { data: true, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async syncWithCategories(menu_group: string = "main"): Promise<{ added: number; updated: number; error: any }> {
    try {
      const { data: categories, error: catError } = await this.supabase
        .from(CATEGORIES_TABLE)
        .select("id, name, slug")
        .eq("is_active", true);

      if (catError || !categories) {
        return { added: 0, updated: 0, error: catError };
      }

      const { data: menuItems, error: menuError } = await this.supabase
        .from(MENUS_TABLE)
        .select("id, title, url, menu_group")
        .eq("menu_group", menu_group);

      if (menuError) {
        return { added: 0, updated: 0, error: menuError };
      }

      const existingUrls = new Set(menuItems?.map(m => m.url) || []);
      const newCategories = categories.filter(cat => !existingUrls.has(`/${cat.slug}/`));

      let added = 0;
      for (const cat of newCategories) {
        const { error: insertError } = await this.supabase
          .from(MENUS_TABLE)
          .insert({
            menu_group,
            title: cat.name,
            url: `/${cat.slug}/`,
            is_active: true,
            sort_order: 0,
          });

        if (!insertError) added++;
      }

      return { added, updated: 0, error: null };
    } catch (error: any) {
      return { added: 0, updated: 0, error };
    }
  }

  // ==========================================
  // AUTH SERVICE
  // ==========================================

  async getSession(): Promise<{ isAuthenticated: boolean }> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return { isAuthenticated: !!session };
  }

  async signIn(email: string, password: string): Promise<{ error: any }> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async signOut(): Promise<{ error: any }> {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  onAuthStateChange(callback: (isAuthenticated: boolean) => void): () => void {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange((_event, session) => {
      callback(!!session);
    });
    return () => subscription.unsubscribe();
  }
}

// ===========================
// EXPORTAR SINGLETON
// ===========================

export const supabaseServices = new SupabaseServices(supabase);