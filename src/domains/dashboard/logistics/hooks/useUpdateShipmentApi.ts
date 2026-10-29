import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { updateOrderApi, updateShipmentStatusApi } from '../api/index';
import { UpdateShipmentStatusResponse } from '../types/tracking';

interface payload {
    updateType: string;
    orderId: string;
}
interface updateOrderPayload {
    customerAddress: string;
    customerMobileNo: string;
    nextDeliveryDate: string;
    orderId: string;
}

export function useUpdateShipmentApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdateShipmentStatus = useCallback(
        async ({ orderId, updateType }: payload) => {
            if (orderId && updateType) {
                setIsLoading(true);
                const response: UpdateShipmentStatusResponse | false =
                    await updateShipmentStatusApi({
                        userType: role,
                        userId: id,
                        orderId,
                        updateType,
                    });
                if (response) {
                    const { result } = response;
                    setIsLoading(false);
                    return result;
                }
                setIsLoading(false);
            }
            return false;
        },
        [id, role]
    );

    const handleUpdateOrder = useCallback(
        async ({
            orderId,
            customerAddress,
            customerMobileNo,
            nextDeliveryDate,
        }: updateOrderPayload) => {
            setIsLoading(true);
            const response: UpdateShipmentStatusResponse | false = await updateOrderApi({
                userType: role,
                userId: id,
                orderId,
                ...(customerAddress && { customerAddress }),
                ...(customerMobileNo && { customerMobileNo }),
                ...(nextDeliveryDate && { nextDeliveryDate }),
            });
            setIsLoading(false);
            if (response) {
                return true;
            }
            return false;
        },
        [id, role]
    );

    return { handleUpdateShipmentStatus, isLoading, handleUpdateOrder };
}
