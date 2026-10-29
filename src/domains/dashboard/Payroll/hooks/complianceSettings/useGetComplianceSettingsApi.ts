import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getComplianceSettingsApi } from '../../api/complianceSettings/index';
import { ComplianceSettingsResponse } from '../../types/complianceSettings/complianceSettingsType';

export function useGetComplianceSettingsApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [complianceData, setComplianceData] = useState<any>();
    const [settingsId, setSettingsId] = useState<any>();

    const getComplianceSettings = useCallback(async () => {
        const data: ComplianceSettingsResponse | false = await getComplianceSettingsApi({
            userId: id,
            userType: role,
        });
        if (data) {
            setComplianceData(data);
            setSettingsId(data._id);
        }
    }, [id, role]);

    useEffect(() => {
        if (id && role) {
            getComplianceSettings();
        }
    }, [id, role, getComplianceSettings]);

    return { complianceData, getComplianceSettings, settingsId };
}
