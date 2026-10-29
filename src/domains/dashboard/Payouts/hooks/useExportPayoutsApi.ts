import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { exportPayouts } from '../api';
import { GetAllPayoutsParams } from '../types';

export default function useExportPayoutsApi() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [isLoading, setLoading] = useState(false);

    const exportAllPayouts = async (params?: GetAllPayoutsParams) => {
        setLoading(true);
        const res = await exportPayouts(role, id, params);
        setLoading(false);
        if ('buffer' in res) {
            const bytes = new Uint8Array(res.buffer.data);
            const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `payouts-export-${Date.now()}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
            return true;
        }
        dispatch(showToast({ description: res.error, variant: 'error' }));
        return false;
    };

    return { exportAllPayouts, isLoading };
}
