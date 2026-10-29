import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createVendor, deleteVendor, getVendorById, getVendors, getVendorsWithoutPagination, importVendorsCSV, updateVendor } from '../api';
import { CreateVendorPayload, Vendor, VendorDetail, VendorFilters } from '../types';

export function useVendor(id?: string, filters?: VendorFilters) {
    const { corporateId } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [detail, setDetail] = useState<VendorDetail | null>(null);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [count, setCount] = useState(0);

    const fetchVendors = useCallback(async () => {
        if (!filters) return;
        setIsLoading(true);
        const data = await getVendors({ corporateId: String(corporateId), ...filters });
        if (data) {
            setVendors(data.rows ?? []);
            setCount(data.count ?? 0);
        }
        setIsLoading(false);
    }, [filters, corporateId]);

    const fetchVendorsWithoutPagination = useCallback(async () => {
        setIsLoading(true);
        const data = await getVendorsWithoutPagination({ corporateId: String(corporateId) });
        if (data) setVendors(data);
        setIsLoading(false);
    }, [corporateId]);
    const fetchDetail = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        const data = await getVendorById({ corporateId: String(corporateId), id });
        if (data) {
            setDetail(data);
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to load vendor details.' }));
        }
        setIsLoading(false);
    }, [corporateId, id, dispatch]);

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const create = useCallback(async (payload: CreateVendorPayload): Promise<boolean> => {
        setIsSubmitting(true);
        const result = await createVendor({ corporateId: String(corporateId), ...payload });
        if (result && !('error' in result)) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        } else if (!result || ('error' in result && result.responseCode !== '409')) {
            dispatch(showToast({ variant: 'error', description: 'Failed to create vendor. Please try again.' }));
        } else if ('error' in result) {
            dispatch(showToast({ variant: 'error', description: result.error }));
        }
        setIsSubmitting(false);
        return !!(result && !('error' in result));
    }, [corporateId, dispatch]);

    const update = useCallback(async (vendorId: string | number, payload: CreateVendorPayload): Promise<boolean> => {
        setIsSubmitting(true);
        const result = await updateVendor({ corporateId: String(corporateId), id: vendorId, ...payload });
        if (result && !('error' in result)) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        } else if (!result || ('error' in result && result.responseCode !== '409')) {
            dispatch(showToast({ variant: 'error', description: 'Failed to update vendor. Please try again.' }));
        } else if ('error' in result) {
            dispatch(showToast({ variant: 'error', description: result.error }));
        }
        setIsSubmitting(false);
        return !!(result && !('error' in result));
    }, [corporateId, dispatch]);

    const importCSV = useCallback(async (file: File): Promise<boolean> => {
        setIsSubmitting(true);
        const result = await importVendorsCSV({ corporateId: String(corporateId), file });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to import vendors. Please try again.' }));
        }
        setIsSubmitting(false);
        return !!result;
    }, [corporateId, dispatch]);

    const remove = useCallback(async (vendorId: string | number): Promise<boolean> => {
        setIsSubmitting(true);
        const ok = await deleteVendor({ corporateId: String(corporateId), id: vendorId });
        if (ok) {
            dispatch(showToast({ variant: 'success', description: 'Vendor deleted successfully.' }));
        } else {
            dispatch(showToast({ variant: 'error', description: 'Failed to delete vendor. Please try again.' }));
        }
        setIsSubmitting(false);
        return ok;
    }, [corporateId, dispatch]);

    return { isLoading, isSubmitting, detail, fetchDetail, vendors, count, fetchVendors, fetchVendorsWithoutPagination, create, update, importCSV, remove };
}
