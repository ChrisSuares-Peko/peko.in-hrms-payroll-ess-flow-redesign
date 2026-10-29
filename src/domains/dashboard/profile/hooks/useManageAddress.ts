import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addAddress, updateAddress } from '../api/address';
import { setData } from '../slices/address';
import {
    AddAddressRequestPayload,
    AddAddressResponse,
    updateAddressRequestPayload,
    updateResponse,
} from '../types';

interface useAddressesApiProps {
    handleCancel?: () => void;
}

const useManageAddress = ({ handleCancel }: useAddressesApiProps) => {
    const dispatch = useDispatch();
    const { refresh, isLoading, isDeleteLoading } = useAppSelector(state => state.reducer.address);

    const handleAddAddress = async (payload: AddAddressRequestPayload) => {
        const response: AddAddressResponse | false = await addAddress(payload);
        if (response) {
            dispatch(setData({ refresh: !refresh }));
            if (handleCancel) {
                handleCancel();
                dispatch(
                    showToast({ description: 'Address added successfully', variant: 'success' })
                );
            }
        }
    };

    const handleUpdateAddress = useCallback(
        async (payload: updateAddressRequestPayload) => {
            const response: updateResponse | false = await updateAddress(payload);
            if (response) {
                dispatch(setData({ refresh: !refresh, isLoading: false }));
                if (handleCancel) {
                    handleCancel();
                    dispatch(
                        showToast({
                            description: 'Address updated successfully',
                            variant: 'success',
                        })
                    );
                }
            }
        },
        [dispatch, handleCancel, refresh]
    );

    return {
        isLoading,
        isDeleteLoading,
        refresh,
        handleAddAddress,
        handleUpdateAddress,
    };
};

export default useManageAddress;
