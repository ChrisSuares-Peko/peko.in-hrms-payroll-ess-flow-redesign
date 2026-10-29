import { useCallback, useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';

import { getAccountTypes } from '../api/general';
import { AccountTypeResponse } from '../types';

export default function useBankAccountTypes() {
    const [accountTypeList, setAccountTypeList] = useState<DropDown>([]);

    const fetchAccountTypes = useCallback(async () => {
        const data: AccountTypeResponse | false = await getAccountTypes();
        if (data) {
            setAccountTypeList(data.accountType);
        }
    }, []);

    useEffect(() => {
        fetchAccountTypes();
    }, [fetchAccountTypes]);

    return { accountTypeList };
}
