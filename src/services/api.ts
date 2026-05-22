const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

type CachedResponse<T> = {
  timestamp: number;
  response: ApiResponse<T>;
};

const apiResponseCache = new Map<string, CachedResponse<any>>();
const apiInflightRequests = new Map<string, Promise<ApiResponse<any>>>();
const API_CACHE_TTL_MS = 10_000;

const buildApiUrl = (endpoint: string) => {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  if (API_BASE === '/api') {
    return `${API_BASE}${endpoint}`;
  }

  return `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Debug logging
if (typeof window !== 'undefined') {
  console.log('[API] Base URL:', API_BASE);
}

type ApiResponse<T = any> = {
  data: T | null;
  error?: unknown;
};

type FetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

type ProductUpdateData = {
  name?: string;
  description?: string;
  price?: number;
  prep_time_minutes?: number;
  image_url?: string;
  image?: File | null;
  available?: boolean;
  category_id?: string | number;
};

type ProductCreateData = {
  name: string;
  description: string;
  price: number;
  prep_time_minutes: number;
  image_url?: string;
  image?: File | null;
  category_id: string | number;
  available?: boolean;
};

type CategoryUpdateData = {
  name?: string;
};

type RestaurantUpdateData = {
  name?: string;
  phone?: string;
  email?: string;
  image_url?: string;
  logo?: File | null;
  address?: string;
  access_code?: string;
  max_capacity?: number;
};

type AuthResult = {
  token?: string;
  user?: any;
  restaurant?: any;
};

const getToken = () => localStorage.getItem('authToken');

const clearApiCache = () => {
  apiResponseCache.clear();
};

const fetchAPI = async <T = any>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> => {
  try {
    const token = getToken();
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const method = (options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers);
    const fullUrl = buildApiUrl(endpoint);
    const cacheKey = `${method}:${fullUrl}:${token || 'anonymous'}`;

    if (method === 'GET') {
      const cached = apiResponseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < API_CACHE_TTL_MS) {
        return cached.response as ApiResponse<T>;
      }

      const inflight = apiInflightRequests.get(cacheKey);
      if (inflight) {
        return inflight as Promise<ApiResponse<T>>;
      }
    }

    if (!isFormData) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    console.log('[API] Request:', {
      method,
      url: fullUrl,
      isFormData,
      endpoint,
      API_BASE,
    });

    const requestPromise = (async () => {
      const response = await fetch(fullUrl, {
        ...options,
        method,
        headers,
      });

      console.log('[API] Response status:', response.status, 'url:', response.url);

      if (!response.ok) {
        let errorMessage = `API Error: ${response.status}`;
        const contentType = response.headers.get('content-type');

        // Si 401, le token est invalide/expiré
        if (response.status === 401) {
          localStorage.removeItem('authToken');
        }

        try {
          if (contentType?.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.message || error.error || errorMessage;
          } else {
            const text = await response.text();
            console.error('Server returned non-JSON response:', text.substring(0, 200));
            errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}`;
          }
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }

        return {
          data: null,
          error: {
            status: response.status,
            message: errorMessage,
          },
        };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('Server returned non-JSON response on success:', text.substring(0, 200));
        return {
          data: null,
          error: {
            status: response.status,
            message: `Invalid response format: expected JSON but got ${contentType || 'unknown'}`,
          },
        };
      }

      return { data: await response.json() as T };
    })();

    if (method === 'GET') {
      apiInflightRequests.set(cacheKey, requestPromise);
    }

    const result = await requestPromise;

    if (method === 'GET') {
      apiInflightRequests.delete(cacheKey);
      if (result.data && !result.error) {
        apiResponseCache.set(cacheKey, {
          timestamp: Date.now(),
          response: result,
        });
      }
    } else if (!result.error) {
      clearApiCache();
    }

    return result;
  } catch (error) {
    const method = (options.method || 'GET').toUpperCase();
    if (method === 'GET') {
      apiInflightRequests.clear();
    }
    console.error('API Error:', error);
    return { data: null, error };
  }
};

