import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getOndcSellerNps, setOndcSellerNpEnabledApi } from '../../api/ondcSellerNps';
import {
    AdminOndcSellerNp,
    OndcSellerNpsQuery,
    SellerNpProductAction,
    SellerNpToggleResult,
} from '../../types/ondcSellerNp';

const products = (n: number) => `${n} ${n === 1 ? 'product' : 'products'}`;

const toggleMessage = (res: SellerNpToggleResult) => {
    if (res.enabled) return `Seller NP enabled — ${products(res.switchedOn)} switched back on.`;
    if (res.productAction === 'delete')
        return `Seller NP disabled — ${products(res.deletedCount)} deleted.`;
    return `Seller NP disabled — ${products(res.switchedOff)} switched off.`;
};

/** Admin seller NP list + enable toggle (Products → Seller NPs tab). */
const useOndcSellerNps = (filters: OndcSellerNpsQuery) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState(0);
    const [tableData, setTableData] = useState<AdminOndcSellerNp[]>([]);

    const fetchList = useCallback(async () => {
        setIsLoading(true);
        const data = await getOndcSellerNps({ userId: id, userType: role, ...filters });
        if (data) {
            setTableData(data.data || []);
            setCount(data.recordsTotal || 0);
        } else {
            setTableData([]);
            setCount(0);
        }
        setIsLoading(false);
    }, [id, role, filters]);

    /**
     * Disabling takes what happens to the NP's stored products: deleted, or
     * switched off (the default). Enabling switches them back on.
     */
    const toggleEnabled = async (
        npId: number,
        enabled: boolean,
        productAction?: SellerNpProductAction
    ) => {
        setTableData(prev => prev.map(row => (row.id === npId ? { ...row, enabled } : row)));
        const res = await setOndcSellerNpEnabledApi({
            userId: id,
            userType: role,
            id: npId,
            enabled,
            productAction,
        });
        if (!res) {
            setTableData(prev =>
                prev.map(row => (row.id === npId ? { ...row, enabled: !enabled } : row))
            );
            dispatch(
                showToast({ variant: 'error', description: 'Could not update the seller NP.' })
            );
            return false;
        }
        dispatch(showToast({ variant: 'success', description: toggleMessage(res) }));
        await fetchList();
        return true;
    };

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    return { isLoading, tableData, count, toggleEnabled, refetch: fetchList };
};

export default useOndcSellerNps;
