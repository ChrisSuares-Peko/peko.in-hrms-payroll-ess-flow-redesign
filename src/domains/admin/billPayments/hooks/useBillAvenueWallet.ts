import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getBillAvenueWalletBalance, updateBillAvenueWalletBalance } from '../api/billers';
import { BillAvenueWallet } from '../types/billers';

export const useBillAvenueWallet = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [wallet, setWallet] = useState<BillAvenueWallet | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fetchWallet = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getBillAvenueWalletBalance({ userId: id, userType: role });
            if (data) setWallet(data);
        } catch {
            // Non-fatal — the button simply shows "Set balance" until it loads.
        } finally {
            setIsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet]);

    const updateWallet = async (balance: number, threshold: number): Promise<boolean> => {
        setIsSaving(true);
        try {
            const data = await updateBillAvenueWalletBalance({ userId: id, userType: role, balance, threshold });
            setWallet(data);
            dispatch(showToast({ variant: 'success', description: 'BillAvenue wallet balance updated' }));
            return true;
        } catch (err: any) {
            dispatch(showToast({ variant: 'error', description: err?.message || 'Failed to update balance' }));
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return { wallet, isLoading, isSaving, fetchWallet, updateWallet };
};

export default useBillAvenueWallet;
