import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getTransactionDetailsApi } from '../api/orderHistory';
import { setOrderDetails } from '../slices/orderDetailsSlice';
import { TransactionDetailsResponse } from '../types/orderHistory';

export function useOrderDetailsApi(orderId: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [isLoading, setIsLoading] = useState(true);

    const getOrderDetails = useCallback(async () => {
        setIsLoading(true);
        const data: TransactionDetailsResponse | false = await getTransactionDetailsApi({
            userId: id,
            userType: role,
            orderId,
        });
        if (data) {
            const orderDetailsData = data as TransactionDetailsResponse;
            const { orderResponse } = orderDetailsData;
            dispatch(
                setOrderDetails({
                    orderDetails: orderDetailsData,
                    orderedProducts: orderResponse?.products ?? [],
                    trackingDetails: orderResponse?.trackingDetails ?? null,
                })
            );
            setIsLoading(false);
        } else {
            navigate(`/${paths.officeSupplies.index}`);
            setIsLoading(false);
        }
    }, [id, role, orderId, navigate, dispatch]);

    useEffect(() => {
        getOrderDetails();
    }, [getOrderDetails]);

    return { isLoading, getOrderDetails };
}