export const authAPI = {
  login: async (email: string, password: string) => {
    const result = await fetchAPI<AuthResult>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.token) {
      localStorage.setItem('authToken', result.data.token);
    }

    return result;
  },

  register: async (data: { restaurantName: string; email: string; phone: string; image_url?: string; password: string }) => {
    const result = await fetchAPI<AuthResult>(`/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.data?.token) {
      localStorage.setItem('authToken', result.data.token);
    }

    return result;
  },

  me: async () => {
    return fetchAPI(`/auth/me`);
  },

  logout: async () => {
    const result = await fetchAPI(`/auth/logout`, {
      method: 'POST',
    });

    if (!result.error) {
      localStorage.removeItem('authToken');
    }

    return result;
  },
};

export const api = {
  restaurant: {
    list: async () => fetchAPI(`/restaurants`),
    get: async (slug: string) => fetchAPI(`/restaurants/${slug}`),
    me: async () => fetchAPI(`/restaurant`),
    update: async (data: RestaurantUpdateData): Promise<ApiResponse<any>> => {
      if (data.logo) {
        // Pour les uploads de fichiers, on bypass le proxy Vite et va directement à Laravel
        const formData = new FormData();
        formData.append('_method', 'PUT');
        if (data.name !== undefined) formData.append('name', data.name);
        if (data.phone !== undefined) formData.append('phone', data.phone);
        if (data.email !== undefined) formData.append('email', data.email);
        if (data.address !== undefined) formData.append('address', data.address);
        if (data.access_code !== undefined) formData.append('access_code', data.access_code);
        if (data.max_capacity !== undefined) formData.append('max_capacity', String(data.max_capacity));
        formData.append('logo', data.logo);
        
        console.log('[API] File upload - using direct URL to backend');
        
        const token = getToken();
        const headers = new Headers();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        
        try {
          const response = await fetch(buildApiUrl('/restaurant'), {
            method: 'POST',
            body: formData,
            headers,
          });
          
          const text = await response.text();
          console.log('[API] Upload response status:', response.status);
          console.log('[API] Upload response content-type:', response.headers.get('content-type'));
          console.log('[API] Upload response first 300 chars:', text.substring(0, 300));
          
          if (!response.ok) {
            console.error('Upload error:', response.status, text.substring(0, 200));
            return {
              data: null,
              error: {
                status: response.status,
                message: `Upload failed: ${response.status}`,
              },
            };
          }
          
          try {
            const jsonData = JSON.parse(text);
            return { data: jsonData };
          } catch (parseError) {
            console.error('[API] Failed to parse response as JSON:', parseError);
            console.error('[API] Response was:', text.substring(0, 500));
            return {
              data: null,
              error: {
                status: response.status,
                message: 'Server returned invalid JSON response',
              },
            };
          }
        } catch (error) {
          console.error('Upload exception:', error);
          return { data: null, error };
        }
      }

      console.log('[API] Updating restaurant without file, using PUT');
      return fetchAPI(`/restaurant`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },

  products: {
    list: async (slug?: string) => {
      if (slug) {
        return fetchAPI(`/restaurants/${slug}/products`);
      }

      return fetchAPI(`/products`);
    },
    getByCategory: async (slug: string, categoryId: string) => fetchAPI(`/restaurants/${slug}/products?category_id=${categoryId}`),
    create: async (data: ProductCreateData): Promise<ApiResponse<any>> => {
      if (data.image) {
        const formData = new FormData();
        formData.append('_method', 'POST');
        formData.append('name', data.name);
        formData.append('description', data.description || '');
        formData.append('price', String(data.price));
        formData.append('prep_time_minutes', String(data.prep_time_minutes));
        formData.append('category_id', String(data.category_id));
        if (data.image_url) formData.append('image_url', data.image_url);
        formData.append('image', data.image);
        
        const token = getToken();
        const headers = new Headers();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        
        try {
          const response = await fetch(buildApiUrl('/products'), {
            method: 'POST',
            body: formData,
            headers,
          });
          
          const text = await response.text();
          if (!response.ok) {
            return { data: null, error: { status: response.status, message: text.substring(0, 200) } };
          }
          
          return { data: JSON.parse(text) };
        } catch (error) {
          return { data: null, error };
        }
      }

      return fetchAPI(`/products`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: ProductUpdateData): Promise<ApiResponse<any>> => {
      if (data.image) {
        const formData = new FormData();
        formData.append('_method', 'PUT');
        if (data.name !== undefined) formData.append('name', data.name);
        if (data.description !== undefined) formData.append('description', data.description);
        if (data.price !== undefined) formData.append('price', String(data.price));
        if (data.prep_time_minutes !== undefined) formData.append('prep_time_minutes', String(data.prep_time_minutes));
        if (data.image_url !== undefined) formData.append('image_url', data.image_url);
        formData.append('image', data.image);
        
        const token = getToken();
        const headers = new Headers();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        
        try {
          const response = await fetch(buildApiUrl(`/products/${id}`), {
            method: 'POST',
            body: formData,
            headers,
          });
          
          const text = await response.text();
          if (!response.ok) {
            return { data: null, error: { status: response.status, message: text.substring(0, 200) } };
          }
          
          return { data: JSON.parse(text) };
        } catch (error) {
          return { data: null, error };
        }
      }

      return fetchAPI(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => fetchAPI(`/products/${id}`, {
      method: 'DELETE',
    }),
  },

  categories: {
    list: async (slug?: string) => {
      if (slug) {
        return fetchAPI(`/restaurants/${slug}/categories`);
      }

      return fetchAPI(`/categories`);
    },
    create: async (data: { name: string }) => fetchAPI(`/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: async (id: string, data: CategoryUpdateData) => fetchAPI(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: async (id: string) => fetchAPI(`/categories/${id}`, {
      method: 'DELETE',
    }),
  },

  tables: {
    list: async (slug?: string) => {
      if (slug) {
        return fetchAPI(`/restaurants/${slug}/tables`);
      }

      // Si pas de slug, lister les tables du restaurant connecté
      return fetchAPI(`/tables`);
    },
    create: async (data: { name: string }) => fetchAPI(`/tables`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: async (id: string, data: { name?: string; status?: string }) => fetchAPI(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    context: async (slug: string, tableId: string) => fetchAPI(`/restaurants/${slug}/tables/${tableId}/context`),
    delete: async (id: string) => fetchAPI(`/tables/${id}`, {
      method: 'DELETE',
    }),
  },

  orders: {
    list: async () => fetchAPI(`/orders`),
    create: async (data: {
      restaurant_id: string;
      items: { product_id: string | number; quantity: number }[];
      order_type: string;
      special_instructions: string;
      table_id: string | null;
      total: number;
      customer_phone?: string | null;
      customer_name?: string | null;
    }) => fetchAPI(`/orders`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getOne: async (id: string) => fetchAPI(`/orders/${id}`),
    updateStatus: async (id: string, status: string) => fetchAPI(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  },

  payments: {
    confirm: async (data: { order_id: string; method: 'fedapay'; customer_phone?: string | null }) => fetchAPI(`/payments/confirm`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    // Create a Fedapay checkout session and return a payment_url
    createCheckout: async (data: { order_id: string; customer_phone?: string | null; customer_name?: string | null; customer_email?: string | null }) => fetchAPI(`/payments/fedapay/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  stats: {
    get: async () => fetchAPI(`/dashboard/stats`),
  },

  kitchen: {
    access: async (code: string, restaurantSlug?: string) => fetchAPI(`/kitchen/access`, {
      method: 'POST',
      body: JSON.stringify({ code, restaurant_slug: restaurantSlug }),
    }),
    ordersBySlug: async (slug: string) => fetchAPI(`/kitchen/${slug}/orders`),
    updateOrderStatus: async (id: string, status: string, restaurantSlug: string) => fetchAPI(`/kitchen/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, restaurant_slug: restaurantSlug }),
    }),
  },
};

export const resolveMediaUrl = (value?: string | null) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;
  if (value.startsWith('/')) return value;
  // Use /api/media route to serve files
  return `/api/media/${value}`;
};
