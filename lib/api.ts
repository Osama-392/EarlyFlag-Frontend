import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Determine the correct login route based on stored user data and current URL
function getLoginRoute(): string {
  // First, check stored user data
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role === 'principal' || user.role === 'admin') {
        return '/principal-auth';
      }
    } catch (e) { }
  }

  // Fallback: check the current URL path to determine context
  // If we're on a principal page, redirect to principal login
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.startsWith('/principal')) {
      return '/principal-auth';
    }
  }

  return '/auth';
}

// Handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Normalize Pydantic validation error arrays or objects in response detail to strings
    // to prevent React child rendering crashes ({type, loc, msg, input, ctx})
    if (error.response?.data && typeof error.response.data === 'object') {
      const detail = (error.response.data as any).detail;
      if (Array.isArray(detail)) {
        (error.response.data as any).detail = detail.map((e: any) => {
          if (typeof e === 'object' && e !== null && e.msg) {
            const loc = Array.isArray(e.loc) && e.loc.length > 0 ? `${e.loc[e.loc.length - 1]}: ` : '';
            return `${loc}${e.msg}`;
          }
          return typeof e === 'string' ? e : JSON.stringify(e);
        }).join(', ');
      } else if (detail !== null && typeof detail === 'object') {
        (error.response.data as any).detail = detail.msg || detail.message || JSON.stringify(detail);
      }
    }

    const originalRequest = error.config as any;

    // Don't intercept auth endpoints (login, signup, refresh) —
    // let the calling code handle those errors directly
    const requestUrl = originalRequest?.url || '';
    if (
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/signup') ||
      requestUrl.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    // Handle 401 (Unauthorized) - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token, redirect to login
          const loginRoute = getLoginRoute();

          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          if (typeof window !== 'undefined') {
            window.location.href = loginRoute;
          }
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { access_token, refresh_token } = response.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        const loginRoute = getLoginRoute();

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
          window.location.href = loginRoute;
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 (Forbidden) - pending approval
    if (error.response?.status === 403) {
      const message = (error.response.data as any)?.detail || 'Access denied';
      if (message.includes('pending')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/pending-approval';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
