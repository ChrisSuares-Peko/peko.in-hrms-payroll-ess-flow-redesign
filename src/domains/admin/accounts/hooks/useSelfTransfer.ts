import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { setUserInfo } from '@src/slices/userSlice';

import { fetchWalletDetails, selfTransferApi, transferFundsApi } from '../api/selfTransfer';
import {
    SelfTransferPayload,
    selfTransferResponse,
    transferFundsResponse,
    walletDetailsResponse,
} from '../types/SelfTransferTypes';

export default function useSelfTransfer(self: boolean) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { user } = useAppSelector(state => state.reducer.user);
    const dispatch = useDispatch();
    const [walletDetails, setWalletDetails] = useState<walletDetailsResponse>();
    const [isLoading, setIsLoading] = useState(false);

    const getWalletDetails = useCallback(async () => {
        setIsLoading(true);
        const data: walletDetailsResponse | false = await fetchWalletDetails({
            userId: id,
            userType: role,
        });
        setIsLoading(false);
        if (data) {
            dispatch(setUserInfo({ user: { ...user!, balance: data.balance } }));
            setWalletDetails(data);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, role, dispatch]);

    const handleSelfTransfer = async (payload: SelfTransferPayload) => {
        setIsLoading(true);
        const response: false | selfTransferResponse = await selfTransferApi({
            ...payload,
            credentialId: self ? id.toString() : payload.credentialId,
            userId: id,
            userType: role,
        });
        if (response) {
            dispatch(showToast({ variant: 'success', description: `${payload.type} Successful` }));
            getWalletDetails();
        }
        setIsLoading(false);
        return response;
    };

    const handleTransferForOther = async (payload: SelfTransferPayload) => {
        setIsLoading(true);
        const response: false | transferFundsResponse = await transferFundsApi({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response) {
            dispatch(showToast({ variant: 'success', description: `${payload.type} Successful` }));
            dispatch(setUserInfo({ user: { ...user!, balance: response.adminFinalBalance } }));
            // getWalletDetails();
        }
        setIsLoading(false);
        return response;
    };

    useEffect(() => {
        getWalletDetails();
    }, [getWalletDetails]);

    return { isLoading, walletDetails, handleSelfTransfer, handleTransferForOther };
}
