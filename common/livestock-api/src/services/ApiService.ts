import { api } from '@config/livestock-config';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import commonErrors from '../errors/locales/modules/backend/common/tr';
import livestocktradingErrors from '../errors/locales/modules/backend/livestocktrading/tr';

/**
 * Backend hata kodunu okunabilir mesaja çevirir
 */
const getErrorMessage = (key: string): string => {
  const commonMap = commonErrors.translation.error as Record<string, string>;
  const moduleMap = livestocktradingErrors.translation.error as Record<string, string>;
  return moduleMap[key] || commonMap[key] || key;
};

export class ApiService {
  /**
   * Log API errors (web version - console only)
   */
  private static logApiError(error: any, context: string, additionalData?: any) {
    console.error(`🚨 API Error [${context}]:`, error);

    // Web'de crashlytics yok, sadece console log
    console.error('Error details:', {
      context,
      error_type: error?.response?.status ? 'http_error' : 'network_error',
      status_code: error?.response?.status || 'unknown',
      url: error?.config?.url || 'unknown',
      method: error?.config?.method || 'unknown',
      timestamp: new Date().toISOString(),
      ...additionalData,
    });
  }

  /**
   * Main call method used by auto-generated endpoints
   */
  static async call<T>(
    promise: Promise<AxiosResponse<{ payload: T; error: any; hasError: boolean }>>
  ): Promise<T> {
    try {
      const response = await promise;

      console.log('🔎 Raw API response:', JSON.stringify(response.data, null, 2));

      const { hasError, error, payload } = response.data;

      if (hasError) {
        const backendKey = error?.code || error?.message;
        const errorMessage = backendKey ? getErrorMessage(backendKey) : 'Bilinmeyen hata oluştu';

        this.logApiError(error, 'backend_error', {
          backend_error_code: backendKey,
          backend_error_message: error?.message,
          response_status: 'hasError_true',
        });

        // Web'de alert yerine sadece console error (toast eklenebilir)
        console.error('Backend error:', errorMessage);

        const enrichedError = new Error(errorMessage);
        (enrichedError as any).original = error;
        throw enrichedError;
      }

      return payload;
    } catch (err: any) {
      // Log the full error response for debugging
      if (err?.response) {
        console.error('❌ API Error Response:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          url: err.config?.url,
        });
      }

      // 401 handling is done by the axios response interceptor in livestock-config.ts
      // which automatically refreshes tokens and retries the request

      // Other errors
      this.logApiError(err, 'network_error', {
        error_message: err?.message,
        error_name: err?.name,
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

      console.error('Multipart upload error:', errorMessage);

      const enrichedError = new Error(errorMessage);
      (enrichedError as any).original = data.error;
      throw enrichedError;
    }

    return payload as T;
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
    } catch (error: any) {
      if (error.response) {
        throw {
          success: false,
          message: error.response.data?.message || 'An error occurred',
          data: error.response.data,
          status: error.response.status,
        };
      }
      throw {
        success: false,
        message: error.message || 'Network error',
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
