import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse, ApiErrorResponse } from './types';
import { useAuthStore } from '@/stores/auth-store';
import { useBusinessStore } from '@/stores/business-store';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
export const API_BASE = `${API_URL}/api/v1`;
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/** Custom error with code + field errors for forms. */
export class ApiError extends Error {
  code: string;
  status: number;
  fieldErrors: Record<string, string>;
  constructor(message: string, status: number, code = 'UNKNOWN', fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
type QueuedRequest = () => void;
let requestQueue: QueuedRequest[] = [];

function processQueue() {
  requestQueue.forEach((cb) => cb());
  requestQueue = [];
}

const instance: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
  withCredentials: true,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

/** Attach access token + tenant headers on every request. */
instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const businessId = useBusinessStore.getState().activeBusinessId;
  if (businessId) {
    config.headers['X-Business-Id'] = businessId;
  }
  const branchId = useBusinessStore.getState().activeBranchId;
  if (branchId) {
    config.headers['X-Branch-Id'] = branchId;
  }
  return config;
});

/** Normalize errors and handle 401 auto-refresh (single-flight). */
instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 -> attempt refresh once, then retry queued requests
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          requestQueue.push(() => {
            if (useAuthStore.getState().accessToken) {
              resolve(instance(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        processQueue();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return instance(originalRequest);
      } catch (refreshErr) {
        processQueue();
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const data = error.response?.data;
    const message = data?.message ?? error.message ?? 'Request failed';
    const code = data?.code ?? 'UNKNOWN';
    const status = error.response?.status ?? 0;
    const fieldErrors: Record<string, string> = {};
    if (data?.errors) {
      for (const e of data.errors) {
        if (e.field) fieldErrors[e.field] = e.message;
      }
    }
    return Promise.reject(new ApiError(message, status, code, fieldErrors));
  },
);

/** Single-flight token refresh. */
async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await axios.post<ApiResponse<{ accessToken: string; expiresIn: number }>>(
        `${API_BASE}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      const token = res.data.data.accessToken;
      useAuthStore.getState().setAccessToken(token);
      return token;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

/** Core typed request helper. */
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await instance.request<ApiResponse<T>>(config);
  return res.data.data;
}

export const http = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    request<T>({ method: 'GET', url, params }),
  post: <T>(url: string, data?: unknown) => request<T>({ method: 'POST', url, data }),
  patch: <T>(url: string, data?: unknown) => request<T>({ method: 'PATCH', url, data }),
  put: <T>(url: string, data?: unknown) => request<T>({ method: 'PUT', url, data }),
  delete: <T>(url: string) => request<T>({ method: 'DELETE', url }),
  /** Raw axios access for non-envelope responses (e.g. CSV downloads). */
  raw: instance,
};

/** API endpoint paths (relative to API_BASE). */
export const endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  businesses: {
    base: '/businesses',
    byId: (id: string) => `/businesses/${id}`,
    activate: (id: string) => `/businesses/${id}/activate`,
  },
  branches: {
    base: '/branches',
    byId: (id: string) => `/branches/${id}`,
    transfers: '/branches/transfers',
  },
  products: {
    base: '/products',
    byId: (id: string) => `/products/${id}`,
    import: '/products/import',
  },
  inventory: {
    stockIn: '/inventory/stock-in',
    stockOut: '/inventory/stock-out',
    adjustments: '/inventory/adjustments',
    movements: '/inventory/movements',
    balances: '/inventory/balances',
  },
  sales: {
    base: '/sales',
    byId: (id: string) => `/sales/${id}`,
    refund: (id: string) => `/sales/${id}/refunds`,
  },
  purchases: {
    base: '/purchases',
    byId: (id: string) => `/purchases/${id}`,
    receive: (id: string) => `/purchases/${id}/receive`,
  },
  expenses: { base: '/expenses', byId: (id: string) => `/expenses/${id}` },
  customers: { base: '/customers', byId: (id: string) => `/customers/${id}` },
  suppliers: { base: '/suppliers', byId: (id: string) => `/suppliers/${id}` },
  reports: {
    dashboard: '/reports/dashboard',
    sales: '/reports/sales',
    profitLoss: '/reports/profit-loss',
    inventory: '/reports/inventory',
    expenses: '/reports/expenses',
    cashier: '/reports/cashier',
    customerCredit: '/reports/customer-credit',
    supplier: '/reports/supplier',
  },
  staff: { base: '/staff', invitations: '/staff/invitations' },
  subscriptions: {
    current: '/subscriptions/current',
    plans: '/subscriptions/plans',
    paymentSubmissions: '/subscriptions/payment-submissions',
  },
  notifications: { base: '/notifications', markRead: (id: string) => `/notifications/${id}/read`, markAllRead: '/notifications/read-all' },
  support: { base: '/support/tickets', byId: (id: string) => `/support/tickets/${id}` },
  sync: { push: '/sync/push', pull: '/sync/pull' },
  settings: { base: '/settings' },
};
