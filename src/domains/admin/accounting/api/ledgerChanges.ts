import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export type LedgerChangeReason = { changeReason: string };

export const putLedgerEntry = async <T>(url: string, body: object): Promise<T | false> => {
    try {
        const resp: SuccessGenericResponse<T> = await ApiClient.put(url, body);
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const deleteLedgerEntry = async <T>(url: string, reason: string): Promise<T | false> => {
    try {
        const resp: SuccessGenericResponse<T> = await ApiClient.delete(url, { data: { reason } });
        return resp.data;
    } catch (err) {
        return false;
    }
};

export type LedgerBooksResult<T> = T & { removed: boolean };

export const markLedgerBooks = async <T>(
    url: string,
    synced: boolean
): Promise<LedgerBooksResult<T> | false> => {
    try {
        const resp: SuccessGenericResponse<LedgerBooksResult<T>> = await ApiClient.patch(url, {
            synced,
        });
        return resp.data;
    } catch (err) {
        return false;
    }
};
