const baseURL = import.meta.env.VITE_API_BASE_URL;
// if (!baseURL) throw new Error("VITE_API_BASE_URL no está definido.");

async function request(path: string, init: RequestInit = {}) {
    const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
    const defaultHeaders = isFormData ? {} : { "Content-Type": "application/json" };
  
    const res = await fetch(`${baseURL}${path}`, {
      credentials: "include",
      ...init,
      headers: { ...defaultHeaders, ...(init.headers || {}) },
    });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  // Puede no haber body (204)
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : undefined;
  return { data };
}

export const api = {
    get: (path: string, opts?: { params?: Record<string, any> }) => {
      const qs = opts?.params ? `?${new URLSearchParams(opts.params).toString()}` : "";
      return request(`${path}${qs}`, { method: "GET" });
    },
    post: (path: string, body?: unknown) =>
      request(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) }),
    put: (path: string, body?: unknown) =>
      request(path, { method: "PUT", body: JSON.stringify(body) }),
    delete: (path: string) => request(path, { method: "DELETE" }),
  };