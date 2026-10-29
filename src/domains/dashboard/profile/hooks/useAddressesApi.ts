import { useCallback, useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addAddress, deleteAddress, getAddresses, updateAddress } from '../api/address';
import { setData } from '../slices/address';
import {
    AddAddressRequestPayload,
    AddAddressResponse,
    AddressListResponse,
    updateAddressRequestPayload,
    updateResponse,
} from '../types/index';

interface useAddressesApiProps {
    handleCancel?: () => void;
}

export default function useAddressesApi({ handleCancel }: useAddressesApiProps) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { refresh, tableData, isLoading, isDeleteLoading } = useAppSelector(
        state => state.reducer.address
    );

    const dispatch = useAppDispatch();
    const getAddressList = useCallback(async () => {
        dispatch(setData({ tableData: [], isLoading: true }));
        const data: AddressListResponse | false = await getAddresses({
            userId: id,
            userType: role,
        });
        if (data) {
            const addressData = data as AddressListResponse;
            const arr = addressData?.addressDetails
                ?.sort((a, b) => b.default - a.default)
                ?.filter(item => item.addressType);

            dispatch(setData({ tableData: arr, isLoading: false }));
        } else {
            dispatch(setData({ tableData: [], isLoading: false }));
        }
    }, [id, role, dispatch]);

    const handleAddAddress = async (payload: AddAddressRequestPayload) => {
        const response: AddAddressResponse | false = await addAddress(payload);
        if (response) {
            dispatch(setData({ refresh: !refresh, isLoading: false }));
            if (handleCancel) {
                handleCancel();
                dispatch(
                    showToast({ description: 'Address added successfully', variant: 'success' })
                );
            }
        }
    };

    const handleDeleteAddress = async (itemId: number, otp: string, scope: string) => {
        dispatch(setData({ isDeleteLoading: true }));
        const response = await deleteAddress({
            userType: role,
            userId: id,
            id: itemId,
            otp,
            scope,
        });
        if (response) {
            dispatch(setData({ refresh: !refresh, isDeleteLoading: false, id: 0 }));
            if (handleCancel) {
                handleCancel();
                dispatch(
                    showToast({ description: 'Address deleted successfully', variant: 'success' })
                );
            }
        } else {
            dispatch(setData({ isDeleteLoading: false }));
        }
    };
    const handleUpdateAddress = async (payload: updateAddressRequestPayload) => {
        const response: updateResponse | false = await updateAddress(payload);
        if (response) {
            dispatch(setData({ refresh: !refresh, isLoading: false }));
            if (handleCancel) {
                handleCancel();
                dispatch(
                    showToast({ description: 'Address updated successfully', variant: 'success' })
                );
            }
        }
    };

    useEffect(() => {
        getAddressList();
    }, [getAddressList, refresh]);

    return {
        tableData,
        isLoading,
        refresh,
        isDeleteLoading,
        handleAddAddress,
        handleDeleteAddress,
        handleUpdateAddress,
    };
}
