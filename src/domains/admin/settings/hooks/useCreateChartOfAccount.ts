import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    addChartOfAccount,
    updateChartOfAccount,
    getallaccountTypes,
    getallParents,
} from '../api/chartOfAccount';
import { newChartofAccount } from '../types/chartofAccount';

const UseCreateChartofAccounts = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [isTypesLoading, setIsTypesLoading] = useState(false);
    const [isParentsLoading, setIsParentsLoading] = useState(false);
    const [tableData, setTableData] = useState<any[]>();
    const [parentData, setParentData] = useState<any[]>();

    const createNewChartofAccount = useCallback(
        async (payload: newChartofAccount) => {
            setIsLoading(true);
            const resp = await addChartOfAccount({
                userId: id,
                userType: role,
                ...payload,
            });
            if (resp) {
                return {
                    success: true as const,
                    message: resp.message,
                    syncStatus: resp.data?.syncStatus,
                };
            }
            setIsLoading(false);
            return { success: false as const };
        },
        [id, role]
    );

    const updateCurrentChartOfAccount = useCallback(
        async (payload: newChartofAccount) => {
            setIsLoading(true);
            const resp = await updateChartOfAccount({
                userId: id,
                userType: role,
                ...payload,
            });
            if (resp) {
                return {
                    success: true as const,
                    message: resp.message,
                    syncStatus: resp.data?.syncStatus,
                };
            }
            setIsLoading(false);
            return { success: false as const };
        },
        [id, role]
    );

    const getAllAccountTypes = useCallback(async () => {
        setIsTypesLoading(true);
        try {
            const data = await getallaccountTypes({
                userId: id,
                userType: role,
            });

            if (data && Array.isArray(data)) {
                const transformedData = data.map(item => ({
                    label: item?.account_type_formatted,
                    value: item?.account_type,
                    isSubAccountAllowed: item?.is_sub_account_allowed,
                }));
                setTableData(transformedData);
            }
        } catch (error) {
            console.error('Error fetching account types:', error);
        } finally {
            setIsTypesLoading(false);
        }
    }, [id, role]);

    const getAllParents = useCallback(async () => {
        setIsParentsLoading(true);
        try {
            const data = await getallParents({
                userId: id,
                userType: role,
            });

            if (data && Array.isArray(data)) {
                const transformedData = data.map(item => ({
                    label: item?.label,
                    value: item?.value,
                    accountType: item.account_type,
                }));
                setParentData(transformedData);
            }
        } catch (error) {
            console.error('Error fetching parent accounts:', error);
        } finally {
            setIsParentsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        getAllAccountTypes();
        getAllParents();
    }, [getAllAccountTypes, getAllParents]);

    return {
        isLoading,
        isTypesLoading,
        isParentsLoading,
        createNewChartofAccount,
        updateCurrentChartOfAccount,
        getAllAccountTypes,
        tableData,
        parentData,
    };
};

export default UseCreateChartofAccounts;
