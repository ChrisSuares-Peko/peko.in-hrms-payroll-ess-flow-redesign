import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { cancelOrderApi, trackShipment } from '../../api';
import { TrackingApiResponse, Shipment, CancelOrderPayload } from '../../types/tracking';

export const useTrackShipmentApi = (trackingNo: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isCancelLoading, setIsCancelLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [shipmentDetails, setshipmentDetails] = useState<Shipment>();
    const navigate = useNavigate();

    const handleTrackShipment = useCallback(async () => {
        setIsLoading(true);
        const response: TrackingApiResponse | false = await trackShipment({
            userId: id,
            userType: role,
            trackingNumber: trackingNo,
        });

        if (response) {
            setshipmentDetails(response.shipment);
            setIsLoading(false);
            return response;
        }
        setIsLoading(false);
        navigate(`/${paths.logistics.index}/${paths.logistics.orderHistory}`);
        return response;
    }, [id, navigate, role, trackingNo]); // Dependencies for useCallback

    const cancelOrder = async (orderId: string) => {
        const payload: CancelOrderPayload = {
            userId: id,
            userType: role,
            orderId,
        };
        setIsCancelLoading(true);
        const data: {} | false = await cancelOrderApi(payload);
        if (data) {
            await handleTrackShipment();
            setIsCancelLoading(false);
            dispatch(
                showToast({
                    description: 'Order cancellation request submitted successfully.',
                    variant: 'success',
                })
            );
        }
        setIsCancelLoading(false);
    };

    useEffect(() => {
        handleTrackShipment();
    }, [handleTrackShipment]);

    const mobileNumberFormatter = useCallback((mobileNumber?: string) => {
        if (!mobileNumber) return null;
        const cleaned = mobileNumber.replace(/\s+/g, '');
        let formatted = cleaned;
        // If starts with +, remove for processing
        if (formatted.startsWith('+')) {
            formatted = formatted.slice(1);
        }
        // UAE local number convert to international
        if (/^05\d{8}$/.test(formatted)) {
            formatted = `971${formatted.slice(1)}`;
        }
        // If looks like international number
        if (/^\d{11,15}$/.test(formatted)) {
            // Extract country code (1–3 digits)
            const countryCodeMatch = formatted.match(/^(\d{1,3})(\d+)$/);
            if (countryCodeMatch) {
                const [, countryCode, rest] = countryCodeMatch;
                return `+${countryCode} ${rest}`;
            }
        }
        return mobileNumber;
    }, []);

    return {
        shipmentDetails,
        isLoading,
        handleTrackShipment,
        cancelOrder,
        isCancelLoading,
        mobileNumberFormatter,
    };
};
