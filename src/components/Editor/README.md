# Editor — Guía de portabilidad e integración

Editor de contenido enriquecido basado en TipTap, diseñado como componente autónomo reutilizable en cualquier proyecto React.

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Copiar el componente](#2-copiar-el-componente)
3. [Instalar dependencias](#3-instalar-dependencias)
4. [Configurar Vite](#4-configurar-vite)
5. [Configurar Tailwind](#5-configurar-tailwind)
6. [Implementar los servicios](#6-implementar-los-servicios)
7. [Configurar los providers](#7-configurar-los-providers)
8. [Usar el editor](#8-usar-el-editor)
9. [Referencia de servicios](#9-referencia-de-servicios)

---

## 1. Requisitos previos

El proyecto huésped debe cumplir con lo siguiente antes de integrar el editor:

- Node.js 18 o superior
- React 18 o superior
- Vite como bundler
- Tailwind CSS configurado
- TypeScript habilitado

---

## 2. Copiar el componente

Copiar la carpeta `Editor/` completa dentro de `src/components/` del nuevo proyecto:

```
nuevo-proyecto/
└── src/
    └── components/
        └── Editor/           ← copiar aquí
            ├── ui/
            ├── hooks/
            ├── lib/
            ├── types/
            ├── utils/
            ├── EditorButtons/
            ├── FloatingMenus/
            ├── assets/
            ├── Editor.tsx
            ├── ContentEditor.tsx
            ├── ContentForm.tsx
            ├── ContentList.tsx
            ├── EditorToolbar.tsx
            ├── MediaManager.tsx
            └── ...
```

No modificar ningún archivo interno del editor. Toda la configuración específica del proyecto se hace desde afuera.

---

## 3. Instalar dependencias

Ejecutar en la raíz del nuevo proyecto:

# Editor TipTap y extensiones
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-code-block-lowlight @tiptap/extension-color @tiptap/extension-highlight @tiptap/extension-horizontal-rule @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-strike @tiptap/extension-table @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-table-row @tiptap/extension-text-align @tiptap/extension-text-style @tiptap/extension-underline lowlight
```

# Componentes UI Radix
```bash
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-separator @radix-ui/react-label @radix-ui/react-slot @radix-ui/react-accordion @radix-ui/react-checkbox @radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-switch @radix-ui/react-tooltip
```

# Utilidades y otros
```bash
npm install lucide-react clsx tailwind-merge class-variance-authority @hello-pangea/dnd
```

---

## 4. Configurar Vite

El editor usa el alias `@` para resolver imports internos. Agregarlo en el archivo `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-tiptap": [
            "@tiptap/react",
            "@tiptap/starter-kit",
            "@tiptap/extension-code-block-lowlight",
            "@tiptap/extension-color",
            "@tiptap/extension-highlight",
            "@tiptap/extension-horizontal-rule",
            "@tiptap/extension-image",
            "@tiptap/extension-link",
            "@tiptap/extension-placeholder",
            "@tiptap/extension-strike",
            "@tiptap/extension-table",
            "@tiptap/extension-table-cell",
            "@tiptap/extension-table-header",
            "@tiptap/extension-table-row",
            "@tiptap/extension-text-align",
            "@tiptap/extension-text-style",
            "@tiptap/extension-underline",
            "lowlight",
          ],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-separator",
            "@radix-ui/react-label",
            "@radix-ui/react-slot",
            "lucide-react",
          ],
          "vendor-utils": ["clsx", "tailwind-merge", "class-variance-authority"],
        },
      },
    },
  },
});
```

---

## 5. Configurar Tailwind

Tailwind CSS no se instala automáticamente al crear un proyecto React con Vite. Instalarlo con:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Esto genera automáticamente `tailwind.config.ts` y `postcss.config.js` en la raíz del proyecto.
Agregar la ruta del editor al array `content` de `tailwind.config.ts` para que Tailwind procese sus clases:

```ts
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  // Resto de la configuración...
};
```

Si el editor está en `src/components/Editor/`, la ruta `./src/**/*.{ts,tsx}` ya lo cubre automáticamente.

---

## 6. Implementar los servicios

El editor incluye en `Editor/lib/` las interfaces abstractas y providers de cada servicio. Estos archivos definen el "contrato" — qué métodos debe tener cada servicio — pero no contienen lógica de conexión a ninguna base de datos.

Lo que necesitás crear en cada proyecto nuevo son las **implementaciones concretas** — archivos separados que conectan esas interfaces con tu backend real (Supabase, Firebase, REST API, etc.).

Crear una carpeta `src/services/` en el nuevo proyecto con los siguientes archivos:

### 6.1 AuthService

Archivo: `src/services/authService-supabase.ts`

```ts
import { AuthService } from "@/components/Editor/lib/authService";

