import { api } from '@/config/livestock-config';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '@/lib/logger';

// Import error locales — Turkish is the source, others loaded on demand
import commonErrorsTr from '../errors/locales/modules/backend/common/tr';
import livestocktradingErrorsTr from '../errors/locales/modules/backend/livestocktrading/tr';

type ErrorMap = Record<string, string>;

// Cache for loaded locale error maps
const localeErrorCache: Record<string, { common: ErrorMap; module: ErrorMap }> = {
  tr: {
    common: commonErrorsTr.translation.error as ErrorMap,
    module: livestocktradingErrorsTr.translation.error as ErrorMap,
  },
};

/**
 * Get current UI locale from <html lang="...">
 */
const getCurrentLocale = (): string => {
  if (typeof document !== 'undefined') {
    return document.documentElement.lang || 'tr';
  }
  return 'tr';
};

/**
 * Dynamically load error locale files (cached after first load)
 */
const loadLocaleErrors = async (locale: string): Promise<void> => {
  if (localeErrorCache[locale]) return;
  try {
    const [common, module] = await Promise.all([
      import(`../errors/locales/modules/backend/common/${locale}`),
      import(`../errors/locales/modules/backend/livestocktrading/${locale}`),
    ]);
    localeErrorCache[locale] = {
      common: common.default.translation.error as ErrorMap,
      module: module.default.translation.error as ErrorMap,
    };
  } catch {
    // Locale not available, will fallback to Turkish
  }
};

// Pre-load the active locale on module init (non-blocking)
if (typeof window !== 'undefined') {
  const locale = getCurrentLocale();
  if (locale !== 'tr') {
    loadLocaleErrors(locale);
  }
}

/**
 * Backend hata kodunu kullanıcının diline çevirir.
 * Aktif locale cache'de yoksa Turkish fallback kullanır.
 */
const getErrorMessage = (key: string): string => {
  const locale = getCurrentLocale();
  const cached = localeErrorCache[locale] || localeErrorCache['tr'];
  return cached.module[key] || cached.common[key] || key;
};

export class ApiService {
  /**
   * Log API errors — verbose in development, minimal in production
   */
  private static logApiError(error: unknown, context: string, additionalData?: Record<string, unknown>) {
    const axiosErr = error as { response?: { status?: number }; config?: { url?: string; method?: string } };

    logger.error(`API Error [${context}]:`, {
      status: axiosErr.response?.status || 'unknown',
      url: axiosErr.config?.url || 'unknown',
    });

    logger.debug('Error details:', {
      context,
      error_type: axiosErr.response?.status ? 'http_error' : 'network_error',
      status_code: axiosErr.response?.status || 'unknown',
      url: axiosErr.config?.url || 'unknown',
      method: axiosErr.config?.method || 'unknown',
      timestamp: new Date().toISOString(),
      ...additionalData,
    });
  }

  /**
   * Main call method used by auto-generated endpoints
   */
  static async call<T>(
    promise: Promise<AxiosResponse<{ payload: T; error: { message?: string; code?: string } | null; hasError: boolean }>>
  ): Promise<T> {
    try {
      const response = await promise;

      const { hasError, error, payload } = response.data;

      if (hasError) {
        const backendKey = error?.code || error?.message;
        const errorMessage = backendKey ? getErrorMessage(backendKey) : 'Bilinmeyen hata oluştu';

        this.logApiError(error, 'backend_error', {
          backend_error_code: backendKey,
          backend_error_message: error?.message,
          response_status: 'hasError_true',
        });

        logger.debug('Backend error:', errorMessage);

        const enrichedError = new Error(errorMessage);
        (enrichedError as Error & { original: unknown }).original = error;
        throw enrichedError;
      }

      return payload;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; statusText?: string; data?: unknown }; config?: { url?: string }; message?: string; name?: string };
      if (axiosErr.response) {
        logger.debug('API Error Response:', {
          status: axiosErr.response.status,
          statusText: axiosErr.response.statusText,
          data: axiosErr.response.data,
          url: axiosErr.config?.url,
        });
      }

      // 401 handling is done by the axios response interceptor in livestock-config.ts
      // which automatically refreshes tokens and retries the request

      // Other errors
      this.logApiError(err, 'network_error', {
        error_message: axiosErr.message,
        error_name: axiosErr.name,
        network_error: 'true',
      });

      throw err;
    }
  }

  /**
   * Multipart form data upload (for file uploads)
   */
  static async callMultipart<T>(
    url: string,
    formData: FormData,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      // Use the `api` instance so the request/response interceptors handle
      // token injection and 401 refresh automatically
      const response = await api.post(url, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(config.headers || {}),
        },
      });

      // Bazı servisler payload'ı doğrudan dönüyor
      const data = response.data;
      const payload = data?.payload ?? data;

      if (data.hasError) {
        const backendKey = data.error?.code || data.error?.message;
        const errorMessage = backendKey ? getErrorMessage(backendKey) : 'Bilinmeyen hata oluştu';

        this.logApiError(data.error, 'multipart_error', {
          backend_error_code: backendKey,
          backend_error_message: data.error?.message,
          multipart_upload: 'true',
        });

        logger.debug('Multipart upload error:', errorMessage);

        const enrichedError = new Error(errorMessage);
        (enrichedError as Error & { original: unknown }).original = data.error;
        throw enrichedError;
      }

      return payload as T;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; statusText?: string; data?: unknown }; config?: { url?: string }; message?: string; name?: string };
      if (axiosErr.response) {
        logger.debug('Multipart Error Response:', {
          status: axiosErr.response.status,
          statusText: axiosErr.response.statusText,
          data: axiosErr.response.data,
          url: axiosErr.config?.url,
        });
      }

      this.logApiError(err, 'multipart_network_error', {
        error_message: axiosErr.message,
        error_name: axiosErr.name,
        multipart_upload: 'true',
      });

      throw err;
    }
  }

  /**
   * Generic HTTP request method
   */
  static async request<TResponse>(
    config: AxiosRequestConfig
  ): Promise<TResponse> {
    try {
      const response = await api.request<TResponse>(config);
      return response.data;
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
      if (axiosErr.response) {
        throw {
          success: false,
          message: axiosErr.response.data?.message || 'An error occurred',
          data: axiosErr.response.data,
          status: axiosErr.response.status,
        };
      }
      throw {
        success: false,
        message: axiosErr.message || 'Network error',
        data: null,
      };
    }
  }

  /**
   * GET request
   */
  static async get<TResponse>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    return this.request<TResponse>({
      ...config,
      method: 'GET',
      url,
    });
  }

  /**
   * POST request
   */
  static async post<TRequest, TResponse>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    return this.request<TResponse>({
      ...config,
      method: 'POST',
      url,
      data,
    });
  }

  /**
   * PUT request
   */
  static async put<TRequest, TResponse>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    return this.request<TResponse>({
      ...config,
      method: 'PUT',
      url,
      data,
    });
  }

  /**
   * DELETE request
   */
  static async delete<TResponse>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    return this.request<TResponse>({
      ...config,
      method: 'DELETE',
      url,
    });
  }

  /**
   * PATCH request
   */
  static async patch<TRequest, TResponse>(
    url: string,
    data?: TRequest,
    config?: AxiosRequestConfig
  ): Promise<TResponse> {
    return this.request<TResponse>({
      ...config,
      method: 'PATCH',
      url,
      data,
    });
  }
}
