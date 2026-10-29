import { useCallback, useEffect, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createSubscription,
    putUpdateSubscription,
    getAllVendors,
    getSubscriptionCategories,
} from '../../api/subscription';
import {
    CategoryApiResponse,
    SubscriptionBody,
    SubscriptionWithoutID,
    VendorApiResponse,
    DropDown,
} from '../../types/subscription';

export default function useConnectUpdate() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [allVendors, setAllvendors] = useState<DropDown>([]);
    const [subscriptionCategories, setSubscriptionCategories] = useState<DropDown>([]);

    const handleSubscriptionCreation = async (payload: SubscriptionWithoutID) => {
        setIsLoading(true);
        const response: SuccessGenericResponse<SubscriptionBody> | false = await createSubscription(
            {
                ...payload,
                userId: id,
                userType: role,
            }
        );

        if (response) {
            setIsLoading(false);
            if (response.status) {
                dispatch(
                    showToast({
                        description: 'Software added successfully',
                        variant: 'success',
                    })
                );
            }
        }
        return response;
    };

    const updateSubscriptionDetails = useCallback(
        async (vendorUpdatedData: SubscriptionBody) => {
            setIsLoading(true);
            const response: SuccessGenericResponse<{}> | false = await putUpdateSubscription({
                userId: id,
                userType: role,
                ...vendorUpdatedData,
            });
            if (response) {
                setIsLoading(false);
                if (response.status) {
                    dispatch(
                        showToast({
                            description: 'Software updated successfully',
                            variant: 'success',
                        })
                    );
                }
            }
            return response;
        },
        [id, role, dispatch]
    );

    const getCategoryData = useCallback(async () => {
        setIsLoading(true);
        const data: CategoryApiResponse | false = await getSubscriptionCategories({
            userId: id,
            userType: role,
        });
        if (data) {
            const arr = data.categoryData.map(category => ({
                value: category.id,
                label: category.categoryName,
            }));
            setSubscriptionCategories(arr);
        }
        setIsLoading(false);
    }, [id, role]);

    const getVendorData = useCallback(async () => {
        setIsLoading(true);
        const data: VendorApiResponse | false = await getAllVendors({
            userId: id,
            userType: role,
        });
        if (data) {
            const arr = data.result.map(vendor => ({
                value: vendor.id,
                label: vendor.vendorName,
            }));
            setAllvendors(arr);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getVendorData();
        getCategoryData();
    }, [getVendorData, getCategoryData]);

    return {
        handleSubscriptionCreation,
        isLoading,
        updateSubscriptionDetails,
        allVendors,
        subscriptionCategories,
    };
}
