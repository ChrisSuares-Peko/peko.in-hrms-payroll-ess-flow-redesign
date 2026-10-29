import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { addCustomer, deleteCustomer, getAllData } from '../api/index';
import { RowData, UserPayload } from '../types/customertypes';
import { getCustomers } from '../types/guidelineTypes';

export const useCustomers = ({ searchText, itemsPerPage, page, sort }: getCustomers) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useDispatch();
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(1);
    const [tableData, setTableData] = useState<RowData[]>([]);

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: any = await getAllData({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
        });
        if (data) {
            setTableData(data.rows);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, itemsPerPage, page, role, searchText, sort]);

    const customerAdd = useCallback(
        async (payload: UserPayload) => {
            setIsLoading(true);
            const data: any | false = await addCustomer({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                setRefresh(true);
            }
            setIsLoading(false);
        },
        [id, role]
    );

    const customerDelete = useCallback(
        async (cId: number) => {
            setIsLoading(true);
            const data: any = await deleteCustomer({
                userId: id,
                userType: role,
                id: cId,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: 'Customer deleted successfully',
                        variant: 'success',
                    })
                );
                setRefresh(true);
                return true;
            }
            setIsLoading(false);
            return false;
        },
        [dispatch, id, role]
    );

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return { isLoading, tableData, count, setRefresh, customerAdd, customerDelete };
};
