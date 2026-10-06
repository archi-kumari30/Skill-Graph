import axios from 'axios';

// Normalize API URL to ensure baseURL consistently points to /api
const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
export const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

const cache = new Map();
const CACHE_TTL_MS = 30000; // 30 seconds

export const clearApiCache = (pattern) => {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// Interceptor to inject the JWT auth token and serve fresh GET cache
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('skillgraph_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // In-memory GET caching to prevent redundant roundtrips on tab switching
    const method = config.method?.toLowerCase();
    if (method === 'get' && !config.skipCache) {
      const cacheKey = `${config.url}_${JSON.stringify(config.params || {})}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        config.adapter = () =>
          Promise.resolve({
            data: cached.data,
            status: 200,
            statusText: 'OK',
            headers: cached.headers || {},
            config
          });
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor to handle global errors, cache population/invalidation, and automatic token refresh
api.interceptors.response.use(
  (response) => {
    const config = response.config;
    const method = config?.method?.toLowerCase();

    // Cache successful GET responses
    if (method === 'get' && !config?.skipCache) {
      const cacheKey = `${config.url}_${JSON.stringify(config.params || {})}`;
      cache.set(cacheKey, {
        data: response.data,
        headers: response.headers,
        timestamp: Date.now()
      });
    }

    // Invalidate related cache keys on mutating requests (POST, PUT, DELETE, PATCH)
    if (['post', 'put', 'delete', 'patch'].includes(method)) {
      const url = config?.url || '';
      if (url.includes('/skills')) {
        clearApiCache('/skills');
        clearApiCache('/dashboard');
        clearApiCache('/skill-gap');
        clearApiCache('/recommendations');
      } else if (url.includes('/learning') || url.includes('/progress')) {
        clearApiCache('/learning');
        clearApiCache('/dashboard');
        clearApiCache('/recommendations');
      } else if (url.includes('/assessments')) {
        clearApiCache('/assessments');
        clearApiCache('/skills');
        clearApiCache('/dashboard');
        clearApiCache('/skill-gap');
        clearApiCache('/activity');
      } else if (url.includes('/projects')) {
        clearApiCache('/projects');
        clearApiCache('/dashboard');
        clearApiCache('/activity');
      } else if (url.includes('/activity')) {
        clearApiCache('/activity');
        clearApiCache('/dashboard');
      } else if (url.includes('/jobs') || url.includes('/applications')) {
        clearApiCache('/jobs');
        clearApiCache('/applications');
        clearApiCache('/dashboard');
      } else if (url.includes('/users')) {
        clearApiCache('/users');
        clearApiCache('/dashboard');
      } else if (url.includes('/team')) {
        clearApiCache('/team');
      } else {
        clearApiCache();
      }
    }

    // If the response contains standard success/data envelope, return the data part directly
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Standardized message extraction
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    // Check if 401 and not already retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt silent token refresh via HTTP-only cookie
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken =
          refreshResponse.data?.data?.accessToken ||
          refreshResponse.data?.data?.token;

        if (newAccessToken) {
          localStorage.setItem('skillgraph_token', newAccessToken);
          localStorage.setItem('token', newAccessToken);
          if (refreshResponse.data?.data?.user) {
            localStorage.setItem('user', JSON.stringify(refreshResponse.data.data.user));
          }

          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          isRefreshing = false;

          return api(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;

        // Auto-logout user on failed refresh
        if (localStorage.getItem('token') || localStorage.getItem('skillgraph_token')) {
          localStorage.removeItem('skillgraph_token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login?expired=true';
        }

        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
    }

    // Auto-logout user on unauthorized status 401 if refresh is not applicable
    if (
      error.response?.status === 401 &&
      (localStorage.getItem('token') || localStorage.getItem('skillgraph_token')) &&
      originalRequest?.url?.includes('/auth/refresh')
    ) {
      localStorage.removeItem('skillgraph_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=true';
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
