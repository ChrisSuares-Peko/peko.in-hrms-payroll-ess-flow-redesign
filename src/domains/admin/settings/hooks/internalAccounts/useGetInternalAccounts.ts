import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteInternalAccount, getInternalAccountsData } from '../../api/internalAccounts';
import {
    ApiResponseInternalAccounts,
    getInternalAccounts,
    InternalAccount,
} from '../../types/internalAccountsTypes';

const useGetInternalAccounts = ({
    searchText,
    itemsPerPage,
    page,
    sort,
    sortField,
}: getInternalAccounts) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(0);
    const [tableData, setTableData] = useState<InternalAccount[]>([]);
    const dispatch = useDispatch();

    const getDataFromApi = useCallback(async () => {
        setIsLoading(true);
        const data: ApiResponseInternalAccounts | false = await getInternalAccountsData({
            userId: id,
            userType: role,
            searchText,
            itemsPerPage,
            page,
            sort,
            sortField,
        });
        if (data) {
            setTableData(data.internalAccounts);
            setCount(data.recordsTotal);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, itemsPerPage, page, role, searchText, sort, sortField]);

    const deleteFromInternalAccounts = useCallback(
        async (accountId: string) => {
            setIsLoading(true);
            const data = await deleteInternalAccount({
                userId: id,
                userType: role,
                accountId,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: `Account deleted successfully`,
                        variant: 'success',
                    })
                );
                setRefresh(true);
            }
            setIsLoading(false);
        },
        [id, role, dispatch]
    );

    useEffect(() => {
        getDataFromApi();
    }, [getDataFromApi, refresh]);

    return {
        isLoading,
        tableData,
        count,
        setRefresh,
        deleteFromInternalAccounts,
    };
};

export default useGetInternalAccounts;
