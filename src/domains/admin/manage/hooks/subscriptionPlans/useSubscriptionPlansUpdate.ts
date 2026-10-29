import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    putUpdateSubscriptionPlan,
    createSubscriptionPlan,
    getAllSoftwareProducts,
} from '../../api/subscriptionPlans';
import {
    SubscriptionPlanWithoutID,
    SubscriptionPlan,
    FetchSoftwareApiResponse,
    SoftwaresDropDown,
} from '../../types/subscriptionPlans';

export default function useConnectUpdate(searchText: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useDispatch();
    const [responseData, setResponseData] = useState<SubscriptionPlan | {}>();
    const [isLoading, setIsLoading] = useState(false);
    const [allSoftwares, setAllallSoftwares] = useState<SoftwaresDropDown>([]);

    const handleSubscriptionCreation = async (payload: SubscriptionPlanWithoutID) => {
        setIsLoading(true);
        const response: false | SuccessGenericResponse<SubscriptionPlan> =
            await createSubscriptionPlan({
                ...payload,
                userId: id,
                userType: role,
            });

        if (response) {
            setResponseData(response.data);
            setIsLoading(false);
            if (response.status) {
                dispatch(
                    showToast({
                        description: 'Plan added successfully',
                        variant: 'success',
                    })
                );
            }
        } else {
            setIsLoading(false);
        }
        return response;
    };

    const updateSubscriptionDetails = useCallback(
        async (vendorUpdatedData: SubscriptionPlan) => {
            setIsLoading(true);
            const response: SuccessGenericResponse<{}> | false = await putUpdateSubscriptionPlan({
                userId: id,
                userType: role,
                ...vendorUpdatedData,
            });
            if (response) {
                setResponseData(response.data);
                setIsLoading(false);
                if (response.status) {
                    dispatch(
                        showToast({
                            description: 'Plan updated successfully',
                            variant: 'success',
                        })
                    );
                }
            } else {
                setIsLoading(false);
            }
            return response;
        },
        [id, role, dispatch]
    );

    const getSoftwaresData = useCallback(async () => {
        const data: FetchSoftwareApiResponse | false = await getAllSoftwareProducts({
            userId: id,
            userType: role,
            searchText,
        });
        if (data) {
            const arr = data.result.map(vendor => ({
                value: vendor.id,
                label: vendor.name,
            }));
            setAllallSoftwares(arr);
        }
    }, [id, role, searchText]);

    useEffect(() => {
        getSoftwaresData();
    }, [getSoftwaresData, searchText]);

    return {
        handleSubscriptionCreation,
        responseData,
        isLoading,
        updateSubscriptionDetails,
        allSoftwares,
        getSoftwaresData,
    };
}
