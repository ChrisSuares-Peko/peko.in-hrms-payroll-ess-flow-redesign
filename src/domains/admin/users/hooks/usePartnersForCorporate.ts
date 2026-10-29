import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getpartner } from '../api/index';
import { categoryData, categoryResponse } from '../types/corporateUserTypes';

export type PartnerDataType = {
    value: string | number;
    label: string;
};

const usePartnersForCorporate = (searchText: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);
    const [categoryDatas, setCategoyDatas] = useState<categoryData[]>();
    const [partnerData, setPartnerData] = useState<PartnerDataType[]>([
        { value: 'default', label: 'Default' },
    ]);
    const getPartners = useCallback(async () => {
        setLoading(true);
        const data: categoryResponse | false = await getpartner({
            userId: id,
            userType: role,
            searchText,
        });
        if (data) {
            setCategoyDatas(data.data);
            const partners = data.data.map(item => ({
                value: item.id,
                label: item.name,
            }));
            setPartnerData([{ value: 'default', label: 'Default' }, ...partners]);
        }
        setLoading(false);
    }, [id, role, searchText]);

    useEffect(() => {
        getPartners();
    }, [getPartners]);

    return { categoryDatas, loading, partnerData };
};

export default usePartnersForCorporate;
