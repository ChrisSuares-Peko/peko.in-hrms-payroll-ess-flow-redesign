import { useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { exportCashLedger } from '../api/tax';

interface Params {
    gstin: string;
    financialYear: string;
    month: number;
    from?: string;
    to?: string;
}

const useExportCashLedger = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isExporting, setIsExporting] = useState(false);

    const exportCsv = async (params: Params) => {
        if (!params.gstin || !params.financialYear || !params.month) return;
        setIsExporting(true);
        try {
            const resp = await exportCashLedger({
                userId: id,
                userType: role,
                gstin: params.gstin,
                financialYear: params.financialYear,
                month: params.month,
                ...(params.from ? { from: params.from } : {}),
                ...(params.to ? { to: params.to } : {}),
            });
            if (!resp || !resp.status) {
                dispatch(
                    showToast({
                        description: (resp as any)?.message || 'No data available for export',
                        variant: 'error',
                    })
                );
                return;
            }
            const arrayBuffer = new Uint8Array(resp.data.buffer.data);
            const blob = new Blob([arrayBuffer], { type: resp.data.fileType });
            saveAs(blob, `CashLedger_${params.gstin}_${params.financialYear}_${params.month}.csv`);
        } finally {
            setIsExporting(false);
        }
    };

    return { exportCsv, isExporting };
};

export default useExportCashLedger;
