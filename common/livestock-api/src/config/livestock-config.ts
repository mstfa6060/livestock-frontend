/// <reference lib="dom" />

import axios, { AxiosInstance } from 'axios';

// Environment configuration
const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';

// API Configuration
const baseURL = isDevelopment
  ? 'https://dev-api.livestock-trading.com'
  : 'https://api.livestock-trading.com';

export const AppConfig = {
  // Base API URL
  BaseApi: baseURL + '/',
  apiUrl: baseURL,

  // LivestockTrading için URL
  LivestockTradingUrl: isDevelopment
    ? `${baseURL}/livestocktrading`   // Development: /livestocktrading prefix var
    : baseURL,                         // Production: prefix yok
  IAMUrl: `${baseURL}/iam`,
  FileProviderUrl: `${baseURL}/fileprovider`,
  FileStorageBaseUrl: `${baseURL}/file-storage/`,

  // Google API credentials
  GoogleWebClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  GooglePlacesApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '',

  // Company ID
  DefaultCompanyId: process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID || '',
  companyId: process.env.NEXT_PUBLIC_DEFAULT_COMPANY_ID || '',
};

// Create custom axios instance (used by ApiService.callMultipart, request, etc.)
export const api: AxiosInstance = axios.create({
  baseURL: AppConfig.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token injection helper
const addAuthToken = (config: any) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
};

// IAM URL lowercase fix helper
const fixIamUrl = (config: any) => {
  if (config.url && config.url.includes('/iam/')) {
    try {
      const url = new URL(config.url, config.baseURL || AppConfig.apiUrl);
      const pathParts = url.pathname.split('/');
      if (pathParts.length >= 3 && pathParts[1] === 'iam') {
        pathParts[2] = pathParts[2].toLowerCase();
        config.url = url.origin + pathParts.join('/');
      }
    } catch {
      // URL parsing error - keep original URL
    }
  }
  return config;
};

// Plain axios instance for refresh requests — no interceptors to avoid:
// 1. Adding expired auth token to refresh request
// 2. Re-entering handle401 if refresh itself returns 401 (deadlock)
const refreshClient = axios.create();

// 401 handler with token refresh (prevents concurrent refresh attempts)
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

const handle401 = async (error: any) => {
  if (error.response?.status !== 401) return Promise.reject(error);
  if (typeof window === 'undefined') return Promise.reject(error);

  const originalRequest = error.config;
  if (originalRequest._retry) return Promise.reject(error);

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: (token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axios(originalRequest));
        },
        reject,
      });
    });
  }

  originalRequest._retry = true;
  isRefreshing = true;

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    isRefreshing = false;
    localStorage.removeItem('jwt');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    return Promise.reject(error);
  }

  try {
    const response = await refreshClient.post(`${AppConfig.apiUrl}/iam/auth/RefreshToken`, {
      refreshToken,
      platform: 0,
    });

    if (response.data?.payload) {
      const { jwt } = response.data.payload;
      localStorage.setItem('jwt', jwt);
      localStorage.setItem('accessToken', jwt);
      localStorage.setItem('refreshToken', response.data.payload.refreshToken);

      processQueue(null, jwt);

      originalRequest.headers.Authorization = `Bearer ${jwt}`;
      return axios(originalRequest);
    }
  } catch (refreshError) {
    processQueue(refreshError, null);
    localStorage.removeItem('jwt');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }

  return Promise.reject(error);
};

// Apply interceptors to the DEFAULT axios instance
// (auto-generated API files use `axios.post()` directly)
axios.interceptors.request.use(
  (config) => fixIamUrl(addAuthToken(config)),
  (error) => Promise.reject(error)
);
axios.interceptors.response.use((response) => response, handle401);

// Apply same interceptors to the custom `api` instance
// (used by ApiService.callMultipart, request, get, post, etc.)
api.interceptors.request.use(
  (config) => fixIamUrl(addAuthToken(config)),
  (error) => Promise.reject(error)
);
api.interceptors.response.use((response) => response, handle401);
