import axios, { type AxiosRequestConfig } from 'axios';

import {
    clearEInvoiceAuth,
    setForcedLogout,
} from '@domains/dashboard/invoiceV2/slices/eInvoiceAuthSlice';
import { store } from '@store/store';
import type { RootState } from '@store/store';

import { ApiClient } from './config';

const getEInvoiceToken = (): Record<string, string> => {
    const { authToken } = (store.getState() as RootState).reducer.eInvoiceAuth;
    return authToken ? { AuthToken: authToken } : {};
};

const withEInvoiceToken = (config?: AxiosRequestConfig): AxiosRequestConfig => ({
    ...config,
    headers: { ...config?.headers, ...getEInvoiceToken() },
});

let isHandlingExpiry = false;

const isEInvoiceExpiry = (error: unknown): boolean => {
    if (!axios.isAxiosError(error) || !error.response) return false;
    if (error.response.status === 401) return true;
    const data = error.response.data as { message?: string; responseCode?: string };
    if (data?.responseCode === '401') return true;
    const msg = (data?.message ?? '').toLowerCase();
    return msg.includes('session expired') || msg.includes('invalid token');
};

const handleEInvoiceError = (error: unknown): never => {
    if (isEInvoiceExpiry(error)) {
        store.dispatch(clearEInvoiceAuth());
        if (!isHandlingExpiry) {
            isHandlingExpiry = true;
            store.dispatch(setForcedLogout(true));
            // if (!window.location.pathname.includes('e-invoicing-sign-in')) {
            //     window.location.replace('/invoicing/e-invoicing-sign-in');
            // }
            setTimeout(() => {
                isHandlingExpiry = false;
            }, 5000);
        }
    }
    throw error;
};

// Proxy over ApiClient — inherits full Peko JWT refresh + error handling.
// Adds AuthToken header for e-invoice APIs. Session expiry clears eInvoiceAuth only (no Peko logout).
export const EInvoiceApiClient = {
    get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
        ApiClient.get<never, T>(url, withEInvoiceToken(config)).catch(handleEInvoiceError),
    post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        ApiClient.post<never, T>(url, data, withEInvoiceToken(config)).catch(handleEInvoiceError),
    put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        ApiClient.put<never, T>(url, data, withEInvoiceToken(config)).catch(handleEInvoiceError),
    delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
        ApiClient.delete<never, T>(url, withEInvoiceToken(config)).catch(handleEInvoiceError),
    patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        ApiClient.patch<never, T>(url, data, withEInvoiceToken(config)).catch(handleEInvoiceError),
};
