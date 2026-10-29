import { useCallback, useEffect, useState } from 'react';

import saveAs from 'file-saver';
import { useDispatch } from 'react-redux';

import { CommonFileBuffer } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getAllCouponCodeData,
    getFileBufferCouponCode,
    updateCouponCodeStatus,
} from '../api/couponCode';
import { getCoupon, updateStatus } from '../types/couponCode';

const useGetCouponCodes = (payload: getCoupon) => {
    const dispatch = useDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<any[]>();
    const getDataFromApi = useCallback(async () => {
        setIsLoading(true);
        const data = await getAllCouponCodeData({
            userId: id,
            userType: role,
            ...payload,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, payload]);

    const updateActiveStatus = useCallback(
        async ({ couponId, status }: updateStatus) => {
            setIsLoading(true);
            const data = await updateCouponCodeStatus({
                userId: id,
                userType: role,
                couponId,
                status,
            });
            if (data) {
                setRefresh(true);
            }
        },
        [id, role]
    );
    const downloadReport = async (type: string) => {
        setIsLoading(true);
        const data: CommonFileBuffer | false = await getFileBufferCouponCode({
            userId: id,
            userType: role,
            type,
            searchText: payload.searchText,
            page: payload.page,
            itemsPerPage: payload.itemsPerPage,
            sort: '',
        });
        if (data === false) {
            dispatch(
                showToast({
                    description: 'No data is available for export.',
                    variant: 'error',
                })
            );
        }
        if (data) {
            const arrayBuffer = new Uint8Array(data.buffer.data);

            // Convert ArrayBuffer to Blob
            const blob = new Blob([arrayBuffer], {
                type: data.fileType,
            });

            // Trigger download
            if (type === 'excel') {
                saveAs(blob, `Coupon Code.xlsx`);
            } else if (type === 'csv') {
                saveAs(blob, `Coupon Code.csv`);
            } else if (type === 'pdf') {
                saveAs(blob, `Coupon Code.pdf`);
            }
        }
        setIsLoading(false);
    };
    useEffect(() => {
        getDataFromApi();
    }, [getDataFromApi, refresh]);

    return {
        isLoading,
        tableData,
        count,
        updateActiveStatus,
        // deleteDoc,
        setRefresh,
        downloadReport,
    };
};

export default useGetCouponCodes;
