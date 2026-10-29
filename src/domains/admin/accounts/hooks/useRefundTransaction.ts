import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllData, sendRefundOtp, sentRefundTransaction } from '../api/refundTransaction';
import { Transaction, getData, refundTransationsRespone } from '../types/refundTransactions';

const useRefundTransaction = (payload: getData) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [refresh, setRefresh] = useState<boolean>(false);
    const [count, setCount] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(true);
    const [loader, setLoader] = useState(false);
    const [otpLoader, setOtpLoader] = useState(false);
    const [tableData, setTableData] = useState<Transaction[]>();

    const getDataFromApi = useCallback(async () => {
        setIsLoading(true);
        const data: refundTransationsRespone | false = await getAllData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.rows);
            setCount(data.count);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, payload, role]);

    const sendOtp = useCallback(async (): Promise<boolean> => {
        setOtpLoader(true);
        const data = await sendRefundOtp({ userId: id, userType: role });
        setOtpLoader(false);
        if (data) {
            return true;
        }
        dispatch(showToast({ description: 'Failed to send OTP, try again', variant: 'error' }));
        return false;
    }, [id, role, dispatch]);

    const refundTransaction = useCallback(
        async (payloaData: any): Promise<boolean> => {
            setLoader(true);
            const data: any | false = await sentRefundTransaction({
                userId: id,
                userType: role,
                ...payloaData,
            });

            if (data && data.status) {
                setRefresh(true);
                if (data.message === 'Refund process is completed') {
                    dispatch(
                        showToast({
                            description: `Refund process is completed`,
                            variant: 'success',
                        })
                    );
                } else {
                    dispatch(
                        showToast({
                            description: `Refund process is initiated`,
                            variant: 'info',
                        })
                    );
                }
                setLoader(false);
                return true;
            }
            if (data) {
                dispatch(
                    showToast({
                        description: data.message || `Something went wrong, try again`,
                        variant: 'error',
                    })
                );
            }
            setLoader(false);
            return false;
        },
        [id, role, dispatch]
    );

    useEffect(() => {
        getDataFromApi();
    }, [getDataFromApi, refresh]);

    return { isLoading, tableData, count, refundTransaction, loader, sendOtp, otpLoader };
};

export default useRefundTransaction;
