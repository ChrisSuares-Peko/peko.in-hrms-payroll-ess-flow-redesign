import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getVendorList, updateOrderApi } from '../api/order';
import { OrderUpdatePayload, vendorListResponse } from '../types/types';

export default function useOrderVendors(productIds: string[]) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [vendorDetails, setVendorDetails] = useState<vendorListResponse[]>();
    const [isLoading, setIsLoading] = useState(true);
    const dispatch = useDispatch();

    const getSingleVendorDetails = useCallback(async () => {
        const data: vendorListResponse[] | false = await getVendorList({
            userId: id,
            userType: role,
            productIds,
        });
        if (data) {
            const result = data as vendorListResponse[];
            const updatedResult = result.map(item => ({
                ...item,
                options: item.vendors
                    .filter(vendor => typeof vendor.name === 'string')
                    .map(vendor => ({
                        oName: `${vendor.name} - INR ${vendor.price}`,
                        oValue: vendor.id,
                    })),
            }));

            setVendorDetails(updatedResult);
            setIsLoading(false);
        } else {
            dispatch(
                showToast({
                    description: 'Vendor not found',
                    variant: 'error',
                })
            );
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, role, dispatch]);

    const updateOrderDetails = useCallback(
        async (orderUpdatedData: OrderUpdatePayload) => {
            setIsLoading(true);
            const response: {} | false = await updateOrderApi({
                userId: id,
                userType: role,
                ...orderUpdatedData,
            });
            setIsLoading(false);
            if (response) {
                return true;
            }
            return false;
        },
        [id, role]
    );

    useEffect(() => {
        getSingleVendorDetails();
    }, [getSingleVendorDetails]);

    return { vendorDetails, isLoading, updateOrderDetails };
}
