import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { exportVirtualAccountStatement } from '../api';

export default function useExportVirtualAccountStatement() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setLoading] = useState(false);

    const exportStatement = async (from: string, to: string) => {
        setLoading(true);
        const res = await exportVirtualAccountStatement({ userId: id, userType: role, from, to });
        setLoading(false);

        if (res && 'buffer' in res) {
            const bytes = new Uint8Array(res.buffer.data);
            const blob = new Blob([bytes], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `statement_${from}_${to}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);
            return true;
        }

        dispatch(showToast({ description: res.error, variant: 'error' }));
        return false;
    };

    return { exportStatement, isLoading };
}
