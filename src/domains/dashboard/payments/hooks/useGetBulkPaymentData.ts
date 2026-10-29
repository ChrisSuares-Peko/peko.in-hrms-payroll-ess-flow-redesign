import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getBulkPaymentDataApi } from '../api';
import { BulkPaymentResp } from '../types';

export default function useGetBulkPaymentData(esimStoredBatchId: string | null) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [bulkPaymentDatas, setBulkPaymentDatas] = useState<BulkPaymentResp[]>([]);
    const [isLoadings, setIsLoadings] = useState(true);

    const navigate = useNavigate();
    const getBulkEsimData = useCallback(async () => {
        if (!esimStoredBatchId) {
            setIsLoadings(false);
            return;
        }
        setIsLoadings(true);

        // esimStoredBatchId may be a single key string or a JSON-encoded array of keys
        // (multi-vendor purchases produce an array of Redis keys)
        let keys: string[];
        try {
            const parsed = JSON.parse(esimStoredBatchId);
            keys = Array.isArray(parsed) ? parsed : [esimStoredBatchId];
        } catch {
            keys = [esimStoredBatchId];
        }

        const results = await Promise.all(
            keys.map(key => getBulkPaymentDataApi({ userId: id, userType: role }, key))
        );

        const combined: BulkPaymentResp[] = results
            .filter((r): r is BulkPaymentResp[] => r !== false && Array.isArray(r))
            .flat();

        if (combined.length > 0) {
            setBulkPaymentDatas(combined);
            setIsLoadings(false);
        } else if (results.some(r => r !== false)) {
            // At least one call succeeded with non-array data — handle gracefully
            setIsLoadings(false);
        } else {
            navigate(paths.dashboard.home);
        }
    }, [id, role, esimStoredBatchId, navigate]);

    useEffect(() => {
        getBulkEsimData();
    }, [getBulkEsimData]);

    return { bulkPaymentDatas, isLoadings, getBulkEsimData };
}
