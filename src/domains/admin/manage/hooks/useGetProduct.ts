import { useCallback, useEffect, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllData, deleteProduct, getUpdateStatus } from '../api/products';
import {
    Product,
    activeResponse,
    getAllFilter,
    responseData,
    updateStatus,
} from '../types/products';

const useGetProduct = ({ searchText, itemsPerPage, page, sort }: getAllFilter) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<Product[]>();
    const dispatch = useAppDispatch();
    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: responseData | false = await getAllData({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
        });
        if (data) {
            setTableData(data.data);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, itemsPerPage, page, role, searchText, sort]);

    const updateActiveStatus = useCallback(
        async ({ prodId, status }: updateStatus) => {
            setIsLoading(true);
            const data: activeResponse | false = await getUpdateStatus({
                userId: id,
                userType: role,
                prodId,
                status,
            });
            if (data) {
                setRefresh(true);
            }
        },
        [id, role]
    );

    const deleteDoc = useCallback(
        async (prodId: number) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<activeResponse> | false = await deleteProduct({
                userId: id,
                userType: role,
                id: prodId,
            });
            if (data) {
                if (data.status) {
                    dispatch(
                        showToast({
                            description: `Product deleted successfully`,
                            variant: 'success',
                        })
                    );
                    setRefresh(true);
                }

                setRefresh(true);
            }
        },
        [id, role, dispatch]
    );

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return { isLoading, tableData, count, updateActiveStatus, deleteDoc, setRefresh };
};

export default useGetProduct;
