import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';


import { getCodes } from '../../api/referral';

export type PartnerDataType = {
    value: string | number;
    label: string;
};

const useGetReferralCodes = (partnerId:any,searchText: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);
    const [codeData, setCodeData] = useState<PartnerDataType[]>([
        { value: 'default', label: 'Default' },
    ]);

    const getPartners = useCallback(async () => {
        setLoading(true);
        const data: any | false = await getCodes({
            userId: id,
            userType: role,
            partnerId,
            searchText,
        });
        if (data) {
            const referralCodes = data?.data.map((item: any) => ({
                value: item?.id,
                label: item?.referralCode,
            }));
            setCodeData([{ value:'default', label: 'Default' }, ...referralCodes]);
        }
        setLoading(false);
    }, [id, partnerId, role, searchText]);

    useEffect(() => {
        getPartners();
    }, [getPartners]);

    return { loading, codeData };
};

export default useGetReferralCodes;
