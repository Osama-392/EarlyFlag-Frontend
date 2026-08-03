const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getLoginRoute(): string {
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role === 'principal' || user.role === 'admin') {
        return '/principal-auth';
      }
    } catch (e) { }
  }
  if (typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/principal')) return '/principal-auth';
  }
  return '/auth';
}

function handle401() {
  const loginRoute = getLoginRoute();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = loginRoute;
  }
}

async function handleResponse(response: Response, isAuthRoute: boolean, config?: any) {
  if (response.ok) {
    if (config?.responseType === 'blob') {
      const data = await response.blob();
      return { data };
    }
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }
    return { data };
  }

  const text = await response.text();
  let errorData: any = {};
  try {
    errorData = text ? JSON.parse(text) : {};
  } catch (e) {
    errorData = { detail: text };
  }

  // Flatten pydantic errors
  if (errorData && typeof errorData === 'object') {
    const detail = errorData.detail;
    if (Array.isArray(detail)) {
      errorData.detail = detail.map((e: any) => {
        if (typeof e === 'object' && e !== null && e.msg) {
          const loc = Array.isArray(e.loc) && e.loc.length > 0 ? `${e.loc[e.loc.length - 1]}: ` : '';
          return `${loc}${e.msg}`;
        }
        return typeof e === 'string' ? e : JSON.stringify(e);
      }).join(', ');
    } else if (detail !== null && typeof detail === 'object') {
      errorData.detail = detail.msg || detail.message || JSON.stringify(detail);
    }
  }

  const errorObj = {
    response: {
      status: response.status,
      data: errorData
    }
  };

  if (isAuthRoute) {
    throw errorObj;
  }

  if (response.status === 403 && typeof errorData.detail === 'string' && errorData.detail.includes('pending')) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/pending-approval';
    }
    throw errorObj;
  }

  throw errorObj;
}

async function fetchWithRetry(url: string, options: RequestInit = {}, config?: any): Promise<any> {
  const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/refresh');
  
  let token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && !isAuthRoute) {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (!refreshToken) {
      handle401();
      throw { response: { status: 401, data: { detail: 'Unauthorized' } } };
    }

    try {
      const refreshRes = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!refreshRes.ok) {
        handle401();
        throw { response: { status: 401, data: { detail: 'Session expired' } } };
      }

      const { access_token, refresh_token } = await refreshRes.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
      }

      // Retry with new token
      headers.set('Authorization', `Bearer ${access_token}`);
      response = await fetch(url, { ...options, headers });
    } catch (refreshErr) {
      handle401();
      throw refreshErr;
    }
  }

  return handleResponse(response, isAuthRoute, config);
}

function buildUrl(endpoint: string, config?: { params?: Record<string, any> }) {
  let url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  if (config?.params) {
    const urlObj = new URL(url);
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });
    url = urlObj.toString();
  }
  return url;
}

const api = {
  get: <T = any>(url: string, config?: any) => fetchWithRetry(buildUrl(url, config), { method: 'GET' }, config),
  post: <T = any>(url: string, data?: any, config?: any) => fetchWithRetry(buildUrl(url, config), { method: 'POST', body: data ? JSON.stringify(data) : undefined }, config),
  put: <T = any>(url: string, data?: any, config?: any) => fetchWithRetry(buildUrl(url, config), { method: 'PUT', body: data ? JSON.stringify(data) : undefined }, config),
  patch: <T = any>(url: string, data?: any, config?: any) => fetchWithRetry(buildUrl(url, config), { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }, config),
  delete: <T = any>(url: string, config?: any) => fetchWithRetry(buildUrl(url, config), { method: 'DELETE' }, config),
  postForm: <T = any>(url: string, data: FormData, config?: any) => fetchWithRetry(buildUrl(url, config), { method: 'POST', body: data }, config),
};

export default api;
