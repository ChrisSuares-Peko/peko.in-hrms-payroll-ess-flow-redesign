import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllGuidelines, updateGuideline2 } from '../api/index';
import { Rows } from '../types/guidelineTypes';

export default function useGetAllGuidelines(invoiceId?: number) {
    const { id, role } = useAppSelector(store => store.reducer.auth);
    const [updateLoading, setUploadLoading] = useState(false);
    const dispatch = useDispatch();

    const [guideline, setGuideline] = useState<Rows[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const guidelineData = useCallback(async () => {
        const response: any = await getAllGuidelines({
            userId: id,
            userType: role,
            invoiceId,
        });

        if (response) {
            setGuideline(response.rows);
        }
    }, [id, invoiceId, role]);

    const updateGuideline = async (values: any) => {
        setUploadLoading(true);
        const response: any = await updateGuideline2({
            userId: id,
            userType: role,
            payload: values,
            invoiceId,
        });

        if (response) {
            dispatch(
                showToast({
                    description: 'Guideline updated successfully',
                    variant: 'success',
                })
            );
            guidelineData();
        }
        setUploadLoading(false);
    };

    useEffect(() => {
        guidelineData();
    }, [guidelineData, refreshTrigger]);
    const refetch = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return { guideline, updateGuideline, refetch, updateLoading };
}
