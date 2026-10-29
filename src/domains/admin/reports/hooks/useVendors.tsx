import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getVendors } from '../api/vendor';
import { VendorInfo, VendorInfoData } from '../types/vendors';

const useVendors = (searchText: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);
    const [dropDownData, setDropDownData] = useState<VendorInfo[]>();
    const getData = useCallback(async () => {
        setLoading(true);
        const data: VendorInfoData | false = await getVendors({
            userId: id,
            userType: role,
            searchText,
        });
        if (data) {
            setDropDownData(data.data);
        }
        setLoading(false);
    }, [id, role, searchText]);

    useEffect(() => {
        getData();
    }, [getData]);

    return { dropDownData, loading };
};

export default useVendors;
