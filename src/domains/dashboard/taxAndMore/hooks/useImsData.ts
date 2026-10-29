/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getImsList,
    getImsSaveHistory,
    proceedIms,
    resetImsInvoice,
    saveIms,
    searchGstin,
    updateImsInvoiceAction,
} from '../api/tax';
import { ImsDataResponse, ImsHistoryEntry, ItcEstimate } from '../types';

const supplierNameCache = new Map<string, string>();

interface ImsParams {
    gstin: string;
    financialYear: string;
    month: number;
    tab?: string;
    actionFilter?: string;
    page?: number;
    limit?: number;
    search?: string;
}

const useImsData = (params: ImsParams | null) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [imsData, setImsData] = useState<ImsDataResponse | null>(null);
    const [itcEstimate, setItcEstimate] = useState<ItcEstimate | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [isProceeding, setIsProceeding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveHistory, setSaveHistory] = useState<ImsHistoryEntry[]>([]);

    const fetchImsData = useCallback(async () => {
        if (!params?.gstin || !params?.financialYear || !params?.month) return;
        setIsLoading(true);
        const [data, history] = await Promise.all([
            getImsList({
                userId: id,
                userType: role,
                gstin: params.gstin,
                financialYear: params.financialYear,
                month: params.month,
                ...(params.tab ? { tab: params.tab } : {}),
                ...(params.actionFilter ? { actionFilter: params.actionFilter } : {}),
                ...(params.page ? { page: params.page } : {}),
                ...(params.limit ? { limit: params.limit } : {}),
                ...(params.search ? { search: params.search } : {}),
            }),
            getImsSaveHistory({ userId: id, userType: role, ...params }),
        ]);
        if (data) {
            const uncached = data.suppliers.filter(
                s => !s.supplierName && !supplierNameCache.has(s.supplierGstin)
            );
            if (uncached.length > 0) {
                const lookups = await Promise.all(
                    uncached.map(s =>
                        searchGstin({ userId: id, userType: role, gstin: s.supplierGstin })
                    )
                );
                uncached.forEach((s, i) => {
                    const r = lookups[i];
                    const name = r ? r.data?.tradeNam || r.data?.lgnm : null;
                    if (name) supplierNameCache.set(s.supplierGstin, name);
                });
            }
            data.suppliers.forEach(s => {
                if (!s.supplierName)
                    s.supplierName = supplierNameCache.get(s.supplierGstin) ?? null;
            });
            setImsData(data);
            setItcEstimate(data.itcEstimate ?? null);
        }
        if (history) setSaveHistory(history);
        setIsLoading(false);
    }, [
        id,
        role,
        params?.gstin,
        params?.financialYear,
        params?.month,
        params?.tab,
        params?.actionFilter,
        params?.page,
        params?.search,
    ]);  

    const actionInvoice = useCallback(
        async (invoiceId: string, imsAction: 'accepted' | 'rejected' | 'pending' | 'noaction') => {
            setActioningId(invoiceId);
            const resp =
                imsAction === 'noaction'
                    ? await resetImsInvoice({
                          userId: id,
                          userType: role,
                          gstin: params!.gstin,
                          financialYear: params!.financialYear,
                          month: params!.month,
                          invoiceIds: [Number(invoiceId)],
                      })
                    : await updateImsInvoiceAction({
                          userId: id,
                          userType: role,
                          id: invoiceId,
                          imsAction,
                      });
            if (resp && resp.status) {
                setHasUnsavedChanges(true);
                await fetchImsData();
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setActioningId(null);
        },
        [id, role, dispatch, fetchImsData]
    );

    const save = useCallback(async () => {
        if (!params?.gstin || !params?.financialYear || !params?.month) return false;
        setIsSaving(true);
        const resp = await saveIms({
            userId: id,
            userType: role,
            gstin: params.gstin,
            financialYear: params.financialYear,
            month: params.month,
        });
        if (resp && resp.status) {
            setHasUnsavedChanges(false);
            dispatch(showToast({ description: resp.message, variant: 'success' }));
            await fetchImsData();
            setIsSaving(false);
            return true;
        }
        if (resp && !resp.status) {
            dispatch(showToast({ description: resp.message, variant: 'error' }));
        }
        setIsSaving(false);
        return false;
    }, [id, role, params?.gstin, params?.financialYear, params?.month, dispatch, fetchImsData]);

    const proceed = useCallback(async () => {
        if (!params?.gstin || !params?.financialYear || !params?.month) return false;
        setIsProceeding(true);
        const resp = await proceedIms({
            userId: id,
            userType: role,
            gstin: params.gstin,
            financialYear: params.financialYear,
            month: params.month,
        });
        if (resp && resp.status) {
            setItcEstimate(resp.data.itcEstimate);
            dispatch(showToast({ description: resp.message, variant: 'success' }));
            setIsProceeding(false);
            return true;
        }
        setIsProceeding(false);
        return false;
    }, [id, role, params?.gstin, params?.financialYear, params?.month, dispatch]);

    useEffect(() => {
        fetchImsData();
    }, [fetchImsData]);

    return {
        imsData,
        itcEstimate,
        saveHistory,
        isLoading,
        actioningId,
        isSaving,
        hasUnsavedChanges,
        isProceeding,
        actionInvoice,
        save,
        proceed,
        refresh: fetchImsData,
    };
};

export default useImsData;
