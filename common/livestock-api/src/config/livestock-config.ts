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
  GoogleWebClientId: '983073672409-j7v2vi68dfh52gt3ahjjda2otpmmfh6q.apps.googleusercontent.com',
  GooglePlacesApiKey: 'AIzaSyCAth2kFsXa9W9uQTftAVpJ9fFaBi76KG0',

  // Company ID
  DefaultCompanyId: '9dae9cbd-82b1-4ead-bd2b-9c5fe5146a2a',
  companyId: '9dae9cbd-82b1-4ead-bd2b-9c5fe5146a2a',
};

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: AppConfig.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token and fix ONLY IAM URL paths
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // accessToken'ı önce dene, yoksa jwt'yi kullan
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // SADECE IAM endpoint'leri için lowercase yap
    // IAM: /iam/Auth/SendOtp -> /iam/auth/SendOtp
    // LivestockTrading: /livestocktrading/Students/All -> /livestocktrading/Students/All (DEĞİŞMEZ)
    // FileProvider: /fileprovider/Buckets/Detail -> /fileprovider/Buckets/Detail (DEĞİŞMEZ)
    if (config.url && config.url.includes('/iam/')) {
      try {
        const url = new URL(config.url, config.baseURL || AppConfig.apiUrl);
        const pathParts = url.pathname.split('/');

        // IAM için: /iam/Auth/SendOtp -> /iam/auth/SendOtp
        if (pathParts.length >= 3 && pathParts[1] === 'iam') {
          pathParts[2] = pathParts[2].toLowerCase();
          config.url = url.origin + pathParts.join('/');
        }
      } catch (e) {
        // URL parsing error - keep original URL
        console.error('URL parsing error:', e);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - try to refresh
      if (typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const response = await axios.post(`${AppConfig.apiUrl}/iam/auth/RefreshToken`, {
              refreshToken,
              platform: 0, // Web
            });

            if (response.data?.payload) {
              const { jwt } = response.data.payload;
              localStorage.setItem('jwt', jwt);
              localStorage.setItem('accessToken', jwt);
              localStorage.setItem('refreshToken', response.data.payload.refreshToken);

              // Retry the original request
              error.config.headers.Authorization = `Bearer ${jwt}`;
              return api.request(error.config);
            }
          } catch (refreshError) {
            // Refresh failed - logout
            localStorage.removeItem('jwt');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/auth/login';
          }
        } else {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
