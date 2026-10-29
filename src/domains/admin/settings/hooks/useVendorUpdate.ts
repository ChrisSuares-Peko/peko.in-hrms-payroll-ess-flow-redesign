import { useCallback, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createVendor, putUpdateVendor } from '../api/vendor';
import { Vendor, VendorWithoutID } from '../types/vendors';

export default function useVendorUpdate() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [responseData, setResponseData] = useState<Vendor | {}>();
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const handleVendorCreation = async (payload: VendorWithoutID) => {
        setIsLoading(true);
        try {
            const response: false | SuccessGenericResponse<Vendor> = await createVendor({
                ...payload,
                userId: id,
                userType: role,
            });

            if (response) {
                if (response.status) {
                    dispatch(
                        showToast({
                            description: `Vendor created successfully`,
                            variant: 'success',
                        })
                    );
                }
                setResponseData(response);
            }
            setIsLoading(false);
            return response;
        } catch (err) {
            setIsLoading(false);
            return false;
        }
    };

    const updateVendorDetails = useCallback(
        async (vendorUpdatedData: Vendor) => {
            setIsLoading(true);
            try {
                const response: SuccessGenericResponse<{}> | false = await putUpdateVendor({
                    userId: id,
                    userType: role,
                    ...vendorUpdatedData,
                });
                if (response) {
                    if (response.status) {
                        dispatch(
                            showToast({
                                description: `Vendor updated successfully`,
                                variant: 'success',
                            })
                        );
                    }
                    setResponseData(response);
                }
                setIsLoading(false);
                return response;
            } catch (err) {
                setIsLoading(false);
                return false;
            }
        },
        [id, role, dispatch]
    );

    return { handleVendorCreation, responseData, isLoading, updateVendorDetails };
}