// Ejemplo con Supabase
import { supabase } from "./supabaseClient";

export const authServiceImpl: AuthService = {
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return { isAuthenticated: !!data.session };
  },

  async signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  onAuthStateChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((_, session) => {
      callback(!!session);
    });
    return () => data.subscription.unsubscribe();
  },
};
```

### 6.2 ContentService

Archivo: `src/services/contentService-supabase.ts`

```ts
import { ContentService } from "@/components/Editor/lib/contentService";
import { supabase } from "./supabaseClient";

export const contentServiceImpl: ContentService = {
  async listCategories() {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, path, sort_order, is_active")
      .order("sort_order");
    return data || [];
  },

  async listContent(params) {
    const { page = 1, pageSize = 20 } = params || {};
    const from = (page - 1) * pageSize;

    const { data, count } = await supabase
      .from("content")
      .select("*", { count: "exact" })
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false })
      .range(from, from + pageSize - 1);

    return {
      items: data || [],
      page,
      pageSize,
      total: count || 0,
    };
  },

  async getContentById(id) {
    const { data } = await supabase
      .from("content")
      .select("*")
      .eq("id", id)
      .single();
    return data || null;
  },

  async getContentBySlug(slug) {
    const { data } = await supabase
      .from("content")
      .select("*")
      .eq("slug", slug)
      .single();
    return data || null;
  },

  async upsertContent(input) {
    const { data, error } = await supabase
      .from("content")
      .upsert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteContent(id) {
    await supabase.from("content").delete().eq("id", id);
  },

  async publishContent(id, publish) {
    const { data, error } = await supabase
      .from("content")
      .update({
        status: publish ? "published" : "draft",
        published_at: publish ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async isSlugAvailable(slug, excludeId) {
    let query = supabase
      .from("content")
      .select("id")
      .eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query;
    return !data || data.length === 0;
  },

  async uploadAsset(file) {
    const filename = `${Date.now()}-${file instanceof File ? file.name : "asset"}`;
    const { data, error } = await supabase.storage
      .from("assets")
      .upload(filename, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from("assets")
      .getPublicUrl(data.path);
    return { url: urlData.publicUrl };
  },
};
```

### 6.3 MediaService

Archivo: `src/services/mediaService-supabase.ts`

```ts
import { MediaService } from "@/components/Editor/lib/mediaService";
import { supabase } from "./supabaseClient";

export const mediaServiceImpl: MediaService = {
  async listMedia(params) {
    const { page = 1, pageSize = 20, filter = {} } = params || {};
    const from = (page - 1) * pageSize;

    let query = supabase
      .from("media")
      .select("*", { count: "exact" })
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (filter.mediaType) query = query.eq("media_type", filter.mediaType);
    if (filter.searchTerm) query = query.ilike("original_filename", `%${filter.searchTerm}%`);

    const { data, count } = await query;
    return { items: data || [], page, pageSize, total: count || 0 };
  },

  async getMediaById(id) {
    const { data } = await supabase
      .from("media")
      .select("*")
      .eq("id", id)
      .single();
    return data || null;
  },

  async uploadMedia(file, options) {
    try {
      const folder = options?.folder || "common_image";
      const filename = `${folder}/${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from("media")
        .upload(filename, file);

      if (error) return { success: false, error: error.message };

      const { data: urlData } = supabase.storage
        .from("media")
        .getPublicUrl(data.path);

      const { data: mediaData, error: dbError } = await supabase
        .from("media")
        .insert({
          filename: data.path,
          original_filename: file.name,
          file_path: data.path,
          public_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          media_type: file.type.split("/")[0],
          storage_bucket: "media",
          folder,
          title: options?.title || file.name,
          alt_text: options?.altText || "",
          is_deleted: false,
        })
        .select()
        .single();

      if (dbError) return { success: false, error: dbError.message };
      return { success: true, media: mediaData };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async updateMedia(id, updates) {
    const { data, error } = await supabase
      .from("media")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteMedia(id, hardDelete = false) {
    if (hardDelete) {
      await supabase.from("media").delete().eq("id", id);
    } else {
      await supabase.from("media").update({ is_deleted: true }).eq("id", id);
    }
  },

  async searchMedia(searchTerm) {
    const { data } = await supabase
      .from("media")
      .select("*")
      .ilike("original_filename", `%${searchTerm}%`)
      .eq("is_deleted", false);
    return data || [];
  },

  async getMediaStats() {
    const { data } = await supabase
      .from("media")
      .select("media_type, file_size, created_at")
      .eq("is_deleted", false);

    const items = data || [];
    const totalSize = items.reduce((sum: number, m: any) => sum + (m.file_size || 0), 0);
    const byType: any = { image: 0, video: 0, audio: 0, file: 0 };
    items.forEach((m: any) => { if (byType[m.media_type] !== undefined) byType[m.media_type]++; });

    return {
      totalFiles: items.length,
      totalSize,
      totalSizeFormatted: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
      byType,
      byFolder: {},
      recentUploads: items.slice(0, 5) as any,
    };
  },

  async getMediaUsage(mediaId) {
    return { mediaId, usedIn: [], totalReferences: 0 };
  },
};
```

### 6.4 MenuService

Archivo: `src/services/menuService-supabase.ts`

```ts
import { MenuService } from "@/components/Editor/lib/menuService";
import { supabase } from "./supabaseClient";

export const menuServiceImpl: MenuService = {
  async getMenus(menu_group = "main") {
    const { data, error } = await supabase
      .from("menus")
      .select("*")
      .eq("menu_group", menu_group)
      .order("sort_order");
    return { data: data || [], error };
  },

  async createMenuItem(item) {
    const { data, error } = await supabase
      .from("menus")
      .insert(item)
      .select()
      .single();
    return { data, error };
  },

  async updateMenuItem(id, updates) {
    const { data, error } = await supabase
      .from("menus")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  },

  async updateMenuOrder(menus) {
    for (const item of menus) {
      await supabase
        .from("menus")
        .update({ sort_order: item.sort_order, parent_id: item.parent_id })
        .eq("id", item.id);
    }
    return { data: true, error: null };
  },

  async deleteMenuItem(id) {
    const { error } = await supabase.from("menus").delete().eq("id", id);
    return { data: !error, error };
  },

  async syncWithCategories(menu_group = "main") {
    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true);

    const { data: existing } = await supabase
      .from("menus")
      .select("url")
      .eq("menu_group", menu_group);

    const existingUrls = (existing || []).map((m: any) => m.url);
    const toAdd = (categories || []).filter(
      (c: any) => !existingUrls.includes(c.path)
    );

    let added = 0;
    for (const cat of toAdd) {
      await supabase.from("menus").insert({
        title: cat.name,
        url: cat.path,
        menu_group,
        is_active: true,
        sort_order: cat.sort_order || 0,
      });
      added++;
    }

    return { added, updated: 0, error: null };
  },
};
```

### 6.5 LinkService

Archivo: `src/services/linkService-supabase.ts`

```ts
import { LinkService } from "@/components/Editor/lib/linkService";
import { supabase } from "./supabaseClient";

export const linkServiceImpl: LinkService = {
  async getLinks() {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("type", "link")
      .order("sort_order");
    return { data: data || [], error };
  },

  async getLinkById(id) {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("id", id)
      .single();
    return { data, error };
  },

  async createLink(link) {
    const { data, error } = await supabase
      .from("links")
      .insert({ ...link, type: "link" })
      .select()
      .single();
    return { data, error };
  },

  async updateLink(id, updates) {
    const { data, error } = await supabase
      .from("links")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  },

  async updateLinksOrder(links) {
    for (const link of links) {
      await supabase
        .from("links")
        .update({ sort_order: link.sort_order })
        .eq("id", link.id);
    }
    return { data: true, error: null };
  },

  async deleteLink(id) {
    const { error } = await supabase.from("links").delete().eq("id", id);
    return { data: !error, error };
  },

  async validateLink(url) {
    try {
      const res = await fetch(url, { method: "HEAD", mode: "no-cors" });
      return { data: { isValid: true }, error: null };
    } catch {
      return { data: { isValid: false, error: "No se pudo validar la URL" }, error: null };
    }
  },

  async getRedirects() {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("type", "redirect")
      .order("sort_order");
    return { data: data || [], error };
  },

  async createRedirect(redirect) {
    const { data, error } = await supabase
      .from("links")
      .insert({ ...redirect, type: "redirect" })
      .select()
      .single();
    return { data, error };
  },

  async updateRedirect(id, updates) {
    const { data, error } = await supabase
      .from("links")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  },

  async deleteRedirect(id) {
    const { error } = await supabase.from("links").delete().eq("id", id);
    return { data: !error, error };
  },
};
```

---

## 7. Configurar los providers

En el archivo raíz de la aplicación (`src/main.tsx` o `src/App.tsx`), envolver la app con todos los providers:

```tsx
import { AuthServiceProvider } from "@/components/Editor/lib/authService";
import { ContentServiceProvider } from "@/components/Editor/lib/contentService";
import { MediaServiceProvider } from "@/components/Editor/lib/mediaService";
import { MenuServiceProvider } from "@/components/Editor/lib/menuService";
import { LinkServiceProvider } from "@/components/Editor/lib/linkService";

import { authServiceImpl } from "./services/authService-supabase";
import { contentServiceImpl } from "./services/contentService-supabase";
import { mediaServiceImpl } from "./services/mediaService-supabase";
import { menuServiceImpl } from "./services/menuService-supabase";
import { linkServiceImpl } from "./services/linkService-supabase";

export default function App() {
  return (
    <AuthServiceProvider service={authServiceImpl}>
      <ContentServiceProvider service={contentServiceImpl}>
        <MediaServiceProvider service={mediaServiceImpl}>
          <MenuServiceProvider service={menuServiceImpl}>
            <LinkServiceProvider service={linkServiceImpl}>
              {/* Resto de la app */}
            </LinkServiceProvider>
          </MenuServiceProvider>
        </MediaServiceProvider>
      </ContentServiceProvider>
    </AuthServiceProvider>
  );
}
```

---

## 8. Usar el editor

El editor debe estar ubicado dentro de `<BrowserRouter>` porque usa React Router internamente.
Si el proyecto no tiene React Router instalado, instalarlo primero:

```bash
npm install react-router-dom
```

Luego en `src/App.tsx`:

```tsx
import { BrowserRouter } from "react-router-dom";
import ContentEditor from "@/components/Editor/ContentEditor";

export default function App() {
  return (
    <BrowserRouter>
      {/* Providers del punto 7 van aquí adentro */}
      <ContentEditor showTrigger={import.meta.env.DEV} />
      {/* Resto de la app */}
    </BrowserRouter>
  );
}
```

El botón que abre el editor solo aparece cuando `showTrigger` es `true`.
En desarrollo es automático con `import.meta.env.DEV`.
En producción el botón no se muestra nunca.

---

## 9. Referencia de servicios

Resumen de qué tabla de base de datos usa cada servicio en la implementación Supabase de ejemplo:

| Servicio | Tabla principal | Descripción |
|----------|----------------|-------------|
| `AuthService` | — | Usa `supabase.auth` directamente |
| `ContentService` | `content` | Gestiona posts, páginas y productos |
| `MediaService` | `media` + Storage `media` | Gestiona archivos multimedia |
| `MenuService` | `menus` | Gestiona items de navegación |
| `LinkService` | `links` | Gestiona enlaces y redirecciones |

### Usar un backend diferente a Supabase

Las implementaciones de la sección 6 son ejemplos con Supabase. Para usar Firebase, una REST API u otro backend, crear los mismos archivos `.impl.ts` respetando las interfaces de `Editor/lib/`. El editor no sabe ni le importa qué backend usa — solo consume las interfaces.

---

## Estructura final esperada del proyecto

```
nuevo-proyecto/
├── src/
│   ├── components/
│   │   └── Editor/           ← copiado tal cual
│   ├── services/
│   │   ├── supabaseClient.ts
│   │   ├── authService-supabase.ts
│   │   ├── contentService-supabase.ts
│   │   ├── mediaService-supabase.ts
│   │   ├── menuService-supabase.ts
│   │   └── linkService-supabase.ts
│   ├── App.tsx               ← providers configurados aquí
│   └── main.tsx
├── vite.config.ts            ← alias @ configurado
├── tailwind.config.ts
└── package.json
```