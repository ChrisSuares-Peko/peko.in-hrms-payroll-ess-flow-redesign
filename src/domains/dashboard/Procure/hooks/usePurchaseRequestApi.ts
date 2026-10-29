import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    addEmployee,
    cancelPurchaseRequest,
    createPurchaseRequest,
    deletePurchaseRequest,
    getEmployee,
    getPurchaseRequestById,
    getPurchaseRequests,
    getPurchaseRequestsDropdown,
    reopenPurchaseRequest,
    updatePurchaseRequest,
} from '../api/index';
import { CreatePurchaseRequestPayload, PurchaseRequestDetail, PurchaseRequestFilters, UpdatePurchaseRequestPayload } from '../types';

export function usePurchaseRequestApi(id?: string, filters?: PurchaseRequestFilters, loadEmployees?: boolean) {
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [detail, setDetail] = useState<PurchaseRequestDetail | null>(null);
    const [tableData, setTableData] = useState<any[]>([]);
    const [count, setCount] = useState(0);
    const [employees, setEmployees] = useState<any[]>([]);
    const [dropdownData, setDropdownData] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        if (!filters) return;
        const { search, status, startDate, endDate, page, limit } = filters;
        setIsLoading(true);
        const data: any = await getPurchaseRequests({ corporateId: String(corporateId), search, status, startDate, endDate, page, limit });
        if (data) {
            setTableData(data.rows ?? []);
            setCount(data.count ?? 0);
        }
        setIsLoading(false);
    }, [filters, corporateId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fetchDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        const data = await getPurchaseRequestById({ corporateId: String(corporateId), id });
        if (data) setDetail(data);
        setIsLoading(false);
    }, [corporateId, id]);

    useEffect(() => { fetchDetail(); }, [fetchDetail]);

    const create = async (payload: CreatePurchaseRequestPayload): Promise<PurchaseRequestDetail | false> => {
        setIsLoading(true);
        const result = await createPurchaseRequest({ corporateId: String(corporateId), payload });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        }
        setIsLoading(false);
        return result ? result.data : false;
    };

    const update = async (recordId: string | number, payload: UpdatePurchaseRequestPayload): Promise<PurchaseRequestDetail | false> => {
        setIsLoading(true);
        const result = await updatePurchaseRequest({ corporateId: String(corporateId), id: recordId, payload });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to update purchase request. Please try again.' }));
        }
        setIsLoading(false);
        return result ? result.data : false;
    };

    const remove = async (recordId: string | number): Promise<boolean> => {
        setIsLoading(true);
        const data = await deletePurchaseRequest({ corporateId: String(corporateId), id: recordId });
        setIsLoading(false);
        return data;
    };

    const cancel = async (recordId: string | number): Promise<boolean> => {
        setIsLoading(true);
        const result = await cancelPurchaseRequest({ corporateId: String(corporateId), id: recordId });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to cancel purchase request. Please try again.' }));
        }
        setIsLoading(false);
        return !!result;
    };

    const reopen = async (recordId: string | number): Promise<boolean> => {
        setIsLoading(true);
        const result = await reopenPurchaseRequest({ corporateId: String(corporateId), id: recordId });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to re-open purchase request. Please try again.' }));
        }
        setIsLoading(false);
        return !!result;
    };

    const fetchDropdownData = useCallback(async () => {
        const data: any = await getPurchaseRequestsDropdown({ corporateId: String(corporateId) });
        if (data) setDropdownData(Array.isArray(data) ? data : (data.data ?? data.rows ?? []));
    }, [corporateId]);

    const fetchEmployees = useCallback(async () => {
        const data = await getEmployee({ corporateId: String(corporateId) });
        if (data) setEmployees(data.employees ?? []);
    }, [corporateId]);

    useEffect(() => {
        if (loadEmployees) fetchEmployees();
    }, [fetchEmployees, loadEmployees]);

    const createEmployee = async (payload: any): Promise<any | false> => {
        const result = await addEmployee({ corporateId: String(corporateId), payload });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
            await fetchEmployees();
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to add employee. Please try again.' }));
        }
        return result ? result.data : false;
    };

    return { isLoading, tableData, count, fetchData, detail, fetchDetail, create, update, remove, cancel, reopen, employees, createEmployee, dropdownData, fetchDropdownData };
}
