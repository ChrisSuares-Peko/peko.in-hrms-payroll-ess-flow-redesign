import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getTransactionDetailsApi } from '../api/orderHistory';
import { setOrderDetails } from '../slices/worksSlice';
import { TransactionDetailsResponse } from '../type/orderHistory';

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
            const { orderResponse, workspaceOrderStatus, crmContactDetails } = orderDetailsData;
            const parseData = JSON.parse(orderResponse);
            dispatch(
                setOrderDetails({
                    planDetails: {
                        name: parseData?.planDetails?.name ?? null,
                        description: parseData?.planDetails?.description ?? null,
                        price: parseData?.planDetails?.price ?? null,
                        billingCycle: parseData?.planDetails?.billingCycle ?? null,
                        features: parseData?.planDetails?.features ?? null,
                    },
                    name: parseData?.planDetails?.work?.contactName ?? null,
                    email: parseData?.planDetails?.work?.contactEmail ?? null,
                    mobile: parseData?.planDetails?.work?.contactMobile ?? null,
                    status: workspaceOrderStatus ?? null,
                    crmContactDetails: crmContactDetails ?? null,
                    showCRMDetails: parseData?.planDetails?.work?.showCRMDetails ?? null,
                })
            );
            setIsLoading(false);
        } else {
            navigate(`${paths.dashboard.works}/${paths.works.orderHistory}`);
            setIsLoading(false);
        }
    }, [id, role, orderId, navigate, dispatch]);

    useEffect(() => {
        getOrderDetails();
    }, [getOrderDetails]);

    return { isLoading };
}
