import { useCallback, useEffect, useState } from 'react';

import { getSubCorporateBasicInfo } from '../api/basicInfo';
import { SubCorporateProfileResponse } from '../types/index';

export default function useSubCorporateInfoApi() {
    const [profileData, setProfileData] = useState<SubCorporateProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const getSubUserBasicInfo = useCallback(async () => {
        setIsLoading(true);
        const resp: SubCorporateProfileResponse | false = await getSubCorporateBasicInfo();
        if (resp) {
            setProfileData(resp);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        getSubUserBasicInfo();
    }, [getSubUserBasicInfo]);

    return {
        profileData,
        isLoading,
    };
}
