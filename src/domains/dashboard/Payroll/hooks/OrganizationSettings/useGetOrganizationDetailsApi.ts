import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getOrganizationSettingsApi } from '../../api/organizationSettings';
import {
    setCompanyProfile,
    setOrganizationTaxDetails,
    setPayrollSettings,
    setBankDetails,
} from '../../slices/orgSettings';

export default function useGetOrganizationSetting() {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const { refresh } = useAppSelector(state => state.reducer.orgSettings);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    const getOrganizationSetting = useCallback(async () => {
        setIsLoading(true);
        const res = await getOrganizationSettingsApi({ userId: id, userType: role });
        if (res) {
            dispatch(setCompanyProfile(res.companyProfile));
            dispatch(setOrganizationTaxDetails(res.organizationTaxDetails));
            dispatch(setPayrollSettings(res.payrollSettings));
            dispatch(setBankDetails(res.bankDetails));
        }
        setIsLoading(false);
        setHasLoaded(true);
    }, [dispatch, id, role]);

    useEffect(() => {
        getOrganizationSetting();
    }, [getOrganizationSetting, refresh]);

    return {
        isLoading,
        hasLoaded,
    };
}
