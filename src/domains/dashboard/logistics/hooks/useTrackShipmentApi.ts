import { useCallback, useState } from 'react';

import { message } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { trackShipment } from '../api/index';
import { ITrackShipmentResponse } from '../types/tracking';

export const useTrackShipmentApi = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [resultData, setResultData] = useState({});

    const [isLoading, setIsLoading] = useState(true);

    const handleTrackShipment = useCallback(
        async (providerId: string) => {
            setIsLoading(true);
            const response: ITrackShipmentResponse | false = await trackShipment({
                userId: id,
                userType: role,
                providerId,
            });

            if (response && response.trackingDetails.length > 0) {
                const prettyResult = {
                    trackingNo: response.orderDetails.providerId ?? 0,
                    trackingValues: response.trackingDetails ?? 0,
                    orderResponse: response.orderDetails.orderResponse,
                    shipmentStatus: response.trackingDetails,
                    amount: response.orderDetails.amountInINR,
                    orderId: response.orderDetails.id,
                };

                setResultData(prettyResult);
                setIsLoading(false);
                return prettyResult;
            }
            if (response && response.trackingDetails.length > 0) {
                message.error('Invalid tracking number');
            } else {
                message.error('Unable to search shipments. Please try again.');
            }

            setIsLoading(false);
            return false;
        },
        [id, role]
    ); // Dependencies for useCallback

    return { data: resultData, isLoading, handleTrackShipment };
};
