import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCompanyProfile } from '../../api/organizationSettings';
import { GetCompanyProfileType } from '../../types/organizationSettings';

export default function useGetCompanyProfile() {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [companyProfileData, setCompanyProfileData] = useState<GetCompanyProfileType | null>(
        null
    );

    const fetchCompanyProfile = useCallback(async () => {
        setIsLoading(true);
        const res = await getCompanyProfile({ userId: id, userType: role });
        if (res) {
            setCompanyProfileData(res);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetchCompanyProfile();
    }, [fetchCompanyProfile]);

    return {
        isLoading,
        companyProfileData,
    };
}
