import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { findAll } from '../api/index';
import { corporateData, customerDetails } from '../types/customertypes';

export const useCustomerDropdown = (searchText: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tableData, setTableData] = useState<customerDetails[]>([]);

    const getData = useCallback(async () => {
        setIsLoading(true);
        const data: corporateData | false = await findAll({
            userId: id,
            userType: role,
            searchText,
        });

        if (data) {
            setTableData(data.customerDetails);
        }
        setRefresh(false);
        setIsLoading(false);
    }, [id, role, searchText]);

    useEffect(() => {
        getData();
    }, [getData, refresh]);

    return { isLoading, tableData, setRefresh };
};
