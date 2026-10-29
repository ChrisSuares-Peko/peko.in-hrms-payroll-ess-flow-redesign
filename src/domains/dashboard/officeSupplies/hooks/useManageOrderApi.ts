import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { store } from '@store/store';

import { cancelOrderApi, downloadInvoiceApi, productReturnApi } from '../api/orderHistory';
import { setOrderDetails } from '../slices/orderDetailsSlice';
import { ProductReturnRequestResponse } from '../types/orderHistory';

export function useManageOrderApi() {
    const dispatch = useAppDispatch();

    const refresh = useAppSelector(state => state.reducer.orderDetails.refresh);
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const cancelOrder = async (
        orderId: number,
        description: string,
        reason: string,
        otp: string,
        scope: string
    ) => {
        setIsLoading(true);
        const data: any | false = await cancelOrderApi({
            userId: id,
            userType: role,
            description,
            reason,
            orderId,
            otp,
            scope,
        });

        let success = false;
        if (data && data.status) {
            dispatch(setOrderDetails({ refresh: !refresh }));
            store.dispatch(
                showToast({
                    description: 'Order cancellation request raised successfully',
                    variant: 'success',
                })
            );
            success = true;
        }

        setIsLoading(false);
        return success;
    };

    const productReturn = async (
        orderId: number,
        description: string,
        reason: string,
        productId: number
    ) => {
        setIsLoading(true);
        const data: ProductReturnRequestResponse | false = await productReturnApi({
            userId: id,
            userType: role,
            description,
            reason,
            orderId,
            productId,
        });

        if (data) {
            dispatch(setOrderDetails({ refresh: !refresh }));
            store.dispatch(
                showToast({
                    description: 'Product return requested successfully',
                    variant: 'success',
                })
            );
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    };

    const generateInvoice = useCallback(
        async (transactionID: number, type: string) => {
            setIsLoading(true);
            const data: any | false = await downloadInvoiceApi({
                userId: id,
                userType: role,
                transactionID,
                type,
            });
            if (data) {
                const uint8Array = new Uint8Array(data.pdfBuffer.data);

                const blob = new Blob([uint8Array], { type: 'application/pdf' });

                saveAs(blob, `${type}-${transactionID}.pdf`);
            }
            setIsLoading(false);
        },
        [id, role]
    );

    return { isLoading, cancelOrder, generateInvoice, productReturn };
}
